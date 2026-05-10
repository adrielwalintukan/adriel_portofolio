import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { TimelineItem } from '@/lib/constants'

interface TimelineCardProps {
  item: TimelineItem
  isEven: boolean
}

/**
 * Premium glassmorphic card for a single timeline event.
 * Handles alternating layout styles based on the `isEven` prop.
 */
export const TimelineCard = memo(function TimelineCard({
  item,
  isEven,
}: TimelineCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={cn(
        'relative w-full lg:w-1/2',
        // On desktop, even items align to the left, odd items align to the right
        isEven ? 'lg:pr-12' : 'lg:ml-auto lg:pl-12'
      )}
    >
      {/* Node connecting the card to the timeline line (desktop only) */}
      <div
        className={cn(
          'absolute top-8 hidden h-4 w-4 rounded-full border-2 border-accent bg-background shadow-[0_0_10px_rgba(0,255,255,0.5)] lg:block',
          isEven ? '-right-[8px]' : '-left-[8px]'
        )}
      />

      <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-surface/40 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:bg-surface/60 hover:shadow-glow-lg sm:p-8">
        {/* Subtle background glow effect on hover */}
        <div className="absolute -inset-1 z-0 bg-gradient-to-br from-accent/0 to-neon-cyan/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:from-accent/10 group-hover:to-neon-cyan/10 group-hover:opacity-100" />

        <div className="relative z-10">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <span className="mb-2 font-mono text-sm font-bold text-accent sm:mb-0">
              {item.year}
            </span>
            <span className="rounded-full border border-border bg-background/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-foreground-muted">
              {item.category}
            </span>
          </div>

          <h3 className="mb-1 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {item.title}
          </h3>
          <h4 className="mb-4 text-sm font-medium text-foreground-subtle">
            {item.role}
          </h4>
          
          <p className="mb-6 text-sm leading-relaxed text-foreground-muted sm:text-base">
            {item.description}
          </p>

          {item.technologies && item.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-border/50 bg-background/30 px-2.5 py-1 text-xs font-medium text-foreground-subtle transition-colors group-hover:border-border group-hover:text-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})
