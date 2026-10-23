export const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
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
  /** cover image; optional only for in-development projects */
  image?: string
  images: string[]
  technologies: string[]
  category: string
  featured?: boolean
  /** muted looping clip shown in the featured card instead of the cover image */
  video?: string
  repoUrl?: string
  /** listed with a "coming soon" placeholder: no media, not clickable, not counted */
  inDevelopment?: boolean
}

export const PROJECTS: Project[] = [
  {
    id: 'dailyboost_AI',
    title: 'DailyBoost AI',
    description: 'AI money-management app: log spending by voice or by snapping a receipt, set budgets and savings goals, and ask an AI advisor that reads your own data.',
    longDescription: 'A mobile personal-finance app built around Gemini. Say a transaction out loud or photograph a receipt and the amount, category and note fill themselves in. Daily AI insights flag overspending, and the Atelier Finance AI chatbot answers questions using your real balance, budgets and goals. Includes per-category budgets, savings targets with progress, full history with spending charts, Google sign-in and real-time sync across devices through Convex.',
    image: '/projects/dailyboost_AI/DailyBoost_AI - Poster.webp',
    video: '/projects/dailyboost_AI/dailyboost-promo.mp4',
    images: [
      '/projects/dailyboost_AI/DailyBoost_AI - Home Page.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Home Page (cont.).webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Insight Page.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Goals Page.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Goals.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Goals (cont.).webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Budget Page.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Transaction Page Pemasukan.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Add Transaction Page Pengeluaran.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Chatbot AI Page.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Chatbot AI Page Choose Model.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Chatbot AI Page History.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - History Page.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Profile Page.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Profile Page (cont.).webp',
      '/projects/dailyboost_AI/DailyBoost_AI - Login Page.webp',
      '/projects/dailyboost_AI/DailyBoost_AI - SignUp Page.webp'
    ],
    repoUrl: 'https://github.com/adrielwalintukan/DailyBoostAI_MAD',
    technologies: ['React Native', 'Expo', 'TypeScript', 'Convex', 'Gemini API', 'Google OAuth'],
    category: 'AI Project / Mobile App',
    featured: true,
  },
  {
    id: 'AI_interview',
    title: 'Interview AI',
    description: 'Requirements-interview practice with real-time 3D AI clients who hide key facts until students ask the right questions.',
    longDescription: 'A platform for schools and campuses to practise requirements-elicitation interviews. Students talk by voice with six real-time 3D AI characters (clients, business owners, partners), each hiding facts that only surface when the questions are precise. After the session the AI grades the transcript against a rubric and teachers review the result. Live in production at interview-ai-id.vercel.app.',
    image: '/projects/interview_ai/Interview AI - Poster.webp',
    images: [
      '/projects/interview_ai/Interview AI - Landing.webp',
      '/projects/interview_ai/Interview AI - Ruang Wawancara.webp',
      '/projects/interview_ai/Interview AI - Laporan Sesi.webp',
      '/projects/interview_ai/Interview AI - Dashboard Pengajar.webp',
      '/projects/interview_ai/Interview AI - Karakter.webp',
      '/projects/interview_ai/Interview AI - Masuk.webp'
    ],
    video: '/projects/interview_ai/interview-ai-promo.mp4',
    repoUrl: 'https://github.com/adrielwalintukan/interviewAI',
    technologies: ['Next.js', 'TypeScript', 'Gemini Live API', 'React Three Fiber', 'Supabase', 'Tailwind CSS'],
    category: 'AI Project / Fullstack',
    featured: false,
  },
  {
    id: 'rinegetan_connect',
    title: 'Rinegetan Connect',
    description: 'Information and ministry platform for the GMAHK Rinegetan church, with public Bible-study courses that admins and editors publish.',
    images: [],
    repoUrl: 'https://github.com/adrielwalintukan/Rinegetan-Connect',
    technologies: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Framer Motion'],
    category: 'Web App',
    inDevelopment: true,
  },
  {
    id: 'rumah_makan_sipil',
    title: 'Rumah Makan Sipil',
    description: "Mobile-first food ordering for a local restaurant: scan the QR, order from your phone, pay by QRIS or cash, and orders reach the seller's dashboard in real time.",
    images: [],
    repoUrl: 'https://github.com/adrielwalintukan/Rumah-Makan-Sipil',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Supabase'],
    category: 'Web App',
    inDevelopment: true,
  },
  {
    id: 'kostfinder_unklab',
    title: 'KostFinder UNKLAB',
    description: 'Directory of university-approved boarding houses near UNKLAB: search and filter, compare photos and facilities, estimate the rent, then book with the owner over WhatsApp.',
    longDescription: "Built for UNKLAB students looking for a room in Airmadidi. Search by name or area, filter by men's or women's housing and price range, and sort the results; filters live in the URL, so a search can be shared. Each listing has a swipeable photo gallery, facilities and its location. The rent calculator totals monthly rent plus utilities over the stay, and the booking form validates the details and sends a ready-made request to the owner on WhatsApp. Mobile-first with a bottom tab bar, and tidy on desktop. Final project for Web Design, built as a team.",
    image: '/projects/kostfinder_unklab/KostFinder - Poster.webp',
    video: '/projects/kostfinder_unklab/kostfinder-promo.mp4',
    images: [
      '/projects/kostfinder_unklab/KostFinder - Beranda.webp',
      '/projects/kostfinder_unklab/KostFinder - Detail Kost.webp',
      '/projects/kostfinder_unklab/KostFinder - Booking.webp',
      '/projects/kostfinder_unklab/KostFinder - Kalkulator Sewa.webp',
      '/projects/kostfinder_unklab/KostFinder - Desktop.webp'
    ],
    repoUrl: 'https://github.com/adrielwalintukan/project-web-design',
    technologies: ['React', 'Vite', 'Tailwind CSS', 'React Router', 'View Transitions API'],
    category: 'Web App / UI/UX',
    featured: false,
  },
  {
    id: 'car_rental_website',
    title: 'Modern Car Rental Platform',
    description: 'A modern vehicle rental website with responsive booking-oriented user interface design.',
    image: '/projects/car_rental_website/Web_Rental_Mobil - Home.webp',
    images: [
      '/projects/car_rental_website/Web_Rental_Mobil - Home.webp',
      '/projects/car_rental_website/Web_Rental_Mobil - Mobil.webp',
      '/projects/car_rental_website/Web_Rental_Mobil - About.webp',
      '/projects/car_rental_website/Web_Rental_Mobil - Information.webp',
      '/projects/car_rental_website/Web_Rental_Mobil - Contact.webp'
    ],
    technologies: ['Web App', 'UI/UX', 'Frontend', 'Interactive Design'],
    category: 'Web App',
    featured: false,
  },
  {
    id: 'carta_AI',
    title: 'Carta AI',
    description: 'Mobile app that writes a complete digital wedding invitation with AI from a few details, then sends it to guests over WhatsApp.',
    longDescription: 'Pick a template (traditional, classic, elegant, bold or modern), enter the couple, date and venue, and Gemini writes the invitation. Premium adds background music, couple photos and a pre-wedding gallery. Each invitation comes with RSVP and wishes plus a digital gift envelope; hosts manage the guest list, send invitations over WhatsApp, keep a history of saved invitations and upgrade to Premium through Midtrans. Built as a team project with an Expo app and a FastAPI backend on Supabase.',
    image: '/projects/carta_AI/Carta_AI - Poster.webp',
    video: '/projects/carta_AI/carta-promo.mp4',
    images: [
      '/projects/carta_AI/Carta_AI - Home.webp',
      '/projects/carta_AI/Carta_AI - Asisten AI.webp',
      '/projects/carta_AI/Carta_AI - Template.webp',
      '/projects/carta_AI/Carta_AI - Generator Premium.webp',
      '/projects/carta_AI/Carta_AI - Undangan.webp',
      '/projects/carta_AI/Carta_AI - Rangkaian Acara.webp',
      '/projects/carta_AI/Carta_AI - RSVP & Ucapan.webp',
      '/projects/carta_AI/Carta_AI - Hadiah Digital.webp',
      '/projects/carta_AI/Carta_AI - Manajemen Tamu.webp',
      '/projects/carta_AI/Carta_AI - Dashboard.webp',
      // web version of the landing page
      '/projects/carta_AI/Carta_AI.webp'
    ],
    repoUrl: 'https://github.com/adrielwalintukan/cartaAI_MAD',
    technologies: ['React Native', 'Expo', 'FastAPI', 'Gemini API', 'Supabase', 'Midtrans'],
    category: 'AI Project / Mobile App',
    featured: false,
  },
  {
    id: 'system_management_klinik_sentosa',
    title: 'Klinik Sentosa Management System',
    description: 'Web-based clinic system that runs one patient flow across four roles: registration, live queue, doctor exam and prescription, pharmacy and billing.',
    longDescription: 'Replaces paper and scattered records at a clinic with one shared flow. Admins register patients with auto-generated medical record numbers, manage doctor schedules and track the live queue (waiting, examined, pharmacy, paying, done). Doctors record complaints and diagnoses and write digital prescriptions linked to pharmacy stock; pharmacists verify and prepare them and get low-stock alerts; billing totals doctor fees and medicine automatically. The clinic head sees revenue and visit reports, staff and doctor performance. Built as a team project with a React front end and a FastAPI back end.',
    image: '/projects/system_management_klinik_sentosa/Klinik_Sentosa - Poster.webp',
    video: '/projects/system_management_klinik_sentosa/klinik-sentosa-promo.mp4',
    images: [
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Login.webp',
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Dash_Admin.webp',
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Dash_Dokter.webp',
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Dash_Apoteker.webp',
      '/projects/system_management_klinik_sentosa/Sistem_Klinik-Dash_Kepala_Klinik.webp'
    ],
    repoUrl: 'https://github.com/adrielwalintukan/InformationSystemKlinikSentosa_SAD',
    technologies: ['React', 'Vite', 'Tailwind CSS', 'Zustand', 'FastAPI', 'SQLite'],
    category: 'Fullstack / Web App',
    featured: false,
  },
  {
    id: 'mobile_app_portofolio',
    title: 'Mobile Portfolio Experience',
    description: 'A native mobile app portfolio demonstration optimized for touch screens, custom gestures, and native transitions.',
    image: '/projects/mobile_app_portofolio/Home Page - MAD Portofolio.webp',
    images: [
      '/projects/mobile_app_portofolio/Home Page - MAD Portofolio.webp',
      '/projects/mobile_app_portofolio/Home Page (cont.) - MAD Portofolio.webp',
      '/projects/mobile_app_portofolio/Experience (Projects) - MAD Portofolio.webp',
      '/projects/mobile_app_portofolio/Experience (Certificates) - MAD Portofolio.webp',
      '/projects/mobile_app_portofolio/Experience (Organization) - MAD Portofolio.webp',
      '/projects/mobile_app_portofolio/Education - MAD Portofolio.webp'
    ],
    technologies: ['Mobile App', 'UI/UX', 'Frontend'],
    category: 'Mobile App',
    featured: false,
  },
  {
    id: 'system_library_mobile_app',
    title: 'System Library Mobile App',
    description: 'A comprehensive digital library management application featuring role-based dashboards, book tracking, and student visit gamification.',
    image: '/projects/system_library_mobile_app/Home Page (Student) - System Library (MAD).webp',
    images: [
      '/projects/system_library_mobile_app/Home Page (Student) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/Books Page (Student) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/Events Page (Student) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/Leaderboard Page (Student) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/Profile Page (Student) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/Dashboard (Admin) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/View All Students Page (Admin) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/View All Events Page (Admin) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/Add Event Page (Admin) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/View Event Participants Page (Admin) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/Set Visit Code Page (Admin) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/View All Students Visit Page (Admin) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/View All Students Point Page (Admin) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/Login Page (Student) - System Library (MAD).webp',
      '/projects/system_library_mobile_app/Register Page (Student) - System Library (MAD).webp'
    ],
    repoUrl: 'https://github.com/adrielwalintukan/UNKLAB_Library_Mobile_Application',
    technologies: ['Mobile App', 'Backend', 'Database', 'UI/UX'],
    category: 'Mobile App',
    featured: false,
  },
  {
    id: 'pablo_chatbot_AI',
    title: 'Pablo AI Chatbot',
    description: 'An intelligent chatbot interface providing natural language interactions and streamlined responses.',
    image: '/projects/pablo_chatbot_AI/Pablo_Chatbot - AI.webp',
    images: [
      '/projects/pablo_chatbot_AI/Pablo_Chatbot - AI.webp'
    ],
    technologies: ['AI Project', 'Frontend', 'Interactive Design'],
    category: 'AI Project',
    featured: false,
  }
]

// Shown as large stacked cards in Selected Work; the rest go in the "View all" list
export const SELECTED_PROJECT_IDS = [
  'dailyboost_AI',
  'AI_interview',
  'rinegetan_connect',
  'carta_AI',
  'system_management_klinik_sentosa',
]

// Other headline numbers (projects, technologies, certificates) are counted from the data below
export const YEARS_EXPERIENCE = 2


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
  /** organisation logo shown beside the title */
  logo?: string
}

export const EXPERIENCE_TIMELINE: TimelineItem[] = [
  {
    id: 'exp-new-1',
    year: 'Jun 2026 — Present',
    title: 'System Development Intern',
    role: 'LLDIKTI Wilayah XVI (Remote)',
    logo: '/logo-experience/lldikti16.webp',
    description: 'Developing and engineering enterprise information systems utilizing Laravel, Blade, Vite, and PostgreSQL architectures.',
    category: 'Experience',
    technologies: ['Laravel', 'Blade', 'Vite', 'PostgreSQL'],
  },
  {
    id: 'exp-1',
    year: 'Aug 2024 — Aug 2025',
    title: 'Web Developer',
    role: 'UVICS (Unklab Virtue in Computer Science)',
    logo: '/logo-experience/uvics.webp',
    description: 'Developed and maintained modern web applications, focusing on clean architecture, performance, and responsive user interfaces.',
    category: 'Experience',
    technologies: ['React', 'Next.js', 'Tailwind CSS'],
  },
  {
    id: 'exp-2',
    year: '2023 — 2027',
    title: 'Information System',
    role: 'Klabat University',
    logo: '/logo-experience/unklab.webp',
    description: 'Pursuing a degree in Information Systems, building a strong foundation in software engineering, algorithms, and systems architecture.',
    category: 'Education',
  },
  {
    id: 'exp-3',
    year: '2026',
    title: 'Division Sports',
    role: 'BEM Unklab 2026',
    logo: '/logo-experience/bem-unklab.webp',
    description: 'Active committee member in the Student Executive Board, organizing and managing faculty sports programs and events.',
    category: 'Organization',
  },
  {
    id: 'exp-4',
    year: 'Present',
    title: 'Member',
    role: 'UVICS & VOCS Choir',
    logo: '/logo-experience/vocs.webp',
    description: 'Active participant in Unklab Virtue in Computer Science and the Voice of Computer Science (VOCS Choir).',
    category: 'Organization',
  },
]


export const CONTACT_INFO = {
  email: 'adrielwalintukan27@gmail.com',
  location: 'Indonesia',
  city: 'Manado, Indonesia',
  timeZone: 'Asia/Makassar',
  timeZoneLabel: 'WITA',
  availability: 'Available for collaboration & opportunities',
}

export const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/AdrielWalintukan', icon: 'FiGithub' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/adriel-walintukan-383032332/', icon: 'FiLinkedin' },
  { name: 'Instagram', url: 'https://www.instagram.com/walintukann.adriel/', icon: 'FiInstagram' },
  { name: 'Email', url: 'mailto:adrielwalintukan27@gmail.com', icon: 'FiMail' },
]

export interface SkillCategory {
  category: string;
  description: string;
  skills: { name: string; level: number; icon: string }[];
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  year: string;
  date?: string;
  image: string;
  category: string;
  pdf?: string;
  pdf_rel?: string;
  link?: string;
  skills?: string[];
  description?: string;
}

export const SKILLS_DATA: SkillCategory[] = [
  {
    category: 'Fullstack & Backend / AI',
    description: 'APIs, databases and AI features that power real products.',
    skills: [
      { name: 'Python', level: 90, icon: 'python' },
      { name: 'FastAPI', level: 85, icon: 'fastapi' },
      { name: 'Google Gemini', level: 90, icon: 'gemini' },
      { name: 'REST API', level: 90, icon: 'restapi' },
      { name: 'Node.js', level: 85, icon: 'nodejs' },
      { name: 'PostgreSQL', level: 85, icon: 'postgresql' },
      { name: 'Laravel', level: 85, icon: 'laravel' },
      { name: 'Supabase', level: 80, icon: 'supabase' },
      { name: 'Convex', level: 80, icon: 'convex' },
      { name: 'SQL', level: 85, icon: 'database' },
    ],
  },
  {
    category: 'Frontend & Mobile',
    description: 'Fast, responsive interfaces for the web and cross-platform mobile apps.',
    skills: [
      { name: 'React Native', level: 90, icon: 'react' },
      { name: 'Expo', level: 85, icon: 'expo' },
      { name: 'Next.js', level: 85, icon: 'nextjs' },
      { name: 'TypeScript', level: 85, icon: 'typescript' },
      { name: 'JavaScript', level: 90, icon: 'javascript' },
      { name: 'Vite', level: 80, icon: 'vite' },
      { name: 'Blade', level: 80, icon: 'blade' },
    ],
  },
  {
    category: 'Tools & Design',
    description: 'Version control, UI design and testing to ship with confidence.',
    skills: [
      { name: 'Git', level: 90, icon: 'git' },
      { name: 'GitHub', level: 90, icon: 'github' },
      { name: 'Figma', level: 85, icon: 'figma' },
      { name: 'Software Testing', level: 85, icon: 'testing' },
    ],
  },
]

export const CERTIFICATES_DATA: Certificate[] = [
  {
    "id": "cert-anthropic-ai-fluency",
    "title": "AI Fluency: Framework & Foundations",
    "issuer": "Anthropic",
    "year": "2026",
    "date": "2026",
    "category": "Artificial Intelligence",
    "pdf": "/certificates/Anthropic/Anthropic - Al Fluency Framework & Foundations.pdf",
    "pdf_rel": "Anthropic\\Anthropic - Al Fluency Framework & Foundations.pdf",
    "skills": [
      "AI Fluency",
      "Human-AI Collaboration",
      "Responsible AI"
    ],
    "description": "Anthropic's course on working with AI effectively, efficiently, ethically and safely, built with University College Cork and Ringling College.",
    "image": "/certificates/_thumbnails/cert-anthropic-ai-fluency.webp",
    "link": "/certificates/Anthropic/Anthropic - Al Fluency Framework & Foundations.pdf"
  },
  {
    "id": "cert-cisco-cybersecurity",
    "title": "Introduction to Cybersecurity",
    "issuer": "Cisco Networking Academy",
    "year": "2026",
    "date": "Feb 2026",
    "category": "Cybersecurity",
    "pdf": "/certificates/CISCO/Introduction_to_Cybersecurity_certificate.pdf",
    "pdf_rel": "CISCO\\Introduction_to_Cybersecurity_certificate.pdf",
    "skills": [
      "Cybersecurity",
      "Network Defense",
      "Threat Detection"
    ],
    "description": "Comprehensive understanding of cyber threats, basic cryptography, network defense techniques, and privacy principles.",
    "image": "/certificates/_thumbnails/cert-cisco-cybersecurity.webp",
    "link": "/certificates/CISCO/Introduction_to_Cybersecurity_certificate.pdf"
  },
  {
    "id": "cert-ibm-granite-code-gen",
    "title": "Code Generation and Optimization Using IBM Granite",
    "issuer": "IBM SkillsBuild",
    "year": "2025",
    "date": "Sep 2025",
    "category": "Artificial Intelligence",
    "pdf": "/certificates/Generative AI - IBM/IBMDesign20250913-34-28yo6n.pdf",
    "pdf_rel": "Generative AI - IBM\\IBMDesign20250913-34-28yo6n.pdf",
    "skills": [
      "Generative AI",
      "IBM Granite",
      "Code Optimization",
      "Prompt Engineering"
    ],
    "description": "Certified credential for utilizing IBM Granite foundation models for intelligent code generation, unit testing, and code refactoring.",
    "image": "/certificates/_thumbnails/cert-ibm-granite-code-gen.webp",
    "link": "/certificates/Generative AI - IBM/IBMDesign20250913-34-28yo6n.pdf"
  },
  {
    "id": "cert-ibm-genai-software-dev",
    "title": "Use Generative AI for Software Development",
    "issuer": "IBM SkillsBuild",
    "year": "2025",
    "date": "Sep 2025",
    "category": "Artificial Intelligence",
    "pdf": "/certificates/Generative AI - IBM/Completion Certificate _ SkillsBuild.pdf",
    "pdf_rel": "Generative AI - IBM\\Completion Certificate _ SkillsBuild.pdf",
    "skills": [
      "AI Integration",
      "Software Engineering",
      "Moodle Certified"
    ],
    "description": "Practical integration of Generative AI tools and assistants into modern software development lifecycles.",
    "image": "/certificates/_thumbnails/cert-ibm-genai-software-dev.webp",
    "link": "/certificates/Generative AI - IBM/Completion Certificate _ SkillsBuild.pdf"
  },
  {
    "id": "cert-dicoding-aws-cloud-genai",
    "title": "Cloud Computing & Generative AI Basics on AWS",
    "issuer": "Dicoding × AWS",
    "year": "2026",
    "date": "Oct 2026",
    "category": "Cloud Computing",
    "pdf": "/certificates/Dicoding/Cloud Computing & Generative AI Basics on AWS.pdf",
    "pdf_rel": "Dicoding\\Cloud Computing & Generative AI Basics on AWS.pdf",
    "skills": [
      "AWS Cloud",
      "EC2 & S3",
      "IAM & Security",
      "Generative AI"
    ],
    "description": "Competency certificate (valid until 2029) covering AWS compute, global infrastructure, networking, storage, security, pricing and AWS AI services, aligned with the Cloud Practitioner exam.",
    "image": "/certificates/_thumbnails/cert-dicoding-aws-cloud-genai.webp",
    "link": "/certificates/Dicoding/Cloud Computing & Generative AI Basics on AWS.pdf"
  },
  {
    "id": "cert-dicoding-kiro-sdd",
    "title": "Spec-Driven Development with Kiro",
    "issuer": "Dicoding × AWS",
    "year": "2026",
    "date": "Oct 2026",
    "category": "Software Engineering",
    "pdf": "/certificates/Dicoding/Spec-Driven Development dengan Kiro.pdf",
    "pdf_rel": "Dicoding\\Spec-Driven Development dengan Kiro.pdf",
    "skills": [
      "Spec-Driven Development",
      "Kiro",
      "AI-Assisted Coding",
      "Code Quality"
    ],
    "description": "Competency certificate (valid until 2029) on building complete, documented features with Kiro, moving from requirements to design to implementation tasks.",
    "image": "/certificates/_thumbnails/cert-dicoding-kiro-sdd.webp",
    "link": "/certificates/Dicoding/Spec-Driven Development dengan Kiro.pdf"
  },
  {
    "id": "cert-cpent-ai",
    "title": "The Future of Penetration Testing with CPENT AI",
    "issuer": "EC-Council / Cybersecurity Seminar",
    "year": "2025",
    "date": "2025",
    "category": "Cybersecurity",
    "pdf": "/certificates/The Future of Penetration Testing with CPENT AI/The Future of Penetration Testing with CPENT AI.pdf",
    "pdf_rel": "The Future of Penetration Testing with CPENT AI\\The Future of Penetration Testing with CPENT AI.pdf",
    "skills": [
      "AI in Pentesting",
      "CPENT",
      "Threat Modeling"
    ],
    "description": "Specialized seminar exploring AI-driven penetration testing, automated vulnerability assessments, and modern exploit analysis.",
    "image": "/certificates/_thumbnails/cert-cpent-ai.webp",
    "link": "/certificates/The Future of Penetration Testing with CPENT AI/The Future of Penetration Testing with CPENT AI.pdf"
  },
  {
    "id": "cert-simplilearn-cissp",
    "title": "CISSP Security Assessment & Testing and Security Operations",
    "issuer": "Simplilearn SkillUp",
    "year": "2025",
    "date": "2025",
    "category": "Cybersecurity",
    "pdf": "/certificates/Simplilearn/Introduction to CISSP Security Assessment & Testing and Security Operations/Introduction to CISSP Security Assessment & Testing and Security Operations.pdf",
    "pdf_rel": "Simplilearn\\Introduction to CISSP Security Assessment & Testing and Security Operations\\Introduction to CISSP Security Assessment & Testing and Security Operations.pdf",
    "skills": [
      "Security Testing",
      "Vulnerability Assessment",
      "Security Operations"
    ],
    "description": "Advanced security assessment methodologies, penetration test concepts, and security operational controls.",
    "image": "/certificates/_thumbnails/cert-simplilearn-cissp.webp",
    "link": "/certificates/Simplilearn/Introduction to CISSP Security Assessment & Testing and Security Operations/Introduction to CISSP Security Assessment & Testing and Security Operations.pdf"
  },
  {
    "id": "cert-simplilearn-cybersecurity",
    "title": "Introduction to Cyber Security",
    "issuer": "Simplilearn SkillUp",
    "year": "2025",
    "date": "2025",
    "category": "Cybersecurity",
    "pdf": "/certificates/Simplilearn/Introduction to Cyber Security/Introduction to Cyber Security.pdf",
    "pdf_rel": "Simplilearn\\Introduction to Cyber Security\\Introduction to Cyber Security.pdf",
    "skills": [
      "Cyber Defense",
      "Incident Response",
      "Information Security"
    ],
    "description": "Core cybersecurity principles, threat mitigation strategies, and defensive security measures.",
    "image": "/certificates/_thumbnails/cert-simplilearn-cybersecurity.webp",
    "link": "/certificates/Simplilearn/Introduction to Cyber Security/Introduction to Cyber Security.pdf"
  },
  {
    "id": "cert-simplilearn-frontend",
    "title": "Introduction to Front End Development",
    "issuer": "Simplilearn SkillUp",
    "year": "2025",
    "date": "2025",
    "category": "Web Development",
    "pdf": "/certificates/Simplilearn/Introduction to Front End Development/Introduction to Front End Development.pdf",
    "pdf_rel": "Simplilearn\\Introduction to Front End Development\\Introduction to Front End Development.pdf",
    "skills": [
      "HTML5",
      "CSS3",
      "JavaScript",
      "Responsive Design"
    ],
    "description": "Foundational masterclass in modern frontend architecture, interactive layouts, and user experience engineering.",
    "image": "/certificates/_thumbnails/cert-simplilearn-frontend.webp",
    "link": "/certificates/Simplilearn/Introduction to Front End Development/Introduction to Front End Development.pdf"
  },
  {
    "id": "cert-uvics-webdev",
    "title": "Web Development Specialist",
    "issuer": "UVICS (UNKLAB Virtue in Computer Science)",
    "year": "2025",
    "date": "2024 — 2025",
    "category": "Web Development",
    "pdf": "/certificates/Web Dev - UVICS/Sertifikat-UVICS-WebDev.pdf",
    "pdf_rel": "Web Dev - UVICS\\Sertifikat-UVICS-WebDev.pdf",
    "skills": [
      "React",
      "Next.js",
      "Web Engineering",
      "Team Collaboration"
    ],
    "description": "Official certification of contribution as Web Developer developing and maintaining student organization web systems.",
    "image": "/certificates/_thumbnails/cert-uvics-webdev.webp",
    "link": "/certificates/Web Dev - UVICS/Sertifikat-UVICS-WebDev.pdf"
  },
  {
    "id": "cert-proxo-appreciation",
    "title": "Proxo Coris 2026 — Mobile App Development",
    "issuer": "PROXO X Coris International Competition",
    "year": "2026",
    "date": "2026",
    "category": "Competition / Award",
    "pdf": "/certificates/Mobile App Dev - Proxo/Certificate of Appreciation_JAT.pdf",
    "pdf_rel": "Mobile App Dev - Proxo\\Certificate of Appreciation_JAT.pdf",
    "skills": [
      "Technical Excellence",
      "Team Leadership"
    ],
    "description": "Certificate of appreciation awarded for dedicated participation and technical excellence.",
    "image": "/certificates/_thumbnails/cert-proxo-appreciation.webp",
    "link": "/certificates/Mobile App Dev - Proxo/Certificate of Appreciation_JAT.pdf"
  },
  {
    "id": "cert-iris-robotics",
    "title": "IRIS Tech Seminar & Workshop",
    "issuer": "IRIS (Intelligent Robotics & Information Systems)",
    "year": "2025",
    "date": "2025",
    "category": "Artificial Intelligence",
    "pdf": "/certificates/IRIS/Sertifikat-IRIS.pdf",
    "pdf_rel": "IRIS\\Sertifikat-IRIS.pdf",
    "skills": [
      "Robotics",
      "Intelligent Systems",
      "IoT"
    ],
    "description": "Workshop on emerging intelligent robotics, automation, and intelligent system architectures.",
    "image": "/certificates/_thumbnails/cert-iris-robotics.webp",
    "link": "/certificates/IRIS/Sertifikat-IRIS.pdf"
  },
  {
    "id": "cert-proxo-shortmovie",
    "title": "Short Movie Production — Proxo Coris",
    "issuer": "PROXO X Coris International Competition",
    "year": "2026",
    "date": "2026",
    "category": "Creative & Media",
    "pdf": "/certificates/Short Movie - Proxo/Sertifikat-ShortMovie.pdf",
    "pdf_rel": "Short Movie - Proxo\\Sertifikat-ShortMovie.pdf",
    "skills": [
      "Creative Direction",
      "Storytelling",
      "Digital Media"
    ],
    "description": "Recognition for multimedia production and creative storytelling competition.",
    "image": "/certificates/_thumbnails/cert-proxo-shortmovie.webp",
    "link": "/certificates/Short Movie - Proxo/Sertifikat-ShortMovie.pdf"
  }
]



