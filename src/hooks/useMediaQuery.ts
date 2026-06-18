import { useSyncExternalStore } from 'react'
import { BREAKPOINTS } from '@/lib/constants'

type BreakpointKey = keyof typeof BREAKPOINTS

/**
 * Media query hook tied to design system breakpoints.
 * Uses useSyncExternalStore to avoid setState-in-effect.
 */
export function useMediaQuery(breakpoint: BreakpointKey): boolean {
  const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`

  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(query)
      const handler = () => onStoreChange()
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    },
    () => window.matchMedia(query).matches,
    () => false, // SSR fallback
  )
}
