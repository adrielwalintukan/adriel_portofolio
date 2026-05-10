import { memo } from 'react'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/animations'
import { RootLayout } from '@/components/shared/RootLayout'
import { GradientOrb } from '@/components/effects'
import { HeroSection, ProjectsSection, AboutSection, ExperienceSection, ContactSection, SkillsSection, CertificatesSection } from '@/components/sections'

/**
 * Home page — the main portfolio landing page.
 * Optimized: removed filter blur animation, responsive sizing,
 * GPU-accelerated transforms only.
 */
function HomePage() {
  return (
    <RootLayout>
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Ambient background orbs — static CSS, responsive sizing */}
        <GradientOrb
          className="left-1/4 top-0"
          color="bg-accent/8"
          size="w-64 h-64 sm:w-80 sm:h-80 md:w-[500px] md:h-[500px]"
        />
        <GradientOrb
          className="right-0 top-1/3"
          color="bg-neon-cyan/6"
          size="w-48 h-48 sm:w-72 sm:h-72 md:w-[400px] md:h-[400px]"
        />

        {/* ── SECTIONS ── */}
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <ExperienceSection />
        <CertificatesSection />
        <ContactSection />
      </motion.div>
    </RootLayout>
  )
}

export default memo(HomePage)
