/** Render quality: HD (post-processing, high resolution) or Fast, and the rule that steps down when the frame rate is poor. */
export type Quality = { hd: boolean; ao: boolean; dpr: number }
export const FAST_DPR = 1.25

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** The starting mode: HD on desktops, Fast on touch screens, unless the visitor chose one before. */
export const defaultQuality = (coarse: boolean, devicePixelRatio: number, saved: 'on' | 'off' | null): Quality => {
  const hd = saved ? saved === 'on' : !coarse
  return hd
    ? { hd: true, ao: true, dpr: clamp(devicePixelRatio, 1.5, 2) }
    : { hd: false, ao: false, dpr: Math.min(devicePixelRatio, FAST_DPR) }
}

/** `since` is when the scene started rendering; frames before `WARM_UP_MS` are shader and texture loading, not a verdict. */
export type Monitor = { slow: number; since: number }
export const newMonitor = (since: number): Monitor => ({ slow: 0, since })

const WARM_UP_MS = 4000
const SLOW_FPS = 30

const stepDown = (q: Quality): Quality => {
  if (q.ao) return { ...q, ao: false }
  if (q.dpr > FAST_DPR) return { ...q, dpr: FAST_DPR }
  if (q.hd) return { hd: false, ao: false, dpr: FAST_DPR }
  return q
}

/** One 2-second frame-rate reading. Two slow readings in a row cost one step; `auto` false (the visitor chose) never steps. */
export const sample = (m: Monitor, now: number, fps: number, q: Quality, auto: boolean): { monitor: Monitor; quality: Quality } => {
  if (now - m.since < WARM_UP_MS) return { monitor: m, quality: q }
  const slow = fps < SLOW_FPS ? m.slow + 1 : 0
  if (auto && slow >= 2) return { monitor: { ...m, slow: 0 }, quality: stepDown(q) }
  return { monitor: { ...m, slow }, quality: q }
}
