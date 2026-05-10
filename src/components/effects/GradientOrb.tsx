import { memo } from 'react'
import { cn } from '@/lib/utils'

interface GradientOrbProps {
  className?: string
  color?: string
  size?: string
}

/**
 * Static gradient orb for ambient background decoration.
 * Optimized: no animation loop — uses pure CSS for zero runtime cost.
 * Blur is applied via CSS class, kept lower for mobile performance.
 */
export const GradientOrb = memo(function GradientOrb({
  className,
  color = 'bg-accent/10',
  size = 'w-80 h-80 md:w-96 md:h-96',
}: GradientOrbProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute rounded-full blur-[80px] md:blur-[100px]',
        color,
        size,
        className
      )}
      aria-hidden="true"
    />
  )
})
