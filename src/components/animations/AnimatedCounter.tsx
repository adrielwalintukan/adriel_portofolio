import { memo, useEffect, useRef } from 'react'
import { motion, useSpring, useTransform, useInView } from 'framer-motion'

interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  className?: string
}

/**
 * Performance-optimized animated counter.
 * Uses Framer Motion's motion values to animate text without triggering React state updates.
 */
export const AnimatedCounter = memo(function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  // useInView triggers the animation whenever the component is visible
  const isInView = useInView(ref, { once: false, margin: '-50px' })

  // Initialize the spring with the starting value
  const spring = useSpring(from, {
    duration: duration * 1000,
    bounce: 0,
    // Add a slight stiffness and damping for a smoother, premium feel
    stiffness: 50,
    damping: 15,
  })

  // Transform the spring float value into a rounded string
  const display = useTransform(spring, (current) => Math.round(current).toString())

  useEffect(() => {
    if (isInView) {
      spring.set(to)
    } else {
      // Reset instantly when out of view so it's ready to count up again
      spring.jump(from)
    }
  }, [isInView, spring, to, from])

  return <motion.span ref={ref} className={className}>{display}</motion.span>
})
