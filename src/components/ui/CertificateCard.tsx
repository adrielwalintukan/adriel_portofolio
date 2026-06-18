import { memo } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import type { Certificate } from '@/lib/constants'

interface CertificateCardProps {
  certificate: Certificate
}

/**
 * Premium cinematic glassmorphism card for Certificates.
 * Uses a landscape aspect ratio with content overlaid on a gradient.
 */
export const CertificateCard = memo(function CertificateCard({ certificate }: CertificateCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-surface/30 backdrop-blur-md transition-all duration-700 hover:border-accent/50 hover:shadow-glow-lg aspect-[16/10] cursor-pointer"
    >
      {/* Background Image */}
      <img
        src={certificate.image}
        alt={certificate.title}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 will-change-transform select-none"
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute inset-0 bg-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-overlay" />

      {/* Category Badge over image */}
      <div className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-background/50 px-3 py-1.5 text-[9px] sm:text-[10px] font-semibold tracking-wider text-foreground-subtle backdrop-blur-md transition-colors group-hover:border-accent/40 group-hover:text-accent uppercase">
        {certificate.category}
      </div>

      {/* Content Area at bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-4 sm:p-5 lg:p-6 transition-transform duration-500 ease-out">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-accent uppercase tracking-widest drop-shadow-sm">
            {certificate.issuer}
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm border border-white/10">
            {certificate.year}
          </span>
        </div>

        <h3 className="mb-1 sm:mb-2 font-display text-lg sm:text-xl font-bold tracking-tight text-white transition-colors group-hover:text-accent drop-shadow-md line-clamp-2">
          {certificate.title}
        </h3>

        {/* Optional Credential Link overlaying the card completely */}
        {certificate.link && (
          <a
            href={certificate.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-background/40 backdrop-blur-sm"
            aria-label={`View credential for ${certificate.title}`}
          >
            <div className="flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-5 py-2.5 sm:px-6 sm:py-3 text-[11px] sm:text-sm font-semibold text-white shadow-xl backdrop-blur-md transition-transform duration-300 hover:scale-105 hover:bg-accent hover:text-background">
              View Credential
              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </a>
        )}
      </div>
    </motion.div>
  )
})
