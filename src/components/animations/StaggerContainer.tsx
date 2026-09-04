import { type ReactNode, memo } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer } from '@/lib/animations'
import { useInView } from '@/hooks'

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  staggerDelay?: number
}

/**
 * Memoized container that staggers child animations on scroll.
 * Optimized: triggers once upon view entry so child elements stay
 * stable without re-animating or dropping frames during scrolling.
 */
export const StaggerContainer = memo(function StaggerContainer({
  children,
  className,
  delay = 0.15,
  staggerDelay = 0.08,
}: StaggerContainerProps) {
  const [ref, inView] = useInView<HTMLDivElement>({
    triggerOnce: true,
    rootMargin: '80px',
  })

  return (
    <motion.div
      ref={ref}
      variants={{
        ...staggerContainer,
        visible: {
          ...staggerContainer.visible,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
})
