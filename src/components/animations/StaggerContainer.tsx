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
 */
export const StaggerContainer = memo(function StaggerContainer({
  children,
  className,
  delay = 0.15,
  staggerDelay = 0.08,
}: StaggerContainerProps) {
  const [ref, inView] = useInView<HTMLDivElement>({
    triggerOnce: true,
    rootMargin: '50px',
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
