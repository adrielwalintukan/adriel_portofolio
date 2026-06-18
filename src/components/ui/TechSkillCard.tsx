import { memo } from 'react'
import { motion } from 'framer-motion'
import { FiCode, FiDatabase, FiHexagon } from 'react-icons/fi'
import {
  SiPython,
  SiNodedotjs,
  SiSupabase,
  SiReact,
  SiJavascript,
  SiTypescript,
  SiNextdotjs,
  SiVite,
  SiGit,
  SiGithub,
  SiLaravel,
  SiPostgresql
} from 'react-icons/si'
import { cn } from '@/lib/utils'

interface TechSkillCardProps {
  name: string
  level?: number
  icon?: string
  className?: string
}

// Icon mapping function
const getIcon = (iconName?: string) => {
  switch (iconName?.toLowerCase()) {
    case 'python': return <SiPython className="text-[#3776AB]" />
    case 'nodejs': return <SiNodedotjs className="text-[#339933]" />
    case 'supabase': return <SiSupabase className="text-[#3ECF8E]" />
    case 'react': return <SiReact className="text-[#61DAFB]" />
    case 'javascript': return <SiJavascript className="text-[#F7DF1E]" />
    case 'typescript': return <SiTypescript className="text-[#3178C6]" />
    case 'nextjs': return <SiNextdotjs className="text-foreground" />
    case 'vite': return <SiVite className="text-[#646CFF]" />
    case 'git': return <SiGit className="text-[#F05032]" />
    case 'github': return <SiGithub className="text-foreground" />
    case 'laravel': return <SiLaravel className="text-[#FF2D20]" />
    case 'postgresql': return <SiPostgresql className="text-[#4169E1]" />
    case 'database': return <FiDatabase className="text-accent" />
    case 'convex': return <FiHexagon className="text-neon-cyan" />
    case 'blade': return <FiCode className="text-[#FF2D20]" />
    default: return <FiCode className="text-foreground-muted" />
  }
}

/**
 * Premium cinematic floating badge for individual technical skills.
 */
export const TechSkillCard = memo(function TechSkillCard({ name, icon, className }: TechSkillCardProps) {
  // Generate a random float delay so they bob up and down asynchronously
  const floatDelay = Math.random() * 2;
  const floatDuration = 3 + Math.random() * 2;

  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ 
        duration: floatDuration, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay: floatDelay
      }}
      className={cn(
        "group relative flex flex-col items-center justify-center p-5 aspect-square overflow-hidden rounded-2xl border border-white/5 bg-surface/30 backdrop-blur-md transition-all duration-500 hover:border-accent/40 hover:bg-surface/50 hover:-translate-y-2 hover:shadow-glow cursor-pointer",
        className
      )}
    >
      {/* Subtle ambient glow on hover */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-accent/5 to-neon-cyan/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-overlay" />
      
      {/* Icon Container */}
      <div className="relative z-10 flex h-12 w-12 items-center justify-center text-4xl drop-shadow-md transition-transform duration-500 group-hover:scale-110 mb-3">
        {getIcon(icon)}
      </div>

      {/* Skill Name */}
      <span className="relative z-10 text-center font-display text-xs sm:text-sm font-semibold tracking-wide text-foreground-subtle transition-colors duration-300 group-hover:text-foreground">
        {name}
      </span>
    </motion.div>
  )
})
