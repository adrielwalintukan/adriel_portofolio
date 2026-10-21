import { memo, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScrollRevealTextProps {
  text: string
  className?: string
  /** Words (exact match, punctuation ignored) shown in the accent color. */
  highlight?: string[]
}

const clean = (w: string) => w.replace(/[^\p{L}\p{N}-]/gu, '').toLowerCase()

const Word = memo(function Word({
  word,
  progress,
  range,
  accent,
}: {
  word: string
  progress: MotionValue<number>
  range: [number, number]
  accent: boolean
}) {
  const opacity = useTransform(progress, range, [0.18, 1])
  return (
    <motion.span style={{ opacity }} className={cn('inline-block', accent && 'text-accent')}>
      {word}
    </motion.span>
  )
})

/**
 * Paragraph whose words light up one by one as it scrolls through the viewport (PRD §6.2).
 * Plain text for reduced motion; the <p> keeps normal word order for screen readers.
 */
export const ScrollRevealText = memo(function ScrollRevealText({ text, className, highlight = [] }: ScrollRevealTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = text.split(' ')
  const accentSet = new Set(highlight.map(clean))

  if (reduceMotion) return <p className={className}>{text}</p>

  return (
    <p ref={ref} className={cn('flex flex-wrap gap-x-[0.25em]', className)}>
      {words.map((word, i) => (
        <Word
          key={`${word}-${i}`}
          word={word}
          progress={scrollYProgress}
          range={[i / words.length, (i + 1) / words.length]}
          accent={accentSet.has(clean(word))}
        />
      ))}
    </p>
  )
})
