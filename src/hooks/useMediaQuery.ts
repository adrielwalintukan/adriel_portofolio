import { useState, useEffect } from 'react'
import { BREAKPOINTS } from '@/lib/constants'

type BreakpointKey = keyof typeof BREAKPOINTS

/**
 * Media query hook tied to design system breakpoints.
 */
export function useMediaQuery(breakpoint: BreakpointKey): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`)
    setMatches(query.matches)

    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches)
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [breakpoint])

  return matches
}
