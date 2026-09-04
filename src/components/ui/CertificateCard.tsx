import { memo } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, FileText, Award } from 'lucide-react'
import type { Certificate } from '@/lib/constants'

interface CertificateCardProps {
  certificate: Certificate
  onSelectCertificate?: (cert: Certificate) => void
}

/**
 * Premium cinematic glassmorphism card for Certificates.
 * Uses a landscape aspect ratio with content overlaid on a gradient,
 * interactive hover effects, and direct access to original PDF documents.
 */
export const CertificateCard = memo(function CertificateCard({
  certificate,
  onSelectCertificate,
}: CertificateCardProps) {
  const pdfUrl = certificate.pdf || certificate.link || '#'

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      onClick={() => onSelectCertificate?.(certificate)}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/40 backdrop-blur-md transition-all duration-500 hover:border-accent/60 hover:shadow-glow-lg aspect-[16/10] cursor-pointer"
    >
      {/* Background Image Preview */}
      <img
        src={certificate.image}
        alt={certificate.title}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform select-none"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-95" />
      <div className="absolute inset-0 bg-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-overlay" />

      {/* Category Badge over image */}
      <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-background/60 px-3 py-1 text-[10px] font-semibold tracking-wider text-foreground-subtle backdrop-blur-md transition-colors group-hover:border-accent/40 group-hover:text-accent uppercase">
        <Award className="h-3 w-3 text-accent" />
        <span>{certificate.category}</span>
      </div>

      {/* Quick Action PDF Icon in top right */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-background/60 text-foreground-muted backdrop-blur-md transition-all hover:scale-110 hover:border-accent/50 hover:bg-accent hover:text-background"
          aria-label={`Direct open PDF for ${certificate.title}`}
          title="Open PDF Document"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Content Area at bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-4 sm:p-5 lg:p-6 transition-transform duration-500 ease-out">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-accent uppercase tracking-widest drop-shadow-sm">
            {certificate.issuer}
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm border border-white/10">
            {certificate.year}
          </span>
        </div>

        <h3 className="mb-2 font-display text-base sm:text-lg font-bold tracking-tight text-white transition-colors group-hover:text-accent drop-shadow-md line-clamp-2">
          {certificate.title}
        </h3>

        {/* Floating action indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted transition-colors group-hover:text-white">
          <FileText className="h-3.5 w-3.5 text-accent" />
          <span>Click to view details &amp; PDF</span>
        </div>
      </div>
    </motion.div>
  )
})
