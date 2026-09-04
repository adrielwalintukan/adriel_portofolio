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
    id: 'exp-new-1',
    year: 'Jun 2026 — Present',
    title: 'System Development Intern',
    role: 'LLDIKTI Wilayah XVI (Remote)',
    description: 'Developing and engineering enterprise information systems utilizing Laravel, Blade, Vite, and PostgreSQL architectures.',
    category: 'Experience',
    technologies: ['Laravel', 'Blade', 'Vite', 'PostgreSQL'],
  },
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
  email: 'adrielwalintukan27@gmail.com',
  location: 'Indonesia',
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
    "image": "/certificates/_thumbnails/cert-cisco-cybersecurity.png",
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
    "image": "/certificates/_thumbnails/cert-ibm-granite-code-gen.png",
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
    "image": "/certificates/_thumbnails/cert-ibm-genai-software-dev.png",
    "link": "/certificates/Generative AI - IBM/Completion Certificate _ SkillsBuild.pdf"
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
    "image": "/certificates/_thumbnails/cert-simplilearn-frontend.png",
    "link": "/certificates/Simplilearn/Introduction to Front End Development/Introduction to Front End Development.pdf"
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
    "image": "/certificates/_thumbnails/cert-simplilearn-cissp.png",
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
    "image": "/certificates/_thumbnails/cert-simplilearn-cybersecurity.png",
    "link": "/certificates/Simplilearn/Introduction to Cyber Security/Introduction to Cyber Security.pdf"
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
    "image": "/certificates/_thumbnails/cert-uvics-webdev.png",
    "link": "/certificates/Web Dev - UVICS/Sertifikat-UVICS-WebDev.pdf"
  },
  {
    "id": "cert-proxo-mobile-app",
    "title": "Proxo Coris 2026 — Mobile App Development",
    "issuer": "Proxo Coris National Competition",
    "year": "2026",
    "date": "May 2026",
    "category": "Competition / Award",
    "pdf": "/certificates/Mobile App Dev - Proxo/PARTICIPANT_MOBILE APP (Adriel).pdf",
    "pdf_rel": "Mobile App Dev - Proxo\\PARTICIPANT_MOBILE APP (Adriel).pdf",
    "skills": [
      "React Native",
      "Mobile Innovation",
      "National Contest"
    ],
    "description": "Certificate of participation & achievement in the national Proxo Coris 2026 Mobile Application Development competition.",
    "image": "/certificates/_thumbnails/cert-proxo-mobile-app.png",
    "link": "/certificates/Mobile App Dev - Proxo/PARTICIPANT_MOBILE APP (Adriel).pdf"
  },
  {
    "id": "cert-proxo-appreciation",
    "title": "Certificate of Appreciation — Proxo Coris",
    "issuer": "Proxo Coris Committee",
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
    "image": "/certificates/_thumbnails/cert-proxo-appreciation.png",
    "link": "/certificates/Mobile App Dev - Proxo/Certificate of Appreciation_JAT.pdf"
  },
  {
    "id": "cert-proxo-shortmovie",
    "title": "Short Movie Production — Proxo Coris",
    "issuer": "Proxo Coris Competition",
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
    "image": "/certificates/_thumbnails/cert-proxo-shortmovie.png",
    "link": "/certificates/Short Movie - Proxo/Sertifikat-ShortMovie.pdf"
  },
  {
    "id": "cert-cfds-ugm",
    "title": "Diffusion #127 — Digital Society & Labor Tech",
    "issuer": "Center for Digital Society (CfDS) UGM & Oxford",
    "year": "2025",
    "date": "Sep 2025",
    "category": "Technology & Society",
    "pdf": "/certificates/Center for Digital Society/Sertifikat Difussion 127 (124).pdf",
    "pdf_rel": "Center for Digital Society\\Sertifikat Difussion 127 (124).pdf",
    "skills": [
      "Digital Ethics",
      "Data Governance",
      "Worker Info Exchange"
    ],
    "description": "International seminar organized by CfDS UGM in collaboration with University of Oxford on digital society and data rights.",
    "image": "/certificates/_thumbnails/cert-cfds-ugm.png",
    "link": "/certificates/Center for Digital Society/Sertifikat Difussion 127 (124).pdf"
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
    "image": "/certificates/_thumbnails/cert-iris-robotics.png",
    "link": "/certificates/IRIS/Sertifikat-IRIS.pdf"
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
    "image": "/certificates/_thumbnails/cert-cpent-ai.png",
    "link": "/certificates/The Future of Penetration Testing with CPENT AI/The Future of Penetration Testing with CPENT AI.pdf"
  }
]

