import { memo } from 'react'
import { cn } from '@/lib/utils'

interface TechBadgeProps {
  name: string
  className?: string
}

/**
 * Compact, glass-style badge for displaying technologies.
 */
export const TechBadge = memo(function TechBadge({
  name,
  className,
}: TechBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-border/50 bg-surface/30 px-2.5 py-0.5 text-[10px] font-medium text-foreground-muted backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-foreground sm:text-xs',
        className
      )}
    >
      {name}
    </span>
  )
})
