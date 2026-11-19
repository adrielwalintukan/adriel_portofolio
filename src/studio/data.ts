import { PROJECTS } from '@/lib/constants'
import { PROMPT, TERM_COLORS, type TermLine } from './terminal'

/**
 * Stations of the 3D studio. Each one is a spot in the room: clicking the object (or the nav pill)
 * moves the camera to `pose` and opens the matching HTML panel. `room` is the overview.
 */
export type StationId = 'projects' | 'skills' | 'experience' | 'certificates' | 'about'
export type ViewId = 'room' | 'poster' | 'tv' | 'terminal' | 'sideboard' | 'billiards' | 'guestbook' | StationId
/** What the lounge TV is showing: the picker, the video list, pong ('game'), breakout, or a real YouTube embed. */
export type TvMode = 'menu' | 'videos' | 'game' | 'breakout' | 'youtube'

/** The videos on the TV's YouTube list. */
export const TV_PICKS: { id: string; label: string }[] = [
  { id: 'KBISBp6jhwE', label: 'windah — lego batman tamat' },
  { id: '4xDzrJKXOOY', label: 'synthwave radio' },
  { id: 'n61ULEU7CO0', label: 'best of lofi' },
]

/** The HTML box holding the YouTube iframe; the TV moves it over its screen every frame. */
export const tvOverlay: { el: HTMLDivElement | null } = { el: null }

/** The open project window; the main monitor moves it over its screen every frame. */
export const deskOverlay: { el: HTMLDivElement | null } = { el: null }

/** Whether the two monitors are powered: "Shut down" in AdrielOS turns them off; leaving the view does not. */
export const screenPower = { on: true }

/** Where the character is right now, for the dog to trail; Character writes it every frame. */
export const charPos = { x: 0, z: 0, yaw: 0, busy: false }

/**
 * A petting moment: the dog asks (want, with where it stands and faces), the character walks over,
 * crouches and pets it (active), then clears both.
 */
export const dogPet = { want: false, active: false, x: 0, z: 0, yaw: 0 }

/** Room effects the terminal's hidden commands start; times are performance.now() in ms. */
export const roomFx: { kind: 'hire' | 'matrix' | null; at: number; rain: boolean; bark: number } = {
  kind: null,
  at: 0,
  rain: false,
  bark: 0,
}
export const FX_MS = { hire: 3000, matrix: 8000 } as const
/** 0..1 strength of a running effect, or 0 when it is not the one playing. */
export const fxLevel = (kind: 'hire' | 'matrix') => {
  if (roomFx.kind !== kind) return 0
  const p = (performance.now() - roomFx.at) / FX_MS[kind]
  return p >= 1 ? 0 : Math.min(1, (1 - p) * 4)
}

/** What the left monitor's terminal shows: its history and the line being typed. Kept for the whole visit. */
export const terminalLog: { lines: TermLine[]; input: string } = {
  lines: [
    [PROMPT + 'welcome', TERM_COLORS.prompt],
    ['this terminal works. type help to start.', TERM_COLORS.out],
    ['psst: it has secrets too. type hint', TERM_COLORS.ok],
  ],
  input: '',
}

/** CSS size the screen overlays are laid out at, before they are mapped onto the 3D screen. */
export const SCREEN_PX = { w: 960, h: 532 }

/** The projects that have a folder on the monitor's desktop. */
export const DESK_PROJECTS = PROJECTS.filter((p) => !p.inDevelopment)

export interface Pose {
  eye: [number, number, number]
  target: [number, number, number]
}

export const POSES: Record<ViewId, Pose> = {
  room: { eye: [10.9, 9.2, 12.6], target: [0.1, 1.2, -0.5] },
  // facing the main monitor, high enough to look over him when he sits at the desk
  projects: { eye: [1.95, 2.25, -2.75], target: [1.95, 1.68, -4.905] },
  skills: { eye: [0.9, 3.0, 0.4], target: [-5.5, 1.9, -2.85] },
  // square to the whiteboard, where the timeline is written: no side panel for this view
  experience: { eye: [-1.9, 2.62, -1.7], target: [-1.9, 2.62, -5.9] },
  certificates: { eye: [2.55, 3.7, 4.15], target: [-5.9, 2.85, 2.4] },
  about: { eye: [2.7, 1.7, 6.5], target: [1.1, 1.3, 2.05] },
  // the framed portrait on the back wall, close enough to read the face
  poster: { eye: [3.35, 3.55, -2.5], target: [1.9, 3.5, -5.92] },
  // the TV in the lounge: framed from the sofa so the whole screen, including the paddle, is in view
  // level and square to the screen, between the coffee table and the sofa: the video box lines up exactly
  tv: { eye: [3.67, 1.21, 4.3], target: [3.67, 1.17, 0.85] },
  // the left monitor (live terminal), square to its screen
  terminal: { eye: [0.9, 1.75, -2.93], target: [0.427, 1.55, -4.871] },
  // the maker's sideboard under the awards wall, close enough to see the props
  sideboard: { eye: [-2.55, 2.0, 2.3], target: [-5.75, 1.1, 2.3] },
  // over the pool table from its long side, steep enough to aim across the whole felt
  billiards: { eye: [-2.0, 3.4, 6.6], target: [-2.0, 0.6, 3.65] },
  // square to the guest book's cork board on the left wall
  guestbook: { eye: [-3.75, 2.62, -0.5], target: [-5.9, 2.6, -0.5] },
}

/**
 * A portrait screen sees a third of the room's width at the same distance, so these views are pulled
 * back and re-aimed: the object stays whole in the strip above the bottom sheet.
 */
export const PORTRAIT_POSES: Record<ViewId, Pose> = {
  room: { eye: [11.3, 8.4, 13.1], target: [0.9, 0.9, -0.3] },
  projects: { eye: [1.95, 2.3, -0.95], target: [1.95, 1.68, -4.905] },
  skills: { eye: [2.6, 3.29, 1.26], target: [-5.5, 1.9, -2.85] },
  // the timeline half of the board, square on
  experience: { eye: [-2.35, 2.66, 0.4], target: [-2.35, 2.62, -5.9] },
  certificates: { eye: [3.1, 3.85, 4.95], target: [-5.9, 2.4, 3.0] },
  about: { eye: [2.45, 2.0, 6.2], target: [0.78, 1.0, 2.05] },
  poster: { eye: [3.95, 3.65, -0.75], target: [1.9, 3.5, -5.92] },
  // portrait sees a third of the room's width, so the TV view needs the extra distance
  // behind the sofa and just high enough to clear its back: the whole screen fits the narrow width
  tv: { eye: [3.67, 1.73, 7.06], target: [3.67, 1.17, 0.85] },
  terminal: { eye: [1.19, 1.85, -1.76], target: [0.427, 1.55, -4.871] },
  sideboard: { eye: [-2.1, 2.0, 2.3], target: [-5.75, 1.1, 2.3] },
  billiards: { eye: [-2.0, 6.2, 7.0], target: [-2.0, 0.6, 3.75] },
  guestbook: { eye: [-1.75, 2.62, -0.5], target: [-5.9, 2.6, -0.5] },
}

export const STATIONS: { id: StationId; label: string; where: string }[] = [
  { id: 'projects', label: 'Projects', where: 'screens' },
  { id: 'skills', label: 'Skills', where: 'shelf' },
  { id: 'experience', label: 'Experience', where: 'board' },
  { id: 'certificates', label: 'Awards', where: 'wall' },
  { id: 'about', label: 'About', where: 'host' },
]

/** Station shown for a hotspot label; the room's objects and the nav share this source of truth. */
export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s])) as Record<
  StationId,
  (typeof STATIONS)[number]
>

/** Shared drag bookkeeping: a camera drag must not also count as a click on the furniture. */
export const pointerDrag = { moved: 0 }
