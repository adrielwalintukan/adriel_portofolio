/**
 * Core type definitions for the portfolio.
 */

export interface Project {
  id: string
  title: string
  description: string
  longDescription?: string
  technologies: string[]
  imageUrl: string
  liveUrl?: string
  githubUrl?: string
  featured?: boolean
  category: ProjectCategory
}

export type ProjectCategory = 'web' | 'mobile' | 'fullstack' | 'ai' | 'other'

export interface Skill {
  name: string
  icon?: string
  level: number // 0-100
  category: SkillCategory
}

export type SkillCategory = 'frontend' | 'backend' | 'tools' | 'design' | 'other'

export interface Experience {
  id: string
  title: string
  company: string
  companyUrl?: string
  location: string
  startDate: string
  endDate?: string
  description: string
  highlights: string[]
}

export interface SocialLink {
  platform: string
  url: string
  icon: string
}

export interface NavLink {
  label: string
  href: string
}
