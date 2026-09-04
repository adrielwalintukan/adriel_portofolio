import { memo, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, ArrowDown } from 'lucide-react'
import { FiMessageSquare, FiMail, FiLinkedin, FiInstagram } from 'react-icons/fi'

interface QuickContactModalProps {
  isOpen: boolean
  onClose: () => void
}

const contactChannels = [
  {
    id: 'whatsapp',
    title: 'WhatsApp (Instant Chat)',
    subtitle: '+62 851-7975-9298',
    description: 'Fastest response for project inquiries & discussions',
    href: 'https://wa.me/6285179759298?text=Halo%20Adriel,%20saya%20melihat%20portofolio%20Anda%20dan%20tertarik%20untuk%20berdiskusi.',
    icon: FiMessageSquare,
    accentColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/20',
    buttonText: 'Chat on WhatsApp',
  },
  {
    id: 'email',
    title: 'Direct Email',
    subtitle: 'adrielwalintukan27@gmail.com',
    description: 'Best for formal proposals, collaborations & long-form briefs',
    href: 'mailto:adrielwalintukan27@gmail.com',
    icon: FiMail,
    accentColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/20',
    buttonText: 'Send Email',
  },
  {
    id: 'linkedin',
    title: 'LinkedIn Network',
    subtitle: 'Adriel Walintukan',
    description: 'Professional background, endorsements & networking',
    href: 'https://www.linkedin.com/in/adriel-walintukan-56ba48259/',
    icon: FiLinkedin,
    accentColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/20',
    buttonText: 'Connect on LinkedIn',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    subtitle: '@walintukann.adriel',
    description: 'Direct messaging & everyday updates',
    href: 'https://www.instagram.com/walintukann.adriel/',
    icon: FiInstagram,
    accentColor: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/30 hover:border-pink-500/60 hover:bg-pink-500/20',
    buttonText: 'Open Instagram',
  },
]

/**
 * Quick Contact Modal (Let's Talk).
 * Rendered using createPortal to document.body at z-[9999]
 * to prevent any CSS stacking context, clipping, or scroll bugs.
 */
export const QuickContactModal = memo(function QuickContactModal({
  isOpen,
  onClose,
}: QuickContactModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close modal on Escape key & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop Blur & Dimmer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-surface/95 p-5 shadow-2xl backdrop-blur-2xl sm:p-6 select-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-neon-cyan/20 blur-3xl" />

            {/* Header */}
            <div className="relative mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
                  </span>
                  Available for Collaboration
                </div>
                <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Let&apos;s Connect
                </h3>
                <p className="mt-1 text-sm text-foreground-muted">
                  Choose your preferred channel to start a conversation with Adriel.
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground-muted transition-colors hover:border-white/20 hover:bg-white/10 hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Communication Channels List */}
            <div className="relative flex flex-col gap-2.5">
              {contactChannels.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className={`group relative flex items-center justify-between gap-3 rounded-2xl border p-3 sm:p-3.5 transition-all duration-300 ${item.bgColor}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-background/50 ${item.accentColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm font-bold text-foreground sm:text-base">
                            {item.title}
                          </h4>
                        </div>
                        <p className={`font-mono text-xs font-semibold ${item.accentColor}`}>
                          {item.subtitle}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-muted hidden sm:block">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground transition-transform duration-300 group-hover:scale-105 group-hover:border-accent/40 group-hover:bg-accent group-hover:text-background">
                      <span>{item.buttonText}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </a>
                )
              })}
            </div>

            {/* Bottom Form Redirection */}
            <div className="relative mt-4 border-t border-white/10 pt-3 text-center">
              <a
                href="#contact"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted transition-colors hover:text-accent"
              >
                <span>Prefer a message form? Send inquiry below</span>
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
})
