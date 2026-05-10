import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  dotColor?: string
}

/**
 * Minimal status badge with pulsing dot indicator.
 */
export const Badge = memo(function Badge({
  children,
  className,
  dotColor = 'bg-neon-cyan',
}: BadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-3 py-1 text-xs font-medium text-foreground-muted backdrop-blur-sm sm:px-4 sm:py-1.5 sm:text-sm',
        className
      )}
      style={{ willChange: 'opacity, transform' }}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            dotColor
          )}
        />
        <span
          className={cn('relative inline-flex h-2 w-2 rounded-full', dotColor)}
        />
      </span>
      {children}
    </motion.div>
  )
})
