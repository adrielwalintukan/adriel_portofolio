import { type ReactNode, memo } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useInView } from '@/hooks'
import { ANIMATION } from '@/lib/animations'

interface RevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

const directionVariants: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: ANIMATION.distance.md },
    visible: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -ANIMATION.distance.sm },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -ANIMATION.distance.lg },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: ANIMATION.distance.lg },
    visible: { opacity: 1, x: 0 },
  },
  none: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
}

/**
 * Scroll-triggered reveal animation wrapper.
 * Optimized: triggers once by default for maximum scrolling smoothness,
 * avoiding expensive reverse animations and GPU compositing layer churn.
 */
export const Reveal = memo(function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = ANIMATION.duration.slow,
  className,
  once = true,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({
    triggerOnce: once,
    rootMargin: '80px',
  })

  return (
    <motion.div
      ref={ref}
      variants={directionVariants[direction]}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{
        duration,
        delay,
        ease: [...ANIMATION.ease.smooth],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
})
