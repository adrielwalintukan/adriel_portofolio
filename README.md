# 🚀 Adriel Walintukan — Personal Portfolio

A modern, interactive personal portfolio website built with **React 19**, **Vite 8**, **TypeScript**, and **Tailwind CSS v4**. Features smooth animations, 3D elements, particle effects, and a responsive design.

---

## ✨ Features

- **Hero Section** — Eye-catching landing section with 3D scene (React Three Fiber) and animated text reveals
- **About Section** — Personal introduction and background
- **Skills Section** — Technical skills showcase with categorized skill bars
- **Projects Section** — Portfolio of web, mobile, fullstack, and AI projects with screenshots
- **Experience Section** — Professional experience timeline
- **Certificates Section** — Certifications and achievements
- **Contact Section** — Get-in-touch form and social links
- **Smooth Scrolling** — Powered by Lenis for buttery-smooth scroll experience
- **Particle Effects** — Ambient particle field using tsparticles
- **Custom Cursor** — Interactive custom cursor effect
- **GSAP Animations** — Advanced scroll-triggered and reveal animations
- **Magnetic Buttons** — Interactive magnetic hover effects
- **Gradient Orbs** — Ambient background glow effects
- **Fully Responsive** — Mobile-first design that works on all screen sizes
- **Dark Theme** — Sleek dark UI with neon accent colors

---

## 🛠️ Tech Stack

| Category       | Technology                                      |
| -------------- | ----------------------------------------------- |
| **Framework**  | React 19, Vite 8                                |
| **Language**   | TypeScript 6                                    |
| **Styling**    | Tailwind CSS v4, tailwindcss-animate           |
| **3D**         | Three.js, React Three Fiber, React Three Drei  |
| **Animation**  | Framer Motion, GSAP                             |
| **Scrolling**  | Lenis (smooth scroll)                           |
| **Particles**  | tsparticles                                     |
| **Icons**      | Lucide React, React Icons                       |
| **Routing**    | React Router DOM v7                             |
| **Utilities**  | clsx, tailwind-merge, react-parallax-tilt       |
| **Linting**    | ESLint, Prettier                                 |

---

## 📁 Project Structure

```
portofolio_adriel/
├── public/
│   ├── images/              # Profile images
│   ├── projects/            # Project screenshots (organized by project)
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/              # Static assets (hero image, etc.)
│   ├── components/
│   │   ├── 3d/              # Three.js 3D scene components
│   │   ├── animations/      # Animation components (Reveal, TextReveal, etc.)
│   │   ├── effects/         # Visual effects (particles, cursor, glow, etc.)
│   │   ├── sections/        # Page sections (Hero, About, Skills, etc.)
│   │   ├── shared/          # Shared components (Navbar, Footer, Layout)
│   │   └── ui/              # Reusable UI primitives
│   ├── data/                # Portfolio data and content
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities, constants, animation configs
│   ├── pages/               # Page components
│   ├── styles/              # Global CSS styles
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Root application component
│   └── main.tsx             # Application entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── eslint.config.js         # ESLint configuration
├── .prettierrc              # Prettier configuration
└── package.json             # Dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** — v18 or higher ([Download](https://nodejs.org/))
- **npm** — v9 or higher (comes with Node.js)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/adrielwalintukan/portofolio_adriel.git
   cd portofolio_adriel
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will open automatically at [http://localhost:5173](http://localhost:5173).

### Build for Production

```bash
npm run build
```

The production-ready files will be output to the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

### Lint the Code

```bash
npm run lint
```

---

## 📜 Available Scripts

| Script           | Command         | Description                              |
| ---------------- | --------------- | ---------------------------------------- |
| **dev**          | `vite`          | Start development server on port 5173    |
| **build**        | `tsc -b && vite build` | Type-check and build for production |
| **lint**         | `eslint .`      | Run ESLint on all source files           |
| **preview**      | `vite preview`  | Preview the production build locally     |

---

## 🎨 Customization

### Update Portfolio Data

Edit `src/data/index.ts` to update your personal information, social links, and site metadata:

```ts
export const siteData = {
  name: 'Your Name',
  role: 'Your Role',
  tagline: 'Your tagline here.',
  email: 'your@email.com',
}
```

### Add Projects

Add your project screenshots to `public/projects/<project_name>/` and configure project data in the data layer.

### Modify Theme Colors

Update Tailwind CSS custom theme values in `src/styles/globals.css`.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Adriel Walintukan** — Full-Stack Developer

---

Built with ❤️ using React, Three.js, and Tailwind CSS.
