import { type ReactNode, useCallback, memo } from 'react'
import { cn } from '@/lib/utils'

interface MagneticProps {
  children: ReactNode
  className?: string
  strength?: number
  disabled?: boolean
}

/**
 * Magnetic hover effect — element subtly follows cursor on hover.
 * Disabled on touch devices via the `disabled` prop.
 * Uses plain DOM manipulation (no Framer Motion) for zero overhead.
 */
export const Magnetic = memo(function Magnetic({
  children,
  className,
  strength = 0.25,
  disabled = false,
}: MagneticProps) {
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) * strength
      const y = (e.clientY - rect.top - rect.height / 2) * strength
      e.currentTarget.style.transform = `translate3d(${x}px, ${y}px, 0)`
    },
    [strength, disabled]
  )

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'translate3d(0, 0, 0)'
    },
    []
  )

  if (disabled) {
    return <div className={cn('inline-block', className)}>{children}</div>
  }

  return (
    <div
      className={cn('inline-block', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
})
