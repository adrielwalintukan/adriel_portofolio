import { memo } from 'react'
import { Section, SectionHeading } from '@/components/shared'
import { InfiniteMarquee } from '@/components/animations'
import { CertificateCard } from '@/components/ui'
import { AmbientGlow } from '@/components/effects'
import { CERTIFICATES_DATA } from '@/lib/constants'

/**
 * Premium cinematic Certificates / Achievements Section.
 * Features a modern gallery grid layout with an expandable "View All" system.
 */
export const CertificatesSection = memo(function CertificatesSection() {
  return (
    <Section id="certificates" className="relative overflow-hidden" fullWidth={true}>
      {/* Background Lighting */}
      <AmbientGlow variant="primary" className="left-[-5%] top-[10%] opacity-20" />
      <AmbientGlow variant="accent" className="right-[-10%] top-[80%] opacity-15" />

      <div className="section-container">
        <SectionHeading
          label="Certificates"
          title="Learning Journey & Certifications"
          description="Continuous learning through courses, certifications, and practical exploration across technology, development, design, and modern digital experiences."
        />
      </div>

      {/* INFINITE MARQUEE SHOWCASE */}
      <div className="mt-8 sm:mt-12 w-full overflow-hidden">
        <InfiniteMarquee direction="right" speed={25} pauseOnHover={true}>
          {CERTIFICATES_DATA.map((cert) => (
            <div
              key={cert.id}
              className="shrink-0 w-[85vw] sm:w-[45vw] md:w-[35vw] lg:w-[28vw]"
            >
              <CertificateCard certificate={cert} />
            </div>
          ))}
        </InfiniteMarquee>
      </div>
    </Section>
  )
})
