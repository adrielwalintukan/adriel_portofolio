import { memo } from 'react'
import { AnimatedCounter } from '@/components/animations'

interface StatCardProps {
  label: string
  value: number
  suffix?: string
}

/**
 * Premium glassmorphic card for displaying animated statistics.
 */
export const StatCard = memo(function StatCard({
  label,
  value,
  suffix,
}: StatCardProps) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl p-6 text-center transition-all duration-300 hover:border-accent/30 hover:shadow-glow">
      <div className="mb-2 flex items-baseline justify-center font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        <AnimatedCounter to={value} />
        {suffix && <span className="ml-1 text-accent">{suffix}</span>}
      </div>
      <div className="text-sm font-medium tracking-wide text-foreground-muted sm:text-base">
        {label}
      </div>
    </div>
  )
})
