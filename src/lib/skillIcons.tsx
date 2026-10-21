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

/** Brand icon for a skill, matched on its icon code and name. */
export const getSkillIcon = (iconName?: string, skillName?: string) => {
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
