import { memo } from 'react'
import { motion } from 'framer-motion'

interface TechSkillCardProps {
  name: string
  level: number
}

/**
 * Premium glassmorphism card for individual technical skills.
 * Features a minimalist futuristic progress bar indicating proficiency.
 */
export const TechSkillCard = memo(function TechSkillCard({ name, level }: TechSkillCardProps) {
  return (
    <div className="group relative flex flex-col justify-center overflow-hidden rounded-xl border border-border/40 bg-surface/30 p-4 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-accent/50 hover:bg-surface/60 hover:shadow-glow">
      {/* Subtle ambient glow on hover */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-accent/0 to-neon-cyan/0 opacity-0 transition-opacity duration-500 group-hover:from-accent/10 group-hover:to-neon-cyan/10 group-hover:opacity-100" />
      
      <div className="relative z-10 flex items-center justify-between mb-3">
        <span className="font-medium text-foreground-subtle transition-colors group-hover:text-foreground">
          {name}
        </span>
        <span className="font-mono text-xs text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {level}%
        </span>
      </div>

      {/* Futuristic Progress Bar */}
      <div className="relative z-10 h-1 w-full overflow-hidden rounded-full bg-border/50">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full bg-gradient-to-r from-accent to-neon-cyan opacity-80 group-hover:opacity-100"
        />
      </div>
    </div>
  )
})
