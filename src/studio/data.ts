/**
 * Stations of the 3D studio. Each one is a spot in the room: clicking the object (or the nav pill)
 * moves the camera to `pose` and opens the matching HTML panel. `room` is the overview.
 */
export type StationId = 'projects' | 'skills' | 'experience' | 'certificates' | 'about'
export type ViewId = 'room' | 'poster' | StationId

export interface Pose {
  eye: [number, number, number]
  target: [number, number, number]
}

export const POSES: Record<ViewId, Pose> = {
  room: { eye: [12.0, 10.0, 14.1], target: [0.4, 1.4, 0.0] },
  projects: { eye: [1.9, 2.9, 0.1], target: [2.2, 1.8, -4.95] },
  skills: { eye: [0.9, 3.0, 0.4], target: [-5.5, 1.9, -2.85] },
  experience: { eye: [-0.1, 3.05, 0.5], target: [-1.2, 2.6, -5.9] },
  certificates: { eye: [2.55, 3.7, 4.15], target: [-5.9, 2.85, 2.1] },
  about: { eye: [2.7, 1.7, 6.5], target: [1.1, 1.3, 2.05] },
  // the framed portrait on the back wall, close enough to read the face
  poster: { eye: [3.35, 3.55, -2.5], target: [1.9, 3.5, -5.92] },
}

/**
 * A portrait screen sees a third of the room's width at the same distance, so these views are pulled
 * back and re-aimed: the object stays whole in the strip above the bottom sheet.
 */
export const PORTRAIT_POSES: Record<ViewId, Pose> = {
  room: { eye: [12.4, 9.1, 14.6], target: [1.2, 1.0, 0.2] },
  projects: { eye: [2.2, 3.2, 3.1], target: [2.2, 1.55, -4.95] },
  skills: { eye: [2.6, 3.29, 1.26], target: [-5.5, 1.9, -2.85] },
  experience: { eye: [-0.08, 3.05, 5.3], target: [-1.9, 2.1, -5.9] },
  certificates: { eye: [3.1, 3.85, 4.95], target: [-5.9, 2.4, 3.1] },
  about: { eye: [2.45, 2.0, 6.2], target: [0.78, 1.0, 2.05] },
  poster: { eye: [3.95, 3.65, -0.75], target: [1.9, 3.5, -5.92] },
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
