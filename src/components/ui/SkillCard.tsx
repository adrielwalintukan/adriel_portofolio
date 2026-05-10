import { memo } from 'react'
import { cn } from '@/lib/utils'

interface SkillCardProps {
  name: string
  className?: string
}

/**
 * Minimalist premium card to highlight core strengths.
 * Features a subtle hover elevation and a neon accent line.
 */
export const SkillCard = memo(function SkillCard({ name, className }: SkillCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-surface/50 px-5 py-3 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-surface hover:shadow-glow',
        className
      )}
      style={{ willChange: 'transform' }}
    >
      {/* Subtle top accent line that expands on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent/0 via-accent/50 to-neon-cyan/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <span className="relative z-10 text-sm font-medium text-foreground-subtle transition-colors group-hover:text-foreground">
        {name}
      </span>
    </div>
  )
})
