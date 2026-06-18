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
 * Memoized to prevent unnecessary re-renders of children.
 * Uses GPU-composited transform properties only.
 */
export const Reveal = memo(function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = ANIMATION.duration.slow,
  className,
  once = false,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({
    triggerOnce: once,
    rootMargin: '50px', // Trigger slightly before visible for smoother entrance
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
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
})
