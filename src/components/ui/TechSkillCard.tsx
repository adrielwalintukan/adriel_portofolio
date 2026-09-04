import { memo } from 'react'
import { motion } from 'framer-motion'
import { FiDatabase, FiHexagon, FiCheckCircle } from 'react-icons/fi'
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
  SiPostgresql,
  SiFastapi,
  SiGooglegemini,
  SiExpo,
  SiFigma,
  SiTestinglibrary,
  SiPostman
} from 'react-icons/si'
import { cn } from '@/lib/utils'

interface TechSkillCardProps {
  name: string
  level?: number
  icon?: string
  className?: string
}

// Icon mapping function matching both icon code and skill name
const getIcon = (iconName?: string, skillName?: string) => {
  const key = `${iconName || ''} ${skillName || ''}`.toLowerCase().trim()

  if (key.includes('fastapi')) return <SiFastapi className="text-[#009688]" />
  if (key.includes('gemini')) return <SiGooglegemini className="text-[#8E75FF]" />
  if (key.includes('rest') || key.includes('api') || key.includes('postman')) return <SiPostman className="text-[#FF6C37]" />
  if (key.includes('expo')) return <SiExpo className="text-foreground" />
  if (key.includes('figma')) return <SiFigma className="text-[#F24E1E]" />
  if (key.includes('testing') || key.includes('qa')) return <SiTestinglibrary className="text-[#E33332]" />
  if (key.includes('blade')) return <SiLaravel className="text-[#FF2D20]" />
  if (key.includes('python')) return <SiPython className="text-[#3776AB]" />
  if (key.includes('node')) return <SiNodedotjs className="text-[#339933]" />
  if (key.includes('supabase')) return <SiSupabase className="text-[#3ECF8E]" />
  if (key.includes('react')) return <SiReact className="text-[#61DAFB]" />
  if (key.includes('javascript')) return <SiJavascript className="text-[#F7DF1E]" />
  if (key.includes('typescript')) return <SiTypescript className="text-[#3178C6]" />
  if (key.includes('next')) return <SiNextdotjs className="text-foreground" />
  if (key.includes('vite')) return <SiVite className="text-[#646CFF]" />
  if (key.includes('git') && !key.includes('github')) return <SiGit className="text-[#F05032]" />
  if (key.includes('github')) return <SiGithub className="text-foreground" />
  if (key.includes('laravel')) return <SiLaravel className="text-[#FF2D20]" />
  if (key.includes('postgres')) return <SiPostgresql className="text-[#4169E1]" />
  if (key.includes('database') || key.includes('sql')) return <FiDatabase className="text-accent" />
  if (key.includes('convex')) return <FiHexagon className="text-neon-cyan" />
  return <FiCheckCircle className="text-accent" />
}

/**
 * Premium cinematic floating badge for individual technical skills.
 * Features official brand icons and smooth hovering dynamics.
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
        {getIcon(icon, name)}
      </div>

      {/* Skill Name */}
      <span className="relative z-10 text-center font-display text-xs sm:text-sm font-semibold tracking-wide text-foreground-subtle transition-colors duration-300 group-hover:text-foreground">
        {name}
      </span>
    </motion.div>
  )
})
