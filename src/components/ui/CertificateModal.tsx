import { memo, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Award, Calendar, Tag, FileText } from 'lucide-react'
import type { Certificate } from '@/lib/constants'

interface CertificateModalProps {
  certificate: Certificate | null
  onClose: () => void
}

/**
 * Premium Certificate Preview & Details Modal.
 * Uses createPortal directly to document.body.
 */
export const CertificateModal = memo(function CertificateModal({
  certificate,
  onClose,
}: CertificateModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (certificate) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [certificate, onClose])

  if (!mounted || !certificate) return null

  const pdfUrl = certificate.pdf || certificate.link || '#'

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 sm:p-6 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-surface/95 shadow-2xl backdrop-blur-2xl"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Award className="h-4 w-4" />
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-foreground-muted">
                Certificate Details
              </span>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground-muted transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              
              {/* Left Column: Certificate Preview Image */}
              <div className="lg:col-span-7">
                <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl border border-white/10 bg-background/50 shadow-inner group">
                  <img
                    src={certificate.image}
                    alt={certificate.title}
                    className="h-full w-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-center p-4">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/90 px-4 py-2 text-xs font-semibold text-background shadow-lg backdrop-blur-md transition-transform hover:scale-105"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View High-Res Document
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Metadata & Actions */}
              <div className="flex flex-col justify-between lg:col-span-5">
                <div>
                  {/* Category Pill */}
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    <Tag className="h-3 w-3" />
                    <span>{certificate.category}</span>
                  </div>

                  {/* Title & Issuer */}
                  <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {certificate.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-accent">
                    {certificate.issuer}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Issued: {certificate.year}</span>
                  </div>

                  {/* Description */}
                  {certificate.description && (
                    <p className="mt-4 text-sm leading-relaxed text-foreground-subtle">
                      {certificate.description}
                    </p>
                  )}

                  {/* Skills / Badges */}
                  {certificate.skills && certificate.skills.length > 0 && (
                    <div className="mt-5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                        Competencies & Technologies
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {certificate.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-foreground-subtle"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action Button */}
                <div className="mt-8 pt-4 border-t border-white/10">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-background shadow-glow transition-all duration-300 hover:bg-accent-hover hover:shadow-glow-lg"
                  >
                    <span>Open Original PDF Document</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
})
