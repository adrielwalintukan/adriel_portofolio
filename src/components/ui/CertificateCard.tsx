import { memo } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import type { Certificate } from '@/lib/constants'

interface CertificateCardProps {
  certificate: Certificate
}

/**
 * Premium glassmorphism card for Certificates and Achievements.
 * Features a hover zoom image effect and smooth elevation.
 */
export const CertificateCard = memo(function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-surface/30 backdrop-blur-md transition-all duration-700 hover:-translate-y-2 hover:border-accent/60 hover:bg-surface/60 hover:shadow-glow-lg"
    >
      {/* Image Thumbnail Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-background">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-surface/80 to-transparent" />
        <img
          src={certificate.image}
          alt={certificate.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
        />
        
        {/* Category Badge over image */}
        <div className="absolute left-4 top-4 z-20 rounded-full border border-border/50 bg-background/50 px-3 py-1 text-xs font-semibold tracking-wider text-foreground-subtle backdrop-blur-md transition-colors group-hover:border-accent/50 group-hover:text-accent">
          {certificate.category}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-accent">
            {certificate.issuer}
          </span>
          <span className="font-mono text-xs font-bold text-foreground-muted">
            {certificate.year}
          </span>
        </div>

        <h3 className="mb-4 font-display text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-2xl">
          {certificate.title}
        </h3>

        {/* Optional Credential Link overlaying the card completely */}
        {certificate.link && (
          <a
            href={certificate.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-label={`View credential for ${certificate.title}`}
          >
            <div className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-background shadow-lg transition-transform duration-300 hover:scale-105">
              View Credential
              <ExternalLink className="h-4 w-4" />
            </div>
          </a>
        )}
      </div>
    </motion.div>
  )
})
