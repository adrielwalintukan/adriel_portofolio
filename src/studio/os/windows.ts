import type { AppId } from './fs.ts'

/** The desktop's window manager: pure state in, new state out, so it can be tested without a browser. */
export type WinArg = { path?: string[]; src?: string; kind?: 'video' | 'youtube'; title?: string; blurb?: string }
export type Win = {
  id: number
  app: AppId
  title: string
  arg?: WinArg
  x: number
  y: number
  w: number
  h: number
  z: number
  min: boolean
  max: boolean
  /** geometry before maximizing */
  restore?: { x: number; y: number; w: number; h: number }
}
export type WinState = { wins: Win[]; next: number; top: number }

/** Usable desktop: the 960 x 532 screen minus the 40 px taskbar. */
export const AREA = { w: 960, h: 532 - 40 }
const SIZE: Record<AppId, { w: number; h: number }> = {
  explorer: { w: 560, h: 340 },
  photos: { w: 520, h: 360 },
  media: { w: 560, h: 340 },
  notepad: { w: 420, h: 300 },
  terminal: { w: 520, h: 320 },
  browser: { w: 520, h: 300 },
}
const STEP = 28
const KEEP = 80 // pixels of a window that must stay on screen horizontally
const BAR = 32

export const initial = (): WinState => ({ wins: [], next: 1, top: 0 })

const patch = (s: WinState, id: number, f: (w: Win) => Win): WinState =>
  s.wins.some((w) => w.id === id) ? { ...s, wins: s.wins.map((w) => (w.id === id ? f(w) : w)) } : s

export const open = (s: WinState, app: AppId, title: string, arg?: WinArg, mobile = false): WinState => {
  const size = SIZE[app]
  const n = s.wins.length % 6
  const win: Win = {
    id: s.next,
    app,
    title,
    arg,
    x: 40 + n * STEP,
    y: 24 + n * STEP,
    w: size.w,
    h: size.h,
    z: s.top + 1,
    min: false,
    max: mobile,
  }
  return { wins: [...s.wins, win], next: s.next + 1, top: s.top + 1 }
}

export const close = (s: WinState, id: number): WinState =>
  s.wins.some((w) => w.id === id) ? { ...s, wins: s.wins.filter((w) => w.id !== id) } : s

export const focus = (s: WinState, id: number): WinState => {
  const top = s.top + 1
  const out = patch(s, id, (w) => ({ ...w, z: top, min: false }))
  return out === s ? s : { ...out, top }
}

/** Points an open window at new content (a folder, a video) and brings it to the front. */
export const retarget = (s: WinState, id: number, title: string, arg?: WinArg): WinState => {
  const top = s.top + 1
  const out = patch(s, id, (w) => ({ ...w, title, arg, z: top, min: false }))
  return out === s ? s : { ...out, top }
}

export const minimize = (s: WinState, id: number): WinState => patch(s, id, (w) => ({ ...w, min: true }))

export const toggleMax = (s: WinState, id: number): WinState =>
  patch(s, id, (w) =>
    w.max
      ? { ...w, ...(w.restore ?? {}), max: false, restore: undefined }
      : { ...w, max: true, restore: { x: w.x, y: w.y, w: w.w, h: w.h } }
  )

/** Keeps the title bar inside the desktop, so a window can never be dragged out of reach. */
export const move = (s: WinState, id: number, x: number, y: number): WinState =>
  patch(s, id, (w) => ({
    ...w,
    x: Math.min(AREA.w - KEEP, Math.max(KEEP - w.w, x)),
    y: Math.min(AREA.h - BAR, Math.max(0, y)),
  }))

/** The window that has focus: the highest one that is not minimized. */
export const activeId = (s: WinState): number | null => {
  const shown = s.wins.filter((w) => !w.min)
  return shown.length ? shown.reduce((a, b) => (b.z > a.z ? b : a)).id : null
}
