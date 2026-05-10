import { memo } from 'react'
import { cn } from '@/lib/utils'

interface AmbientGlowProps {
  className?: string
  variant?: 'primary' | 'secondary' | 'accent'
}

/**
 * Lightweight animated gradient glow — replaces heavy particle rendering.
 * Uses pure CSS radial gradients + subtle opacity animation.
 * Zero JS overhead, GPU-composited.
 */
export const AmbientGlow = memo(function AmbientGlow({
  className,
  variant = 'primary',
}: AmbientGlowProps) {
  const gradients: Record<string, string> = {
    primary:
      'radial-gradient(ellipse 600px 400px at 30% 40%, rgba(108, 92, 231, 0.08) 0%, transparent 70%)',
    secondary:
      'radial-gradient(ellipse 500px 350px at 70% 30%, rgba(0, 240, 255, 0.06) 0%, transparent 70%)',
    accent:
      'radial-gradient(ellipse 400px 300px at 50% 60%, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
  }

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 -z-10',
        className
      )}
      style={{ background: gradients[variant] }}
      aria-hidden="true"
    />
  )
})
