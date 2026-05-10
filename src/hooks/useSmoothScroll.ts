import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Lightweight Lenis smooth scroll — optimized for performance.
 * - Shorter duration for snappier feel
 * - Disables on mobile to respect native scroll momentum
 * - Uses simpler easing to reduce CPU cost
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    // Skip on mobile for native scroll performance
    const isMobile = window.innerWidth < 768
    if (isMobile) return

    const lenis = new Lenis({
      duration: 0.8,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // Simple cubic ease-out
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.5,
    })

    let rafId: number

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])
}
