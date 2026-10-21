import { memo } from 'react'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/animations'
import { RootLayout } from '@/components/shared/RootLayout'
import { HeroSection, ProjectsSection, AboutSection, ExperienceSection, ContactSection, SkillsSection, CertificatesSection, HowIWorkSection, NumbersSection } from '@/components/sections'

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
        {/* ── SECTIONS ── */}
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <HowIWorkSection />
        <NumbersSection />
        <ExperienceSection />
        <CertificatesSection />
        <ContactSection />
      </motion.div>
    </RootLayout>
  )
}

export default memo(HomePage)
