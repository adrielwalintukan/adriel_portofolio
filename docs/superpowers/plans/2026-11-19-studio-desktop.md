# Studio desktop (AdrielOS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the main monitor's folder grid with a multi-window desktop ("AdrielOS"): icons, Explorer, Photos, Media Player, Notepad, Terminal, Browser, taskbar, Start menu, WITA clock.

**Architecture:** Pure logic (virtual file system built from `constants`, window manager reducer) lives in `src/studio/os/*.ts` and is tested with `node --test`. The UI is a real HTML `Desktop` laid out at `SCREEN_PX` (960x532) and mapped onto the 3D screen by the existing `deskOverlay` + `pinToScreen` mechanism, mounted for the whole Projects view. From the room, the screen texture paints the same static wallpaper/icons/taskbar.

**Tech Stack:** React 19, @react-three/fiber 9, three 0.187, lucide-react, node:test (Node 22 strips TS types). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-19-studio-desktop-design.md`

## Global Constraints

- Not a copy of Microsoft Windows: name **AdrielOS**, own logo (teal "A" in a rounded square).
- All content from `src/lib/constants.ts` (`DESK_PROJECTS`, `CERTIFICATES_DATA`, `CONTACT_INFO`, `SKILLS_DATA`, `EXPERIENCE_TIMELINE`); nothing invented. The one exception is the Recycle Bin joke file, which makes no factual claim.
- `/studio` stays a lazy chunk; no new dependencies; teal/amber palette; no emoji.
- Layout size is `SCREEN_PX` = 960 x 532; windows never leave that area.
- Only one video makes sound at a time; opening another replaces it.
- Done = `npx tsc -b`, `npx eslint .`, `npm test`, `npm run build` pass, plus real-click proof in headless Chrome (GPU: `GPU=1 WS=1280,800 node <scratchpad>/cdp.mjs`).

## Review Focus

- Closing the last window (X, Esc, taskbar) returns to the desktop with icons visible, never a blank screen.
- Dragging a window by its title bar past the screen edge keeps the title bar reachable.
- A project with no video/images/links (e.g. `inDevelopment` filtered out, or only a cover image) still opens a valid folder with `README.txt`.
- Esc with no window open leaves the Projects view; Esc with windows closes only the top one.
- Opening a video while another plays leaves exactly one `<video>` element and mutes room music (existing `videoPlaying`).
- Entering Projects from the terminal `open <n>` command opens that project's folder in Explorer, not a video.

---

### Task 1: Virtual file system

**Files:**
- Create: `src/studio/os/fs.ts`
- Create: `scripts/osfs.test.mjs`

**Interfaces:**
- Produces:
  - `type FileKind = 'image' | 'video' | 'youtube' | 'text' | 'link' | 'app'`
  - `type FsFile = { type: 'file'; name: string; kind: FileKind; src?: string; text?: string; app?: AppId; projectId?: string }`
  - `type FsFolder = { type: 'folder'; name: string; children: FsNode[]; projectId?: string }`
  - `type FsNode = FsFile | FsFolder`
  - `type AppId = 'explorer' | 'photos' | 'media' | 'notepad' | 'terminal' | 'browser'`
  - `buildFs(): FsFolder` (root with `Projects`, `Certificates`, `Pictures`, `Recycle Bin`, `about-me.txt`)
  - `resolve(root: FsFolder, path: string[]): FsNode | null`
  - `readmeOf(project: Project): string`

- [ ] **Step 1: Failing tests** in `scripts/osfs.test.mjs`:
  - `buildFs()` root children names include `Projects`, `Certificates`, `Pictures`, `Recycle Bin`, `about-me.txt`.
  - `Projects` has exactly `DESK_PROJECTS.length` folders; each contains `README.txt` (kind `text`) whose text includes the project's title and every technology.
  - A project with `video` has a file of kind `video` with `src === project.video`; one with `youtubeId` a `youtube` file; one with `repoUrl`/`liveUrl` has a `link` file with `src` equal to that URL.
  - A project whose `images` is empty has no `image` files and still has `README.txt`.
  - `Pictures` image count equals the sum of `images.length` over `DESK_PROJECTS`.
  - `Certificates` has one `image` file per `CERTIFICATES_DATA` entry that has an `image`.
  - `resolve(root, ['Projects', DESK_PROJECTS[0].title, 'README.txt'])` returns that file; `resolve(root, ['nope'])` returns `null`.
  - `about-me.txt` text includes `CONTACT_INFO.city` and `EXPERIENCE_TIMELINE[0].title`.
  - `Recycle Bin` has one text file.
- [ ] **Step 2:** `npm test` → new tests fail (module missing).
- [ ] **Step 3:** Implement `fs.ts` importing `PROJECTS`/`CERTIFICATES_DATA`/etc. from `@/lib/constants` (use a relative `../../lib/constants.ts` path if node's loader cannot resolve the `@/` alias; match what existing tests do) and `DESK_PROJECTS` from `../data`. If `data.ts` is not node-loadable (it imports React-side modules), filter `!inDevelopment` locally instead.
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5:** Commit `feat(studio): virtual file system for the desktop`.

### Task 2: Window manager

**Files:**
- Create: `src/studio/os/windows.ts`
- Create: `scripts/oswindows.test.mjs`

**Interfaces:**
- Produces:
  - `type Win = { id: number; app: AppId; title: string; arg?: { path?: string[]; src?: string; index?: number }; x: number; y: number; w: number; h: number; z: number; min: boolean; max: boolean }`
  - `type WinState = { wins: Win[]; next: number; top: number }`
  - `const AREA = { w: 960, h: 532 - 40 }` (desktop minus a 40px taskbar)
  - `initial(): WinState`
  - `open(s: WinState, app: AppId, title: string, arg?: Win['arg'], mobile?: boolean): WinState` (cascade by 28px per open window, wrapping; `mobile` opens maximized)
  - `close(s, id)`, `focus(s, id)` (raises z and un-minimizes), `minimize(s, id)`, `toggleMax(s, id)`, `move(s, id, x, y)` (clamped so the title bar stays inside `AREA`)
  - `activeId(s: WinState): number | null` (highest z among non-minimized)

- [ ] **Step 1: Failing tests** in `scripts/oswindows.test.mjs`:
  - Opening two windows gives the second a higher `z` and a position offset by 28 from the first.
  - `focus` on the lower window raises it above the other; focusing a minimized window un-minimizes it.
  - `minimize` hides it and `activeId` falls to the next one; closing the last window gives `activeId === null`.
  - `toggleMax` twice restores the previous `x, y, w, h`.
  - `move(s, id, -5000, 5000)` clamps so `x + w >= 80`, `x <= AREA.w - 80`, `0 <= y <= AREA.h - 32` (title bar reachable).
  - `open(..., mobile = true)` returns a maximized window.
  - `close` of an unknown id returns the same state.
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** Implement pure functions returning new state objects; no React.
- [ ] **Step 4:** `npm test` → pass.
- [ ] **Step 5:** Commit `feat(studio): window manager for the desktop`.

### Task 3: Desktop shell (wallpaper, icons, windows, taskbar, Start menu)

**Files:**
- Create: `src/studio/os/Desktop.tsx`, `src/studio/os/Window.tsx`, `src/studio/os/Taskbar.tsx`
- Modify: `src/pages/StudioPage.tsx` (mount `Desktop` in the `deskOverlay` div for the whole `view === 'projects'`; remove `DeskWindow` usage and `deskOpen` project-window state)
- Modify: `src/studio/data.ts` (`DESK_COLS` and `deskSel` no longer needed once the grid is gone; keep exports until Task 9 removes them)

**Interfaces:**
- Consumes: `buildFs`, `win*` functions from Tasks 1-2.
- Produces: `Desktop({ onExit, onDetails, termData, onEffect }: DesktopProps)` where `onExit: () => void` (back to the room), `onDetails: (projectId: string) => void` (opens `ProjectGalleryModal`), plus the terminal glue from `StudioPage` (`submitCommand` equivalent). Internally holds `useReducer`-style `WinState` and renders `apps` via a registry `APPS: Record<AppId, (props: AppProps) => JSX.Element>` that later tasks fill.
- Produces: `AppProps = { win: Win; fs: FsFolder; openApp: (app: AppId, title: string, arg?: Win['arg']) => void; close: () => void }`.

- [ ] **Step 1:** `Desktop` renders the wallpaper (CSS gradient teal/navy + faint grid), six desktop icons (Explorer, Photos, Projects folder, `about-me.txt`, Terminal, Recycle Bin) as `<button>`s: single click selects, double click or Enter opens; arrow keys move the selection.
- [ ] **Step 2:** `Window` has a title bar (icon, title, minimize, maximize, close with `aria-label`s), drag by title bar (pointer capture; call `move`), double click title bar toggles max, mousedown anywhere focuses. Role `dialog` with `aria-label` = title. Maximized windows fill `AREA`.
- [ ] **Step 3:** `Taskbar` (40px, bottom): AdrielOS logo button opens the Start menu (apps list, up to 4 `featured` projects opening their Explorer folder, "Shut down" calls `onExit`), one button per window (click: focus, or minimize if already top), WITA clock updating each 30 s (`Asia/Makassar`).
- [ ] **Step 4:** Esc handler inside `Desktop` (keydown on its root, `stopPropagation` is not enough because `StudioPage` listens on `window`: add the same "window is open" guard through a ref/prop so `StudioPage`'s Esc does nothing while `Desktop` has open windows; with no windows Esc calls `onExit`).
- [ ] **Step 5:** `StudioPage`: mount in the existing `deskOverlay` slot with `invisible` until pinned; remove `DeskWindow` import/use. Verify at headless Chrome: entering `#projects` shows the desktop with 6 icons and no video; screenshot.
- [ ] **Step 6:** `npx tsc -b && npx eslint src` clean. Commit `feat(studio): AdrielOS desktop shell`.

### Task 4: File Explorer

**Files:**
- Create: `src/studio/os/apps/Explorer.tsx`; register in `Desktop.tsx`

**Interfaces:**
- Consumes: `resolve`, `AppProps`; window `arg.path` is the current folder path.
- Produces: `openNode(node: FsNode, path: string[], openApp)` in `src/studio/os/open.ts`: image → `photos` (arg `src`/`index`), video/youtube → `media`, text → `notepad` (arg `path`), link → `browser` (arg `src`), app → that app, folder → navigate in the same window.

- [ ] **Step 1:** Sidebar (Desktop, Projects, Certificates, Pictures), breadcrumb with clickable segments, Back button, icon view of the current folder; double click opens via `openNode`; a project folder shows a "Details" button calling `onDetails(projectId)`.
- [ ] **Step 2:** Headless check: open Explorer → Projects → first project → double click `README.txt` opens a Notepad window (Task 6 provides it; until then assert a window with that title appears). Commit `feat(studio): file explorer app`.

### Task 5: Photos app

**Files:**
- Create: `src/studio/os/apps/Photos.tsx`

**Interfaces:**
- Consumes: `arg.src` (optional start image), the flat image list from `Pictures`.

- [ ] **Step 1:** Thumbnail grid of all `Pictures` images (lazy `loading="lazy"`); click opens a viewer in the same window with previous/next buttons, ArrowLeft/ArrowRight keys and a counter; Back returns to the grid. `arg.src` opens that image directly.
- [ ] **Step 2:** Headless check: open Photos, click the first thumbnail, press ArrowRight, counter reads `2/N`. Commit `feat(studio): photos app`.

### Task 6: Media Player and Notepad

**Files:**
- Create: `src/studio/os/apps/MediaPlayer.tsx`, `src/studio/os/apps/Notepad.tsx`
- Modify: `src/studio/os/Desktop.tsx` (single-video rule)

**Interfaces:**
- Consumes: `arg.src` (video URL) or a YouTube id; `arg.path` for Notepad (resolved with `resolve`).
- Produces: `Desktop` exposes `videoPlaying: boolean` upward via a prop callback `onVideoPlaying(playing: boolean)` so `StudioPage` can feed its existing `videoPlaying` (music ducking).

- [ ] **Step 1:** `MediaPlayer`: `<video controls autoPlay playsInline>` (loop off) for local files, a `youtube-nocookie` iframe for `youtube`; the media area is black behind it. Opening another video while a Media window exists reuses/replaces that window (so at most one video element); closing it reports `onVideoPlaying(false)`.
- [ ] **Step 2:** `Notepad`: read-only `<pre>` in mono font showing the resolved file's `text`; title is the file name.
- [ ] **Step 3:** Headless check: open DailyBoost's video from Explorer → one `video` element; open a second video → still one; close → zero. Commit `feat(studio): media player and notepad`.

### Task 7: Terminal and Browser apps

**Files:**
- Create: `src/studio/os/apps/TerminalApp.tsx`, `src/studio/os/apps/Browser.tsx`
- Modify: `src/pages/StudioPage.tsx` (share `runCommand`/effect handling)

**Interfaces:**
- Consumes: `runCommand(input, data)` and `TermEffect` from `src/studio/terminal.ts`, `roomFx`, `bark`, `unlock`.
- Produces: `applyTermResult(result: ReturnType<typeof runCommand>)` extracted from `StudioPage.submitCommand` into `src/studio/os/termGlue.ts` so both the left monitor and `TerminalApp` apply effects the same way.

- [ ] **Step 1:** Extract the effect-applying part of `submitCommand` into `applyTermResult` (no behaviour change for the left monitor); `open <n>` result is delegated through a callback.
- [ ] **Step 2:** `TerminalApp`: its own scroll-back (starts with the welcome lines from `terminalLog`), an input line, `Enter` runs `runCommand`, effects apply via `applyTermResult`; `open <n>` opens that project's folder in Explorer.
- [ ] **Step 3:** `Browser`: a window with an address bar (read-only URL), page title/description from `arg`, and an "Open in new tab" button (`<a target="_blank" rel="noopener noreferrer">`).
- [ ] **Step 4:** Headless check: type `matrix` in the Terminal app, `roomFx.kind === 'matrix'`. Commit `feat(studio): terminal and browser apps`.

### Task 8: Static desktop on the screen from the room

**Files:**
- Modify: `src/studio/Room.tsx` (`paintDesk`, `deskScreen`, `Desk` frame loop, `deskHit`)
- Modify: `src/studio/data.ts` (remove `deskSel`/`DESK_COLS` usage)

**Interfaces:**
- Consumes: the six desktop icon labels exported from `Desktop.tsx` as `DESKTOP_ICONS: { label: string; app: AppId | 'projects' | 'about' | 'bin' }[]`.

- [ ] **Step 1:** Replace `paintDesk(ctx, sel)` with `paintDesktop(ctx)`: the same wallpaper gradient, six icon glyphs with labels in a left column, a 36px taskbar with the logo, and the clock (repaint once a minute). Remove `deskHit` and the `sel` repaint logic; clicking the screen from the room still flies the camera (hotspot) and the Desktop overlay takes over in the Projects view.
- [ ] **Step 2:** Headless check: room view screenshot shows the desktop (not the folder grid); Projects view shows the live HTML desktop aligned over it. Commit `feat(studio): room screen shows the desktop`.

### Task 9: Cleanup, wiring and verification

**Files:**
- Modify: `src/pages/StudioPage.tsx`, `src/studio/data.ts`, `src/studio/tour.ts`, `README.md`
- Delete: `src/studio/DeskWindow.tsx` (once unused)

- [ ] **Step 1:** Remove dead code: `deskSel`/`deskOpen`/`onDeskOpen`, `DESK_COLS`, `DeskWindow`, the "Folders" back button and the arrow-key grid navigation; the hint bar for Projects now reads `Double-click an icon · Esc closes the top window` (touch: `Tap an icon to open it`). aria-live announces the opened app. Terminal `open <n>` sets the desktop to open that Explorer folder via a one-shot `desktopIntent` singleton in `data.ts` read by `Desktop` on mount/change.
- [ ] **Step 2:** `ProjectGalleryModal` (Details) still opens from Explorer's Details button, and while it is open the desktop video overlay is suppressed (existing rule: no two soundtracks).
- [ ] **Step 3:** Update the tour caption for the projects stop: `Double-click the icons: the Explorer opens every project.` Update README features line.
- [ ] **Step 4:** Full verification: `npx tsc -b`, `npx eslint .`, `npm test`, `npm run build` pass; headless GPU run: enter `#projects` → desktop (no video); open Explorer; open a project video; close it with X → desktop visible (screenshot); open two windows, drag one; Esc closes top then leaves; mobile (390x844) opens maximized. Commit `feat(studio): wire the desktop and remove the folder grid`.
