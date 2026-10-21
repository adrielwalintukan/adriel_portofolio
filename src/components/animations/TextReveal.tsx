import { memo, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TextRevealProps {
  text: string
  className?: string
  delay?: number
  staggerDelay?: number
  /** 'word' fades words in; 'char' slides each letter up from behind a mask. */
  by?: 'word' | 'char'
  /** Replay every time it re-enters the viewport. Off by default (PRD §6.4). */
  repeat?: boolean
}

/**
 * Split-text reveal — words or letters animate in sequentially on view.
 * Uses opacity + translateY only (no blur) for smooth compositing.
 * The full text stays readable to screen readers via aria-label.
 */
export const TextReveal = memo(function TextReveal({
  text,
  className,
  delay = 0,
  staggerDelay,
  by = 'word',
  repeat = false,
}: TextRevealProps) {
  const reduceMotion = useReducedMotion()
  const words = useMemo(() => text.split(' '), [text])
  const step = staggerDelay ?? (by === 'char' ? 0.03 : 0.04)
  const ease = [0.16, 1, 0.3, 1] as const

  if (reduceMotion) return <span className={className}>{text}</span>

  let charIndex = 0

  // The in-view trigger sits on this unclipped wrapper: masked letters start fully
  // hidden, so an IntersectionObserver on them would never fire.
  return (
    <motion.span
      aria-label={text}
      role="text"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: !repeat, margin: '-20px' }}
      className={cn('inline-flex flex-wrap gap-x-[0.25em]', className)}
    >
      {words.map((word, w) =>
        by === 'word' ? (
          <motion.span
            key={`${word}-${w}`}
            aria-hidden="true"
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.4, delay: delay + w * step, ease }}
            className="inline-block"
          >
            {word}
          </motion.span>
        ) : (
          // Each word stays unbroken; letters inside it are masked by overflow-hidden.
          <span key={`${word}-${w}`} aria-hidden="true" className="inline-flex overflow-hidden pb-[0.08em]">
            {[...word].map((char) => {
              const i = charIndex++
              return (
                <motion.span
                  key={i}
                  variants={{ hidden: { y: '110%' }, visible: { y: '0%' } }}
                  transition={{ duration: 0.6, delay: delay + i * step, ease }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              )
            })}
          </span>
        )
      )}
    </motion.span>
  )
})
