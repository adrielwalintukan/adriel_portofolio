import { useEffect, useState, useSyncExternalStore } from 'react'

/** The studio's time of day follows the real clock in Manado (WITA, UTC+8, no daylight saving). */
export type Phase = 'dawn' | 'day' | 'dusk' | 'night'

export const witaHour = (d: Date) => (d.getUTCHours() + d.getUTCMinutes() / 60 + 8) % 24

export const phaseAt = (d: Date): Phase => {
  const h = witaHour(d)
  if (h >= 5 && h < 6) return 'dawn'
  if (h >= 6 && h < 17) return 'day'
  if (h >= 17 && h < 19) return 'dusk'
  return 'night'
}

/**
 * Scene light per phase. The room is lit by its lamps: ambient and hemisphere are only enough to keep the
 * shadow side from going pitch black. `sun` is the one shadow-casting light, a dim warm wash from overhead.
 * `window` is what comes through the glass: moonlight at night, sunlight by day.
 */
export const LIGHT: Record<Phase, { ambient: number; hemi: number; sun: number; bg: string; window: { color: string; intensity: number } }> = {
  night: { ambient: 0.06, hemi: 0.08, sun: 0.9, bg: '#04070d', window: { color: '#8fa9c8', intensity: 2 } },
  dawn: { ambient: 0.07, hemi: 0.08, sun: 1.0, bg: '#080d16', window: { color: '#f3c29b', intensity: 4 } },
  day: { ambient: 0.08, hemi: 0.1, sun: 1.1, bg: '#0a1119', window: { color: '#fff2dc', intensity: 9 } },
  dusk: { ambient: 0.07, hemi: 0.09, sun: 1.0, bg: '#070b13', window: { color: '#f0a35e', intensity: 5 } },
}

// a visitor's choice (a click on the window) outranks the clock until the page is closed
let override: Phase | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const getPhaseOverride = () => override
export const setPhaseOverride = (p: Phase | null) => {
  override = p
  listeners.forEach((fn) => fn())
}
/** The phase the room should show: the visitor's choice, else the clock in Manado. */
export const effectivePhase = (d: Date): Phase => override ?? phaseAt(d)
/** Night or dawn becomes day; day or dusk becomes night. Returns the new phase. */
export const togglePhase = (now: Date = new Date()): Phase => {
  const next: Phase = (() => {
    const current = effectivePhase(now)
    return current === 'night' || current === 'dawn' ? 'day' : 'night'
  })()
  setPhaseOverride(next)
  return next
}

/** The phase to show: the override if there is one, else the clock, checked once a minute. */
export const usePhase = () => {
  const [clock, setClock] = useState<Phase>(() => phaseAt(new Date()))
  useEffect(() => {
    const id = window.setInterval(() => setClock(phaseAt(new Date())), 60_000)
    return () => window.clearInterval(id)
  }, [])
  const chosen = useSyncExternalStore(subscribe, getPhaseOverride, () => null)
  return chosen ?? clock
}
