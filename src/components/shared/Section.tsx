import { type ReactNode, memo } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  id?: string
  children: ReactNode
  className?: string
  containerClassName?: string
  fullWidth?: boolean
}

/**
 * Reusable section wrapper with responsive spacing.
 */
export const Section = memo(function Section({
  id,
  children,
  className,
  containerClassName,
  fullWidth = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn('relative py-16 sm:py-20 md:py-28 lg:py-36', className)}
    >
      {fullWidth ? (
        children
      ) : (
        <div className={cn('section-container', containerClassName)}>
          {children}
        </div>
      )}
    </section>
  )
})
