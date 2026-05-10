export const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Experience', href: '#experience' },
  { label: 'Certificates', href: '#certificates' },
  { label: 'Contact', href: '#contact' },
] as const

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export interface Project {
  id: string
  title: string
  description: string
  longDescription?: string
  image: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  category: string
  featured?: boolean
}

export const PROJECTS: Project[] = [
  {
    id: 'project-1',
    title: 'DailyBoost AI',
    description: 'An AI-powered productivity platform featuring smart financial insights and auto-refresh mechanisms.',
    longDescription: 'A comprehensive full-stack application leveraging modern AI capabilities to analyze financial patterns and optimize daily workflows. Built with a heavy focus on performance and seamless data synchronization.',
    image: '/projects/project_featured.png',
    technologies: ['React Native', 'Expo', 'Convex', 'Google Generative AI', 'TypeScript'],
    githubUrl: '#',
    liveUrl: '#',
    category: 'Fullstack App',
    featured: true,
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `project-${i + 2}`,
    title: `Project Title ${i + 2}`,
    description: 'A modern, high-performance project showcasing problem-solving and clean architecture.',
    image: '/projects/project_placeholder.png',
    technologies: ['React', 'TypeScript', 'Tailwind'],
    category: 'Development',
    featured: false,
  })),
]

export const ABOUT_STATS = [
  { label: 'Years Experience', value: 2, suffix: '+' },
  { label: 'Projects Completed', value: 13, suffix: '+' },
  { label: 'Technologies', value: 10, suffix: '+' },
]

export const CORE_STRENGTHS = [
  'AI Integration',
  'Web Development',
  'Mobile App Development',
  'Python',
  'Software Testing'
]

export interface TimelineItem {
  id: string
  year: string
  title: string
  role: string
  description: string
  category: string
  technologies?: string[]
}

export const EXPERIENCE_TIMELINE: TimelineItem[] = [
  {
    id: 'exp-1',
    year: 'Aug 2024 — Aug 2025',
    title: 'Web Developer',
    role: 'UVICS (Unklab Virtue in Computer Science)',
    description: 'Developed and maintained modern web applications, focusing on clean architecture, performance, and responsive user interfaces.',
    category: 'Experience',
    technologies: ['React', 'Next.js', 'Tailwind CSS'],
  },
  {
    id: 'exp-2',
    year: '2023 — 2027',
    title: 'Information System',
    role: 'Klabat University',
    description: 'Pursuing a degree in Information Systems, building a strong foundation in software engineering, algorithms, and systems architecture.',
    category: 'Education',
  },
  {
    id: 'exp-3',
    year: '2026',
    title: 'Division Sports',
    role: 'BEM Unklab 2026',
    description: 'Active committee member in the Student Executive Board, organizing and managing faculty sports programs and events.',
    category: 'Organization',
  },
  {
    id: 'exp-4',
    year: 'Present',
    title: 'Member',
    role: 'UVICS & VOCS Choir',
    description: 'Active participant in Unklab Virtue in Computer Science and the Voice of Computer Science (VOCS Choir).',
    category: 'Organization',
  },
]


export const CONTACT_INFO = {
  email: 'adrielwalintukan@gmail.com',
  location: 'Indonesia',
  availability: 'Available for collaboration & opportunities',
}

export const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/AdrielWalintukan', icon: 'FiGithub' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/adriel-walintukan-56ba48259/', icon: 'FiLinkedin' },
  { name: 'Instagram', url: 'https://www.instagram.com/adrielw_/', icon: 'FiInstagram' },
  { name: 'Email', url: 'mailto:adrielwalintukan@gmail.com', icon: 'FiMail' },
]

export interface SkillCategory {
  category: string;
  skills: { name: string; level: number; icon: string }[];
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  year: string;
  image: string;
  category: string;
  link?: string;
}

export const SKILLS_DATA: SkillCategory[] = [
  {
    category: 'Fullstack & Backend',
    skills: [
      { name: 'Python', level: 90, icon: 'python' },
      { name: 'Node.js', level: 85, icon: 'nodejs' },
      { name: 'SQL', level: 85, icon: 'database' },
      { name: 'Supabase', level: 80, icon: 'supabase' },
      { name: 'Convex', level: 80, icon: 'convex' },
    ],
  },
  {
    category: 'Frontend & Mobile',
    skills: [
      { name: 'React Native', level: 90, icon: 'react' },
      { name: 'JavaScript', level: 90, icon: 'javascript' },
      { name: 'TypeScript', level: 85, icon: 'typescript' },
      { name: 'Next.js', level: 85, icon: 'nextjs' },
      { name: 'Vite', level: 80, icon: 'vite' },
    ],
  },
  {
    category: 'Tools & Other',
    skills: [
      { name: 'Git & GitHub', level: 90, icon: 'git' },
      { name: 'Software Testing', level: 85, icon: 'code' },
    ],
  },
]

export const CERTIFICATES_DATA = Array.from({ length: 11 }, (_, i) => ({
  id: `cert-${i + 1}`,
  title: `Professional Certificate ${i + 1}`,
  issuer: 'Certification Authority',
  year: '2024',
  image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop',
  category: 'Professional Development',
}))
