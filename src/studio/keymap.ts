import type { StationId } from './data'

/** What a key does in the studio. Pure, so the rules (not while typing, not behind a modal) are tested. */
export type KeyCtx = { typing: boolean; modal: boolean }
export type KeyAction =
  | { type: 'help' | 'music' | 'tour' | 'night' | 'room' }
  | { type: 'station'; id: StationId }
  | null

const STATIONS: StationId[] = ['projects', 'skills', 'experience', 'certificates', 'about']

export const SHORTCUTS: { keys: string; does: string }[] = [
  { keys: '?', does: 'This help' },
  { keys: 'M', does: 'Music on or off' },
  { keys: 'T', does: 'Take the tour' },
  { keys: 'N', does: 'Day or night' },
  { keys: 'R', does: 'Back to the room' },
  { keys: '1 – 5', does: 'Projects, Skills, Experience, Awards, About' },
  { keys: 'Esc', does: 'Close, or leave' },
]

export const keyAction = (
  e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; repeat?: boolean },
  ctx: KeyCtx
): KeyAction => {
  // a held key must not flicker day and night or toggle the music over and over
  if (e.repeat || ctx.typing || ctx.modal || e.ctrlKey || e.metaKey || e.altKey) return null
  if (e.key === '?') return { type: 'help' }
  const station = STATIONS[Number(e.key) - 1]
  if (/^[1-5]$/.test(e.key) && station) return { type: 'station', id: station }
  switch (e.key.toLowerCase()) {
    case 'm':
      return { type: 'music' }
    case 't':
      return { type: 'tour' }
    case 'n':
      return { type: 'night' }
    case 'r':
      return { type: 'room' }
    default:
      return null
  }
}
