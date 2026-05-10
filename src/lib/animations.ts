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

/**
 * Framer Motion variant presets — GPU-optimized with reduced travel distance.
 */
export const fadeInUp = {
  hidden: { opacity: 0, y: ANIMATION.distance.md },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION.duration.slow,
      ease: ANIMATION.ease.smooth,
    },
  },
}

export const fadeInDown = {
  hidden: { opacity: 0, y: -ANIMATION.distance.sm },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION.duration.normal,
      ease: ANIMATION.ease.smooth,
    },
  },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION.duration.slow,
      ease: ANIMATION.ease.smooth,
    },
  },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION.duration.normal,
      ease: ANIMATION.ease.smooth,
    },
  },
}

export const slideInLeft = {
  hidden: { opacity: 0, x: -ANIMATION.distance.lg },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION.duration.slow,
      ease: ANIMATION.ease.smooth,
    },
  },
}

export const slideInRight = {
  hidden: { opacity: 0, x: ANIMATION.distance.lg },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION.duration.slow,
      ease: ANIMATION.ease.smooth,
    },
  },
}

/**
 * Container variant for orchestrating staggered children.
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: ANIMATION.stagger.normal,
      delayChildren: 0.15,
    },
  },
}

/**
 * Page transition variants — lightweight.
 */
export const pageTransition = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: ANIMATION.duration.normal,
      ease: ANIMATION.ease.smooth,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION.duration.fast,
      ease: ANIMATION.ease.out,
    },
  },
}
