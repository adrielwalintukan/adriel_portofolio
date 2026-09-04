import { memo, useState } from 'react'
import { Section, SectionHeading } from '@/components/shared'
import { InfiniteMarquee } from '@/components/animations'
import { CertificateCard, CertificateModal } from '@/components/ui'
import { AmbientGlow } from '@/components/effects'
import { CERTIFICATES_DATA, type Certificate } from '@/lib/constants'

/**
 * Premium cinematic Certificates / Achievements Section.
 * Features an infinite marquee showcase with interactive modal previews
 * and direct one-click links to original PDF credentials.
 */
export const CertificatesSection = memo(function CertificatesSection() {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)

  return (
    <Section id="certificates" className="relative overflow-hidden" fullWidth={true}>
      {/* Background Lighting */}
      <AmbientGlow variant="primary" className="left-[-5%] top-[10%] opacity-20" />
      <AmbientGlow variant="accent" className="right-[-10%] top-[80%] opacity-15" />

      <div className="section-container">
        <SectionHeading
          label="Certificates"
          title="Verified Credentials & Certifications"
          description="Official certifications and credentials in Cybersecurity, Artificial Intelligence, Web Engineering, and Software Testing. Click any certificate to inspect details or open the original PDF."
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
              <CertificateCard
                certificate={cert}
                onSelectCertificate={setSelectedCertificate}
              />
            </div>
          ))}
        </InfiniteMarquee>
      </div>

      {/* Interactive Certificate Preview Modal */}
      <CertificateModal
        certificate={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
      />
    </Section>
  )
})
