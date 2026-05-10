import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'
import { Section, SectionHeading } from '@/components/shared'
import { StaggerContainer } from '@/components/animations'
import { CertificateCard } from '@/components/ui'
import { AmbientGlow } from '@/components/effects'
import { CERTIFICATES_DATA } from '@/lib/constants'

/**
 * Premium cinematic Certificates / Achievements Section.
 * Features a modern gallery grid layout with an expandable "View All" system.
 */
export const CertificatesSection = memo(function CertificatesSection() {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const initialCertificates = CERTIFICATES_DATA.slice(0, 4)
  const remainingCertificates = CERTIFICATES_DATA.slice(4)

  return (
    <Section id="certificates" className="relative overflow-hidden">
      {/* Background Lighting */}
      <AmbientGlow variant="primary" className="left-[-5%] top-[10%] opacity-20" />
      <AmbientGlow variant="accent" className="right-[-10%] top-[80%] opacity-15" />

      <SectionHeading
        label="Certificates"
        title="Learning Journey & Certifications"
        description="Continuous learning through courses, certifications, and practical exploration across technology, development, design, and modern digital experiences."
      />

      <div className="section-container relative z-10 mt-16 w-full">
        {/* INITIAL VISIBLE GRID */}
        <StaggerContainer
          delay={0.2}
          staggerDelay={0.15}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:gap-8"
        >
          {initialCertificates.map((cert) => (
            <motion.div
              key={cert.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              style={{ willChange: 'opacity, transform' }}
            >
              <CertificateCard certificate={cert} />
            </motion.div>
          ))}
        </StaggerContainer>

        {/* EXPANDABLE GRID */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:gap-8 xl:mt-8">
                {remainingCertificates.map((cert, idx) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <CertificateCard certificate={cert} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EXPAND TOGGLE BUTTON */}
        {remainingCertificates.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 flex justify-center"
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="group flex items-center gap-2 rounded-full border border-border/50 bg-surface/50 px-6 py-3 text-sm font-medium tracking-wide text-foreground-muted backdrop-blur-md transition-all duration-300 hover:border-accent/50 hover:text-foreground hover:shadow-glow sm:px-8 sm:py-4 sm:text-base"
            >
              {isExpanded ? 'Show Less' : 'View All Certificates'}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <FiChevronDown className="h-5 w-5 text-accent" />
              </motion.div>
            </button>
          </motion.div>
        )}
      </div>
    </Section>
  )
})
