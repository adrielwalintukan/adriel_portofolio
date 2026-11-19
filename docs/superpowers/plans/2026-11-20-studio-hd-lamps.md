# Studio HD, lamp lighting and room details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the studio sharper and smooth (HD mode, adaptive quality), light the room only from its lamps with a less soft look, and add Tiara-inspired details (string lights, curtains, neon, window toggle, shortcuts), without touching the shadows.

**Architecture:** A pure `quality.ts` decides HD/fast and the adaptive step-downs (tested with `node --test`). A lazy `Effects.tsx` (Bloom, SMAA, ACES, vignette, saturation/contrast, AO) mounts only in HD mode. Lights in `Scene.tsx` are cut down to lamps; `daylight.ts` gains an override and lower fill values. New room props live in `Room.tsx`; shortcuts live in a pure `keymap.ts`.

**Tech Stack:** React 19, @react-three/fiber 9, three 0.187, `@react-three/postprocessing` + `postprocessing` (new, studio chunk only), node:test.

**Spec:** `docs/superpowers/specs/2026-11-20-studio-hd-lamps-design.md`

## Global Constraints

- Shadows are NOT changed: directional light position `[7, 12, 7]`, `castShadow`, `shadow-mapSize [shadowSize, shadowSize]` (4096 desktop / 1024 touch), `shadow-bias -0.0003`, `shadow-normalBias 0.02`, camera bounds ±9, and `<Canvas shadows>` stay exactly as they are.
- `/studio` stays a lazy chunk; effects are `React.lazy` and only load in HD mode.
- Touch screens (`(pointer: coarse)`) default to Fast mode: no post-processing, `shadowSize` 1024, dpr cap 1.25.
- No external assets; copy from `constants`; muted teal/amber palette; no emoji.
- `localStorage` access always in try/catch.
- Done = `npx tsc -b`, `npx eslint .`, `npm test`, `npm run build` pass, plus headless GPU screenshots (`GPU=1 WS=1280,800 node <scratchpad>/cdp.mjs`) and a before/after FPS measure.

## Review Focus

- Shadow props in `Scene.tsx` are byte-identical to before (a test pins them).
- A slow first few seconds (shaders compiling, textures loading) must not trigger the adaptive step-down.
- `localStorage` blocked or throwing: HD choice falls back to the device default, no crash.
- Shortcuts never fire while typing in an input/textarea or while a modal is open, and ignore Ctrl/Meta/Alt combos.
- Switching HD on/off at runtime does not crash or leave a stale effect composer (remount by `key`).
- Bloom must not wash out screen text (terminal, desktop) or the certificates.

---

### Task 1: Quality policy

**Files:**
- Create: `src/studio/quality.ts`, `scripts/quality.test.mjs`

**Interfaces:**
- Produces:
  - `type Quality = { hd: boolean; ao: boolean; dpr: number }`
  - `const FAST_DPR = 1.25`
  - `defaultQuality(coarse: boolean, devicePixelRatio: number, saved: 'on' | 'off' | null): Quality` (coarse and no saved choice → Fast; saved wins; HD dpr = `clamp(devicePixelRatio, 1.5, 2)`; Fast dpr = `min(devicePixelRatio, FAST_DPR)`; `ao` = `hd`)
  - `type Monitor = { slow: number; frames: number; since: number }`, `newMonitor(): Monitor`
  - `sample(m: Monitor, now: number, fps: number, q: Quality, auto: boolean): { monitor: Monitor; quality: Quality }` — ignores the first 4000 ms after `m.since`; in a 2 s window with `fps < 30` increments `slow`; two slows in a row step down once (AO off → dpr 1.25 → Fast); `auto === false` never steps down.

- [ ] **Step 1: Failing tests** in `scripts/quality.test.mjs`:
  - `defaultQuality(false, 2, null)` → `{ hd: true, ao: true, dpr: 2 }`; `(false, 1, null)` → `dpr 1.5`; `(true, 3, null)` → `{ hd: false, ao: false, dpr: 1.25 }`; saved `'on'` on a coarse device → `hd: true`; saved `'off'` on desktop → `hd: false`.
  - `sample` with `fps = 10` at `now = m.since + 1000` (warm-up) never changes quality.
  - Feeding two consecutive slow 2 s samples after warm-up turns `ao` off; the next two set `dpr` to 1.25; the next two set `hd` false; further slow samples change nothing.
  - A fast sample (`fps = 60`) resets `slow` to 0 (a single slow sample then a fast one never steps down).
  - `auto = false` keeps quality unchanged however slow.
- [ ] **Step 2:** `npm test` → fail (module missing).
- [ ] **Step 3:** Implement `quality.ts` (pure, no React).
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5:** Commit `feat(studio): quality policy`.

### Task 2: HD pipeline, HD toggle, adaptive monitor

**Files:**
- Modify: `package.json` (via `npm i @react-three/postprocessing postprocessing`)
- Create: `src/studio/Effects.tsx`
- Modify: `src/studio/Scene.tsx`, `src/pages/StudioPage.tsx`

**Interfaces:**
- Consumes: `Quality`, `defaultQuality`, `newMonitor`, `sample`, `FAST_DPR` from Task 1.
- Produces: `StudioScene` props `quality: Quality` and `onQuality: (q: Quality) => void`; default-exported `Effects({ ao }: { ao: boolean })`.

- [ ] **Step 1:** `npm i @react-three/postprocessing postprocessing`; confirm `npx tsc -b` and `npm run build` still pass (peer versions must accept three 0.187 and R3F 9; if the wrapper does not, rule it in the ledger and fall back to approach 2 of the spec).
- [ ] **Step 2:** `Effects.tsx` (`React.lazy` imported in `Scene.tsx`): `EffectComposer multisampling={0}` containing, in order, `N8AO` (only when `ao`, `halfRes`, `quality="performance"`), `Bloom` (`mipmapBlur`, `luminanceThreshold 0.9`, `luminanceSmoothing 0.2`, `intensity 0.6`), `HueSaturation` (saturation `-0.15`), `BrightnessContrast` (contrast `0.12`), `ToneMapping` (`ACES_FILMIC`), `Vignette` (`offset 0.3`, `darkness 0.4`), `SMAA`. While mounted, set `gl.toneMapping = NoToneMapping` and restore `ACESFilmicToneMapping` on unmount.
- [ ] **Step 3:** `Scene.tsx`: `gl={{ antialias: !quality.hd, powerPreference: 'high-performance', stencil: false }}`, `dpr={quality.dpr}`; `{quality.hd && <Suspense fallback={null}><Effects key={`${quality.dpr}`} ao={quality.ao} /></Suspense>}`; a `QualityMonitor` component using `useFrame` to average FPS over 2 s windows (ignores `delta > 0.25`), calling `sample` and `onQuality` when the result differs. Do not touch any shadow prop.
- [ ] **Step 4:** `StudioPage.tsx`: state `quality` from `defaultQuality(coarse, window.devicePixelRatio, savedChoice())`; `savedChoice` reads `localStorage['studio-hd']` in try/catch; `autoQuality` ref is false once the visitor uses the toggle. Header "HD" chip (`aria-pressed`, `title`), placed before the music button; toggling writes `localStorage` (try/catch) and sets `defaultQuality(coarse, dpr, 'on'|'off')`. `dpr` prop to `StudioScene` becomes `quality.dpr`; `shadowSize` unchanged.
- [ ] **Step 5:** tsc/lint/test/build pass; GPU screenshot in HD shows bloom on lamps and the screen text still legible; toggle to Fast and back without console errors. Commit `feat(studio): HD pipeline with adaptive quality`.

### Task 3: Lamp-only lighting and a tougher look

**Files:**
- Modify: `src/studio/daylight.ts`, `src/studio/Scene.tsx`, `scripts/daylight.test.mjs`
- Create: `scripts/lights.test.mjs`

**Interfaces:**
- Consumes: existing `LIGHT: Record<Phase, { ambient; hemi; sun; bg }>`.
- Produces: `LIGHT` with `ambient <= 0.1` and `hemi <= 0.1` for every phase; new field `window: { color: string; intensity: number }` per phase (moon `#8fa9c8` weak at night, warm white stronger by day); `ambient`/`hemi` no longer rise by day.

- [ ] **Step 1: Failing tests:**
  - `scripts/daylight.test.mjs`: for every phase, `LIGHT[p].ambient <= 0.1` and `LIGHT[p].hemi <= 0.1`; `LIGHT.day.window.intensity > LIGHT.night.window.intensity`.
  - `scripts/lights.test.mjs`: reads `src/studio/Scene.tsx` as text and asserts it still contains each unchanged shadow prop string (`shadow-bias={-0.0003}`, `shadow-normalBias={0.02}`, `shadow-camera-left={-9}`, `shadow-camera-right={9}`, `shadow-camera-top={9}`, `shadow-camera-bottom={-9}`, `position={[7, 12, 7]}`, `castShadow`, `shadow-mapSize={[shadowSize, shadowSize]}`) and does NOT contain the removed fill colours `#8ec4e0`, `#7fb0c8`, `#b6cbd8`.
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** Lower `LIGHT` values (ambient ~0.06, hemi ~0.08 at night, same by day); keep `sun` as the shadow caster but warmer (`color="#ffc58a"`) and about 0.7 of today's value; add the `window` light as a `pointLight` at the window (`[4.0, 3.0, -5.4]`) using `LIGHT[phase].window`. Remove the cool window fill, the left-room fill, the front fill and the teal monitor bounce from `Scene.tsx`; keep the pendant, floor lamp (in Room), TV glow, flask, gallery strip. Hemisphere colours become neutral (`#b8c0c8` / `#2a1c12`).
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5:** Screenshots room/projects/certificates/about at night and with the phase forced to day: the room is lit by lamps, faces and panels stay readable, nothing is pitch black; adjust intensities until so (record final values in the ledger). Commit `feat(studio): light the room from its lamps only`.

### Task 4: String lights, curtains and neon

**Files:**
- Modify: `src/studio/Room.tsx`, `src/studio/textures.ts`

**Interfaces:**
- Produces: `FairyLights` (instanced bulbs along the top of the back wall, `y ≈ 4.7`, x from -5.6 to 5.2, gentle sine sway, twinkle by per-bulb phase), `Curtains` (two planes either side of the window at `x ≈ 4.0 ± 1.15`, vertex-free sway via rotation), `NeonSign` using `neonTexture()` from `textures.ts` ("ADRIEL", muted teal `#5fb7bd`, emissive, on the left wall above the shelf or on the back wall right of the portrait; pick the spot that is empty).
- `particles`/`reduced`: when `reduced` is true the string lights and curtains do not animate.

- [ ] **Step 1:** Add `neonTexture(): THREE.CanvasTexture` (transparent background, rounded tube-style outline text with a soft shadow glow).
- [ ] **Step 2:** `FairyLights`: one `InstancedMesh` of 28 small spheres with `meshBasicMaterial toneMapped={false}`, colours alternating `#ffd9a0` and `#8fcfc9`; per-frame matrices updated only when not `reduced`; no `pointLight`s (bloom does the glow).
- [ ] **Step 3:** `Curtains`: two `PlaneGeometry` meshes (muted `#5a4a3a`, `DoubleSide`), swaying `rotation.z` ±0.015 over 6 s.
- [ ] **Step 4:** `NeonSign` plane with `meshBasicMaterial toneMapped={false}`; add to `Room`.
- [ ] **Step 5:** tsc/lint pass; screenshot of the room shows all three, bloom glow in HD; the lamp-only rule holds (they are emissive, not lights). Commit `feat(studio): string lights, curtains and neon`.

### Task 5: Window day/night toggle

**Files:**
- Modify: `src/studio/daylight.ts`, `src/studio/Room.tsx`, `scripts/daylight.test.mjs`

**Interfaces:**
- Produces: `setPhaseOverride(p: Phase | null)`, `getPhaseOverride(): Phase | null`, `usePhase()` returns the override when set (subscribes with `useSyncExternalStore`), `togglePhase(now?: Date): Phase` (if the current effective phase is `night` or `dawn` → `day`, else `night`; stores it as the override).

- [ ] **Step 1: Failing tests:** `togglePhase(new Date('2026-11-19T16:00:00Z'))` (night in WITA) returns `'day'` and `getPhaseOverride() === 'day'`; toggling again returns `'night'`; `setPhaseOverride(null)` clears it; `usePhase`'s underlying `effectivePhase(date)` returns the override over the clock.
- [ ] **Step 2:** `npm test` → fail. **Step 3:** implement (module-level store, listeners set). **Step 4:** pass.
- [ ] **Step 5:** `Window` in `Room.tsx` becomes clickable: `onClick` (with the `pointerDrag.moved > 6` guard) calls `togglePhase()`; hover label `Window — toggle day / night`. Screenshot day vs night. Commit `feat(studio): click the window to switch day and night`.

### Task 6: Keyboard shortcuts and help

**Files:**
- Create: `src/studio/keymap.ts`, `scripts/keymap.test.mjs`, `src/studio/Help.tsx`
- Modify: `src/pages/StudioPage.tsx`

**Interfaces:**
- Produces: `type KeyCtx = { typing: boolean; modal: boolean }`, `type KeyAction = { type: 'help' | 'music' | 'tour' | 'night' | 'room' } | { type: 'station'; id: 'projects' | 'skills' | 'experience' | 'certificates' | 'about' } | null`, `keyAction(e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }, ctx: KeyCtx): KeyAction`.

- [ ] **Step 1: Failing tests:** `?`→help, `m`/`M`→music, `t`→tour, `n`→night, `r`→room, `1`..`5`→stations in the order Projects, Skills, Experience, Awards (`certificates`), About; `null` when `typing`, when `modal`, with Ctrl/Meta/Alt, and for unknown keys.
- [ ] **Step 2:** `npm test` → fail. **Step 3:** implement `keyAction`. **Step 4:** pass.
- [ ] **Step 5:** `StudioPage` window `keydown` listener (separate from the existing one) computes `typing` from `e.target` (INPUT/TEXTAREA/contenteditable) and `modal` from `project || certificate || signing || helpOpen`, dispatches: help toggles `Help`, music calls `toggleMusic`, tour starts/stops, night calls `togglePhase`, room `go('room')`, station `go(id)`. `Help.tsx` is a glass dialog listing every shortcut (`role="dialog"`, Esc closes, focus on open). Add a small "?" chip next to the HD chip.
- [ ] **Step 6:** Headless check: press `m`, `n`, `3`; typing in the terminal input does not trigger. Commit `feat(studio): keyboard shortcuts and help`.

### Task 7: Verify and review

- [ ] `npx tsc -b`, `npx eslint .`, `npm test`, `npm run build` all pass.
- [ ] FPS before/after: measure `requestAnimationFrame` rate over 4 s with `GPU=1 WS=1280,800` in Fast and HD, and report both (relative, headless).
- [ ] Screenshots: room, projects, certificates, about, at night and forced day; HD vs Fast side by side.
- [ ] One fresh reviewer (most capable model) on the whole diff with this plan's Review Focus; fix Critical/Important via RED→GREEN; ledger minors.
