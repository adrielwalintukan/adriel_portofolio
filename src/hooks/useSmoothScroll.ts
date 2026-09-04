import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Lightweight Lenis smooth scroll ?" optimized for snappy, lag-free performance.
 * - Snappy 0.6s duration prevents floaty lag
 * - Native 1.0x wheel multiplier ensures natural response
 * - Disables on mobile/touch to respect native GPU hardware scroll momentum
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    // Skip on mobile and touch devices for native 120Hz/60Hz compositor scrolling
    const isMobileOrTouch = window.innerWidth < 768 || 'ontouchstart' in window
    if (isMobileOrTouch) return

    const lenis = new Lenis({
      duration: 0.6,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
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
