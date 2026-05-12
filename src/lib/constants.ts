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
  images: string[]
  technologies: string[]
  category: string
  featured?: boolean
}

export const PROJECTS: Project[] = [
  {
    id: 'dailyboost_AI',
    title: 'DailyBoost AI',
    description: 'A productivity-focused AI application designed to improve task management and daily workflow efficiency.',
    longDescription: 'A comprehensive intelligent application focused on streamlining user workflows, budgeting, and interactive chat features. Designed with immersive mobile interfaces and real-time state synchronisation.',
    image: '/projects/dailyboost_AI/DailyBoost_AI - Home Page.jpeg',
    images: [
      '/projects/dailyboost_AI/DailyBoost_AI - Home Page.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Home Page (cont.).jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Insight Page.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Goals Page.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Goals.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Goals (cont.).jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Budget Page.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Transaction Page Pemasukan.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Transaction Page Pengeluaran.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Chatbot AI Page.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Chatbot AI Page Choose Model.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Chatbot AI Page History.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - History Page.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Profile Page.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Profile Page (cont.).jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - Login Page.jpeg',
      '/projects/dailyboost_AI/DailyBoost_AI - SignUp Page.jpeg'
    ],
    technologies: ['AI Project', 'Fullstack', 'Mobile App', 'Interactive Design'],
    category: 'AI Project / Fullstack',
    featured: true,
  },
  {
    id: 'AI_interview',
    title: 'AI Interview Simulator',
    description: 'An AI-powered interview simulation application focused on interactive conversation flow and user experience.',
    image: '/projects/AI_interview/AI_Interview - Login.png',
    images: [
      '/projects/AI_interview/AI_Interview - Login.png',
      '/projects/AI_interview/AI_Interview - Pilih_Skenario_Mahasiswa.png',
      '/projects/AI_interview/AI_Interview - Hal_Interview_AI.png',
      '/projects/AI_interview/AI_Interview - Dash_Dosen.png'
    ],
    technologies: ['AI Project', 'Web App', 'UI/UX', 'Interactive Design'],
    category: 'AI Project',
    featured: false,
  },
  {
    id: 'car_rental_website',
    title: 'Modern Car Rental Platform',
    description: 'A modern vehicle rental website with responsive booking-oriented user interface design.',
    image: '/projects/car_rental_website/Web_Rental_Mobil - Home.png',
    images: [
      '/projects/car_rental_website/Web_Rental_Mobil - Home.png',
      '/projects/car_rental_website/Web_Rental_Mobil - Mobil.png',
      '/projects/car_rental_website/Web_Rental_Mobil - About.png',
      '/projects/car_rental_website/Web_Rental_Mobil - Information.png',
      '/projects/car_rental_website/Web_Rental_Mobil - Contact.png'
    ],
    technologies: ['Web App', 'UI/UX', 'Frontend', 'Interactive Design'],
    category: 'Web App',
    featured: false,
  },
  {
    id: 'kostfinder_unklab',
    title: 'KostFinder UNKLAB',
    description: 'A modern boarding house search and booking application tailored for university students with integrated price calculators.',
    image: '/projects/kostfinder_unklab/KostFinder_UNKLAB - Home.png',
    images: [
      '/projects/kostfinder_unklab/KostFinder_UNKLAB - Home.png',
      '/projects/kostfinder_unklab/KostFinder_UNKLAB - Rekom_Kost.png',
      '/projects/kostfinder_unklab/KostFinder_UNKLAB - Detail_Kost.png',
      '/projects/kostfinder_unklab/KostFinder_UNKLAB - Booking_Kost.png',
      '/projects/kostfinder_unklab/KostFinder_UNKLAB - Kalkulator_Sewa.png'
    ],
    technologies: ['Fullstack', 'Web App', 'Database', 'UI/UX'],
    category: 'Fullstack / UI/UX',
    featured: false,
  },
  {
    id: 'system_library_mobile_app',
    title: 'System Library Mobile App',
    description: 'A comprehensive digital library management application featuring role-based dashboards, book tracking, and student visit gamification.',
    image: '/projects/system_library_mobile_app/Home Page (Student) - System Library (MAD).jpeg',
    images: [
      '/projects/system_library_mobile_app/Home Page (Student) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/Books Page (Student) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/Events Page (Student) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/Leaderboard Page (Student) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/Profile Page (Student) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/Dashboard (Admin) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/View All Students Page (Admin) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/View All Events Page (Admin) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/Add Event Page (Admin) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/View Event Participants Page (Admin) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/Set Visit Code Page (Admin) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/View All Students Visit Page (Admin) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/View All Students Point Page (Admin) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/Login Page (Student) - System Library (MAD).jpeg',
      '/projects/system_library_mobile_app/Register Page (Student) - System Library (MAD).jpeg'
    ],
    technologies: ['Mobile App', 'Backend', 'Database', 'UI/UX'],
    category: 'Mobile App',
    featured: false,
  },
  {
    id: 'system_management_klinik_sentosa',
    title: 'Klinik Sentosa Management System',
    description: 'An integrated healthcare facility management system providing customized workflows for administrators, doctors, and pharmacists.',
    image: '/projects/system_management_klinik_sentosa/Sistem_Klinik-Login.jpeg',
    images: [
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Login.jpeg',
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Dash_Admin.jpeg',
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Dash_Dokter.jpeg',
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Dash_Apoteker.jpeg',
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Dash_Kepala_Klinik.jpeg'
    ],
    technologies: ['Fullstack', 'Backend', 'Database', 'Interactive Design'],
    category: 'Fullstack',
    featured: false,
  },
  {
    id: 'web_infomation_ray',
    title: 'RAY Information Web Portal',
    description: 'An informational web portal focused on elegant content delivery, visual galleries, and clean user interfaces.',
    image: '/projects/web_infomation_ray/Web_Informasi_RAY - Home.png',
    images: [
      '/projects/web_infomation_ray/Web_Informasi_RAY - Home.png',
      '/projects/web_infomation_ray/Web_Informasi_RAY - About.png',
      '/projects/web_infomation_ray/Web_Informasi_RAY - Gallery.png'
    ],
    technologies: ['Web App', 'Frontend', 'UI/UX'],
    category: 'Web App',
    featured: false,
  },
  {
    id: 'web_portofolio_AI',
    title: 'AI Web Portfolio Showcase',
    description: 'A futuristic AI-augmented web portfolio designed to demonstrate intelligent chatbot integrations and dynamic themes.',
    image: '/projects/web_portofolio_AI/Web_Portofolio_AI - Home.png',
    images: [
      '/projects/web_portofolio_AI/Web_Portofolio_AI - Home.png',
      '/projects/web_portofolio_AI/Web_Portofolio_AI - Chatbot.png'
    ],
    technologies: ['AI Project', 'Web App', 'Frontend', 'Interactive Design'],
    category: 'AI Project',
    featured: false,
  },
  {
    id: 'mobile_app_portofolio',
    title: 'Mobile Portfolio Experience',
    description: 'A native mobile app portfolio demonstration optimized for touch screens, custom gestures, and native transitions.',
    image: '/projects/mobile_app_portofolio/Home Page - MAD Portofolio.jpeg',
    images: [
      '/projects/mobile_app_portofolio/Home Page - MAD Portofolio.jpeg',
      '/projects/mobile_app_portofolio/Home Page (cont.) - MAD Portofolio.jpeg',
      '/projects/mobile_app_portofolio/Experience (Projects) - MAD Portofolio.jpeg',
      '/projects/mobile_app_portofolio/Experience (Certificates) - MAD Portofolio.jpeg',
      '/projects/mobile_app_portofolio/Experience (Organization) - MAD Portofolio.jpeg',
      '/projects/mobile_app_portofolio/Education - MAD Portofolio.jpeg'
    ],
    technologies: ['Mobile App', 'UI/UX', 'Frontend'],
    category: 'Mobile App',
    featured: false,
  },
  {
    id: 'carta_AI',
    title: 'Carta AI Assistant',
    description: 'A specialized intelligent assistant interface designed for streamlined contextual data visualization and conversational exploration.',
    image: '/projects/carta_AI/Carta_AI.jpeg',
    images: [
      '/projects/carta_AI/Carta_AI.jpeg'
    ],
    technologies: ['AI Project', 'UI/UX', 'Interactive Design'],
    category: 'AI Project',
    featured: false,
  },
  {
    id: 'pablo_chatbot_AI',
    title: 'Pablo AI Chatbot',
    description: 'An intelligent chatbot interface providing natural language interactions and streamlined responses.',
    image: '/projects/pablo_chatbot_AI/Pablo_Chatbot - AI.png',
    images: [
      '/projects/pablo_chatbot_AI/Pablo_Chatbot - AI.png'
    ],
    technologies: ['AI Project', 'Frontend', 'Interactive Design'],
    category: 'AI Project',
    featured: false,
  },
  {
    id: 'personal_portofolio',
    title: 'Cinematic Personal Portfolio',
    description: 'A high-performance cinematic digital showcase implementing state-of-the-art interactive layouts and visual elements.',
    image: '/projects/personal_portofolio/Web_Portofolio.png',
    images: [
      '/projects/personal_portofolio/Web_Portofolio.png'
    ],
    technologies: ['Web App', 'UI/UX', 'Frontend', 'Interactive Design'],
    category: 'Web App',
    featured: false,
  },
  {
    id: 'portofolio_adriel',
    title: 'Adriel Web Portfolio Core',
    description: 'The comprehensive architectural foundation of the primary portfolio application built for premium user engagement.',
    image: '/projects/project_featured.png',
    images: [
      '/projects/project_featured.png'
    ],
    technologies: ['Fullstack', 'Web App', 'UI/UX', 'Interactive Design'],
    category: 'Fullstack',
    featured: false,
  }
]

export const ABOUT_STATS = [
  { label: 'Years Experience', value: 2, suffix: '+' },
  { label: 'Projects Completed', value: 13, suffix: '+' },
  { label: 'Technologies', value: 10, suffix: '+' },
]

export const CORE_STRENGTHS = [
  'AI Integration',
  'Web Developer',
  'Mobile App Developer',
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
