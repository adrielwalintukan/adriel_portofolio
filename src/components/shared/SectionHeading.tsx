import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/animations'

interface SectionHeadingProps {
  label?: string
  title: string
  description?: string
  className?: string
  align?: 'left' | 'center'
}

/**
 * Consistent section heading with animated reveal. Memoized.
 */
export const SectionHeading = memo(function SectionHeading({
  label,
  title,
  description,
  className,
  align = 'center',
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-10 max-w-xl sm:mb-12 md:mb-16 md:max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      {label && (
        <Reveal delay={0}>
          <span className="mb-2 inline-block font-mono text-xs uppercase tracking-widest text-accent sm:mb-3 sm:text-sm">
            {label}
          </span>
        </Reveal>
      )}
      <Reveal delay={0.08}>
        <h2 className="font-bold tracking-tight">{title}</h2>
      </Reveal>
      {description && (
        <Reveal delay={0.16}>
          <p className="mt-3 text-sm text-foreground-muted sm:mt-4 sm:text-base md:text-lg">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  )
})
