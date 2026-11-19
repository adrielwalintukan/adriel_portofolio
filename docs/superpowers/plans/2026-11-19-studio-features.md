# Studio: sembilan fitur baru — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the nine studio features in the design: wall certificates open their modal, WITA day/night, RGB LEDs, the dog following the character, a guest book, Breakout on the TV, an auto tour, terminal easter eggs, and ambient particles.

**Architecture:** Pure logic (day phase, Breakout physics, terminal commands, guest-book validation) lives in small `.ts` modules tested with `node --test` from `scripts/*.test.mjs`. Scene parts stay in `src/studio/Room.tsx` / `Scene.tsx` and read shared module-level singletons mutated in `useFrame` (the existing `pointerDrag` / `tvOverlay` pattern). The guest book is one Vercel function `api/guestbook.ts` talking to Upstash Redis over REST with `fetch`.

**Tech Stack:** React 19, @react-three/fiber 9, three 0.187, Web Audio, Vercel functions, Upstash Redis REST, node:test (Node 22 strips TS types).

**Spec:** `docs/superpowers/specs/2026-11-19-studio-features-design.md`

## Global Constraints

- `/studio` stays a lazy chunk; nothing under `src/studio` is imported by the main site.
- No external assets and no new dependencies: procedural geometry, canvas textures, Web Audio, `fetch`.
- Muted teal/amber palette (`#3fb0b7`, `#1f6f6b`, `#b4693a`, `#e8c66a`); no emoji.
- All portfolio copy comes from `src/lib/constants.ts`; nothing invented.
- Touch screens (`coarse`) get smaller particle counts; `prefers-reduced-motion` disables the tour's camera flights (cuts instead) and particles.
- `.claude/launch.json` stays untracked. Commit only when Adriel asks.
- Done = `npx tsc -b`, `npx eslint .`, `npm test`, `npm run build` pass, plus headless screenshots (`--mute-audio`, `--force-prefers-reduced-motion` to snap the camera).

## Review Focus

- Guest-book POST with HTML/script in name or message: must render as plain canvas text, never HTML (canvas `fillText` only; the form never uses `innerHTML`).
- Guest-book env missing (local dev, preview deploys): GET returns `[]` with 200 and POST returns 503; the board still renders empty with its title.
- Clock at WITA midnight wrap (UTC 16:00 → 00 WITA) and UTC 21:30 → 05:30 dawn: `phaseAt` must handle hours ≥ 24.
- Tour interrupted mid-flight (Esc, a click on a station, the nav buttons): the tour stops and the clicked view wins; no stale timer moves the camera later.
- Breakout ball tunnelling through a brick or paddle at a long frame (`dt` clamped to 0.05): brick hit still registers.

---

### Task 1: Wall certificates open their modal

**Files:**
- Modify: `src/studio/Room.tsx` (`Frames`, `Room` props)
- Modify: `src/studio/Scene.tsx` (pass the prop through)
- Modify: `src/pages/StudioPage.tsx` (wire `setCertificate`)

**Interfaces:**
- Produces: `Room`/`StudioScene` prop `onCert: (id: string) => void`.

- [ ] **Step 1:** In `Frames`, each frame group's `onClick` calls `onCert(c.id)` (after the `pointerDrag.moved > 6` guard) instead of `onPick('certificates')`; hover label = that certificate's `title` from `CERTIFICATES_DATA`.
- [ ] **Step 2:** In `StudioPage`, `onCert={(id) => setCertificate(CERTIFICATES_DATA.find((c) => c.id === id) ?? null)}`; the modal already renders when `certificate` is set in any view.
- [ ] **Step 3:** `npx tsc -b && npx eslint src` → no errors. Headless screenshot of `/studio#certificates` unchanged.
- [ ] **Step 4:** Manual check in the browser pane: clicking the IBM frame opens the IBM modal. Commit `feat(studio): wall certificates open their modal`.

### Task 2: Terminal easter eggs

**Files:**
- Modify: `src/studio/terminal.ts`
- Modify: `scripts/terminal.test.mjs`
- Modify: `src/studio/Room.tsx` (effect handling), `src/pages/StudioPage.tsx` if the terminal result is applied there

**Interfaces:**
- Produces: `runCommand(...)` result gains `effect?: 'hire' | 'matrix' | 'bark' | 'rain'`.
- Produces: `src/studio/data.ts` singleton `roomFx: { kind: 'hire' | 'matrix' | null; until: number; rain: boolean }` (clock seconds), read in `useFrame` by Room parts.

- [ ] **Step 1: Failing tests** in `scripts/terminal.test.mjs`:
  - `runCommand('sudo hire adriel', data).effect === 'hire'` and its lines include `data.email`.
  - `runCommand('matrix', data).effect === 'matrix'`; `'bark'` → `'bark'`; `'rain'` → `'rain'`.
  - `runCommand('help', data).lines` contains none of `sudo`, `matrix`, `bark`, `rain`.
  - `runCommand('sudo rm -rf /', data)` returns an error line and no `effect`.
- [ ] **Step 2:** `npm test` → the new tests fail.
- [ ] **Step 3:** Add the cases in `runCommand`. `sudo` only matches `hire adriel` (case-insensitive); anything else prints `[‘adriel is not in the sudoers file. This incident will be reported.’, err]`.
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5:** Apply effects where the terminal result is consumed: `hire` sets `roomFx` for 3 s (teal flash: `Scene` ambient light colour lerps to `#3fb0b7`; ~60 confetti boxes fall in front of the desk, built once, hidden when idle); `matrix` sets `roomFx` for 8 s (both monitor textures repaint with falling green glyphs at 20 fps; ambient tint `#1f8f4f`); `bark` calls `unlock(); bark()`; `rain` toggles `roomFx.rain` (Task 5 draws it).
- [ ] **Step 6:** tsc/lint pass; screenshot of the desk view after typing `matrix` (browser pane). Commit `feat(studio): hidden terminal commands`.

### Task 3: Breakout on the TV

**Files:**
- Create: `src/studio/breakout.ts`
- Create: `scripts/breakout.test.mjs`
- Modify: `src/studio/data.ts` (`TvMode`, `TV_PICKS` or the menu list), `src/studio/Room.tsx` (`Lounge` TV painting), `src/pages/StudioPage.tsx` (menu indices, Esc handling, aria label)

**Interfaces:**
- Produces: `type BreakoutState = { bx; by; vx; vy; paddle: number; bricks: boolean[]; score: number; lives: number; over: boolean }` (0..1 screen space), `newGame(): BreakoutState`, `stepBreakout(s: BreakoutState, dt: number, paddleTo: number): void`, constants `ROWS = 5`, `COLS = 8`.
- Produces: `TvMode` adds `'breakout'`.

- [ ] **Step 1: Failing tests** in `scripts/breakout.test.mjs`:
  - `newGame()` has 40 bricks, `lives === 3`, `score === 0`.
  - A ball aimed straight up from under brick 0 removes exactly that brick and `score === 10` after stepping with `dt = 0.05` until `vy > 0` (no tunnelling at the long frame).
  - A ball below the paddle with the paddle far away loses a life and resets to the paddle; at `lives === 0`, `over === true`.
  - Clearing all bricks refills them (`bricks.every(Boolean)`) and keeps the score.
- [ ] **Step 2:** `npm test` → fail (module missing).
- [ ] **Step 3:** Implement `breakout.ts`. Sub-step the ball in increments of at most 0.01 screen units per tick so a 0.05 s frame cannot skip a brick row.
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5:** TV menu becomes Pong, Breakout, YouTube. In `'breakout'` mode the pointer x drives the paddle exactly like Pong; paint bricks in the palette rows (`#3fb0b7`, `#1f6f6b`, `#e8c66a`, `#b4693a`, `#c0392b`), score, lives and `BEST n` from `localStorage['studio-breakout-best']` (read/write inside try/catch). On `over`, show "GAME OVER · click to restart"; a click on the screen calls `newGame()`. Esc returns to the menu.
- [ ] **Step 6:** tsc/lint pass; headless/browser screenshot of the TV in Breakout. Commit `feat(studio): breakout on the TV with a best score`.

### Task 4: RGB LEDs

**Files:**
- Modify: `src/studio/sound.ts`
- Modify: `src/studio/Room.tsx` (`Desk`)

**Interfaces:**
- Produces: `musicPulse(): number` in `sound.ts` — 0 when music is off; otherwise `Math.exp(-(ctx.currentTime - lastKick) * 6)` where `lastKick` is the scheduled time of the most recent kick that is ≤ `ctx.currentTime`.

- [ ] **Step 1:** In `schedule`, record kick times into a small array on `music`; `musicPulse()` picks the latest one not in the future.
- [ ] **Step 2:** In `Desk`, add an emissive strip (`boxGeometry` 0.02 × 0.01 × desk length) along the back-bottom edge of the desk top and reuse the tower fan meshes. Each frame: hue `(t / 20) % 1`, colour via `setHSL(hue, 0.7, 0.55)`, `emissiveIntensity = 1.2 + musicPulse() * 2`. Fans offset the hue by `i * 0.12`.
- [ ] **Step 3:** tsc/lint pass; screenshot of the desk. Commit `feat(studio): rgb strip that drifts and pulses with the music`.

### Task 5: Ambient particles and rain

**Files:**
- Modify: `src/studio/Room.tsx` (new `Dust`, `Window` rain)
- Modify: `src/studio/Scene.tsx` (pass `coarse` / `reduced`)

**Interfaces:**
- Consumes: `roomFx.rain` (Task 2).
- Produces: `Dust({ count, box: [center: Vec3, size: Vec3] })`.

- [ ] **Step 1:** `Dust`: one `THREE.Points` with `count` random positions in the box, `PointsMaterial` size 0.012, colour `#ffe2b8`, `transparent`, opacity 0.5, `depthWrite={false}`, additive blending; each frame drift y up 0.02 m/s with a small sine sway on x/z, wrapping at the box top. Two instances: gallery spot cone (center `[-4.9, 2.9, 2.4]`, size `[1.6, 1.8, 3.4]`), desk pendant (center `[1.4, 2.6, -4.4]`, size `[1.0, 2.0, 1.0]`). Counts 60 each, 20 on `coarse`; not rendered when `reduced`.
- [ ] **Step 2:** Rain: on mount `roomFx.rain = Math.random() < 1 / 3` (once per page load). When on, a plane in front of the window glass shows a 256×512 canvas of short diagonal streaks whose texture `offset.y` scrolls 1.5/s; opacity 0.45.
- [ ] **Step 3:** tsc/lint pass; screenshot of the room with rain forced on. Commit `feat(studio): dust in the light and rain on the window`.

### Task 6: WITA day/night

**Files:**
- Create: `src/studio/daylight.ts`
- Create: `scripts/daylight.test.mjs`
- Modify: `src/studio/textures.ts` (`windowTexture(phase)`), `src/studio/Room.tsx` (`Window`), `src/studio/Scene.tsx` (lights, background)

**Interfaces:**
- Produces: `type Phase = 'dawn' | 'day' | 'dusk' | 'night'`, `witaHour(d: Date): number` (0..24, fractional), `phaseAt(d: Date): Phase`, `LIGHT: Record<Phase, { ambient: number; hemi: number; sun: number; bg: string }>`.
- Produces: React hook `usePhase(): Phase` (in `daylight.ts`, re-evaluates every 60 s with `setInterval`).

- [ ] **Step 1: Failing tests** in `scripts/daylight.test.mjs`:
  - `phaseAt(new Date('2026-11-19T04:00:00Z'))` → `'day'` (12:00 WITA).
  - `'2026-11-19T10:00:00Z'` → `'dusk'` (18:00); `'2026-11-19T16:00:00Z'` → `'night'` (00:00, wrap); `'2026-11-19T21:30:00Z'` → `'dawn'` (05:30); `'2026-11-19T22:00:00Z'` → `'day'` (06:00 boundary).
  - `witaHour(new Date('2026-11-19T17:45:00Z')) === 1.75`.
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** Implement: `witaHour = (d.getUTCHours() + d.getUTCMinutes() / 60 + 8) % 24`; dawn [5,6), day [6,17), dusk [17,19), night otherwise.
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5:** `windowTexture(phase)`: day = blue gradient `#7fb7d9`→`#cfe6f0` with soft clouds and the city silhouette in `#5d7488`; dusk = `#f0a35e`→`#5b3f73`; dawn = `#f3c29b`→`#8fb6cf`; night = the current painting. `Window` uses `usePhase()` and rebuilds the texture in `useMemo([phase])`. `Scene` sets ambient/hemisphere/directional intensities and background from `LIGHT[phase]` (night = today's values: ambient 0.55, hemi 0.5, current sun intensity, bg `#070c16`; day raises ambient to 0.9, hemi 0.8, sun ×1.6, bg `#0d1a26`).
- [ ] **Step 6:** tsc/lint pass; screenshots with the phase forced to day and night (temporarily pass a `Date` in a scratch build, not committed). Commit `feat(studio): window and light follow the time in Manado`.

### Task 7: The dog follows the character

**Files:**
- Modify: `src/studio/Character.tsx`, `src/studio/Room.tsx` (`Dog`)

**Interfaces:**
- Produces: `export const charPos = { x: 0, z: 0, busy: false }` in `Character.tsx`, written every frame (`busy` = seated or at the sideboard/shelf stop).

- [ ] **Step 1:** Character writes its root world x/z and `busy` into `charPos` each frame.
- [ ] **Step 2:** `Dog` gains a `following` state: when resting and `t > nextFollow` (first 40–70 s after load, then every 40–70 s), it walks to a point 0.8 m behind `charPos` (opposite the character's facing) for 15–25 s, re-targeting each frame; if `charPos.busy`, it stops within 0.9 m and lies down. When the time runs out it picks a rug target (existing wander) and lies down there. Outside `following`, behaviour is unchanged.
- [ ] **Step 3:** tsc/lint pass; browser-pane check (pane visible) that the dog trails him and returns. Commit `feat(studio): the dog follows him around now and then`.

### Task 8: Take the tour

**Files:**
- Create: `src/studio/tour.ts`
- Modify: `src/pages/StudioPage.tsx`

**Interfaces:**
- Produces: `TOUR: { view: ViewId; caption: string }[]` built from constants, `TOUR_STEP_MS = 6000`.

- [ ] **Step 1:** `tour.ts` builds captions only from constants: room ("Adriel's studio in Manado — a quick look around."), projects (`${DESK_PROJECTS.length} projects on the computer`), experience (latest `EXPERIENCE_TIMELINE[0].title` at `.role`), skills (`SKILLS_DATA` category names joined), certificates (`${CERTIFICATES_DATA.length} certificates; the framed ones open when clicked`), about (`CONTACT_INFO.availability`), then room.
- [ ] **Step 2:** `StudioPage`: a "Take the tour" button in the header (desktop text, icon-only on narrow screens, `aria-label`). State `tour: number | null`. While running: `setView(TOUR[i].view)`, panels suppressed (`panel` is null when `tour !== null`), caption shown in a bottom bar with Skip (next step) and Stop; caption mirrored to the `aria-live` region. A `setTimeout(TOUR_STEP_MS)` advances; it is cleared on every step change and on unmount. Any `pointerdown` on the canvas, any key, or any nav/station click sets `tour` to null (the clicked view still applies).
- [ ] **Step 3:** tsc/lint pass; browser-pane run of the full tour, plus a check that Esc mid-flight stops it and nothing moves afterwards. Commit `feat(studio): guided tour of the stations`.

### Task 9: Guest book

**Files:**
- Create: `api/guestbook.ts`, `src/lib/guestbook.ts` (pure validation + filter, imported by the API with the `.js` extension as `api/ask.ts` does)
- Create: `scripts/guestbook.test.mjs`
- Modify: `src/studio/Room.tsx` (new `GuestBoard`), `src/studio/textures.ts` (cork + note painting reuse `noteTexture`), `src/pages/StudioPage.tsx` (form overlay), `README.md` (how to delete a message)

**Interfaces:**
- Produces: `type Note = { name: string; message: string; at: number }`, `clean(input: unknown): { ok: true; note: Omit<Note, 'at'> } | { ok: false; error: string }` — trims, collapses whitespace, name 1–24 chars, message 1–80 chars, rejects non-empty `website` (honeypot), rejects text matching the blocked-word list (case-insensitive, word boundaries, also catching common leetspeak `0→o 1→i 3→e 4→a @→a`).
- Produces: `GET /api/guestbook` → `{ notes: Note[] }` (latest 8); `POST /api/guestbook` body `{ name, message, website }` → 201 `{ note }` | 400 `{ error }` | 429 | 503.

- [ ] **Step 1: Failing tests** in `scripts/guestbook.test.mjs`: valid input passes and trims; 25-char name and 81-char message fail; empty fields fail; `website: 'x'` fails; a blocked word in Indonesian and in English fails, also in leetspeak; `<script>` text passes `clean` unchanged (rendering is canvas-only).
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** Implement `src/lib/guestbook.ts`.
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5:** `api/guestbook.ts` (same `json()` helper style as `api/github-activity.ts`): Upstash REST via `fetch(`${URL}/pipeline`, { headers: { Authorization: `Bearer ${TOKEN}` } })` with env `KV_REST_API_URL ?? UPSTASH_REDIS_REST_URL` and `KV_REST_API_TOKEN ?? UPSTASH_REDIS_REST_TOKEN`. Missing env: GET → `{ notes: [] }`, POST → 503. POST: IP from `x-forwarded-for` first entry; `INCR gb:ip:<ip>` + `EXPIRE 3600` → 429 above 3; then `LPUSH gb:notes <json>` + `LTRIM gb:notes 0 49`. GET: `LRANGE gb:notes 0 7`, `Cache-Control: s-maxage=15`.
- [ ] **Step 6:** `GuestBoard` on the left wall at `[-5.9, 2.6, -0.5]` rotated π/2: wood frame 1.28 × 0.98, cork plane 1.2 × 0.9 (`#b88a5a` canvas with speckles), title "GUEST BOOK" painted on a card at the top. Up to 8 notes in a 4 × 2 grid with small tilt, colours cycling `#e8c66a`, `#8fcfc9`, `#e9a77f`, `#fbfaf5`, each a `noteTexture` with the message wrapped to 3 lines and `— name`; pins as in `PinBoard`. Fetch on mount; no notes → an empty-state card "Be the first to sign". Click (with the drag guard) → `onSign()`.
- [ ] **Step 7:** `StudioPage` form overlay (same styling as the existing panels): name and message inputs with `maxLength` 24/80 and live counters, a visually hidden `website` input (`tabIndex={-1}`, `autoComplete="off"`), Send / Cancel, inline error from the API, success closes the form and refetches the board. Esc closes. Labels and focus trap like the existing modal.
- [ ] **Step 8:** `README.md`: "Guest book" section — add Upstash via Vercel Marketplace, env names, delete a message in the Upstash Data Browser (`gb:notes` → remove the item).
- [ ] **Step 9:** tsc/lint/test/build pass; local check with env unset (empty board, 503 shown as "Guest book is offline"); screenshot. Commit `feat(studio): guest book on a cork board`.

### Task 10: Final verification

- [ ] `npx tsc -b`, `npx eslint .`, `npm test`, `npm run build` all pass.
- [ ] Headless screenshots: room, certificates, TV Breakout, desk RGB; browser-pane run of tour and dog follow; preview tab left off `/studio` (no background audio).
