import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TextRevealProps {
  text: string
  className?: string
  delay?: number
  staggerDelay?: number
}

/**
 * Cinematic text reveal — each word fades in sequentially.
 * Optimized: removed blur filter animation (very expensive on GPU),
 * uses opacity + translateY only for smooth compositing.
 */
export const TextReveal = memo(function TextReveal({
  text,
  className,
  delay = 0,
  staggerDelay = 0.04,
}: TextRevealProps) {
  const words = useMemo(() => text.split(' '), [text])

  return (
    <span className={cn('inline-flex flex-wrap gap-x-2', className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{
            duration: 0.4,
            delay: delay + i * staggerDelay,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block"
          style={{ willChange: 'opacity, transform' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
})
