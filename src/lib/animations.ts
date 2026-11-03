/**
 * Animation configuration constants for consistent motion design.
 * Optimized: reduced distances, shorter durations, GPU-friendly transforms.
 */
export const ANIMATION = {
  /** Durations (slightly reduced for snappier feel) */
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.35,
    slow: 0.5,
    slower: 0.7,
    cinematic: 1.0,
  },

  /** Easing curves */
  ease: {
    smooth: [0.16, 1, 0.3, 1] as const,
    bounce: [0.34, 1.56, 0.64, 1] as const,
    elastic: [0.68, -0.55, 0.265, 1.55] as const,
    out: [0, 0, 0.2, 1] as const,
    inOut: [0.4, 0, 0.2, 1] as const,
  },

  /** Stagger delays */
  stagger: {
    fast: 0.04,
    normal: 0.08,
    slow: 0.12,
  },

  /** Reduced distances for smoother perception */
  distance: {
    sm: 12,
    md: 20,
    lg: 30,
  },
} as const
