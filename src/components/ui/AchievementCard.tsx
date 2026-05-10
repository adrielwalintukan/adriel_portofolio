import { memo } from 'react'

import { FiAward } from 'react-icons/fi'

/**
 * Premium cinematic card highlighting a specific achievement or award.
 */
export const AchievementCard = memo(function AchievementCard() {
  return (
    <div className="group relative mt-12 overflow-hidden rounded-2xl border border-accent/30 bg-surface/40 p-6 backdrop-blur-md transition-all duration-500 hover:border-accent/60 hover:shadow-glow-lg sm:p-8">
      {/* Background glow on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/0 to-neon-cyan/0 opacity-0 transition-opacity duration-500 group-hover:from-accent/10 group-hover:to-neon-cyan/10 group-hover:opacity-100" />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 shadow-[0_0_15px_rgba(108,92,231,0.3)]">
          <FiAward className="h-6 w-6 text-accent" />
        </div>
        
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-accent">
              Featured Achievement
            </span>
            <div className="h-px w-8 bg-accent/30" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Best Technical Excellence Award
          </h3>
          <p className="text-sm font-medium text-foreground-subtle sm:text-base">
            Proxo Coris 2026 — Mobile App Development Category
          </p>
        </div>
      </div>
    </div>
  )
})
