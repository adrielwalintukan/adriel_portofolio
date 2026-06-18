import { memo } from 'react'
import { motion } from 'framer-motion'
import { FiArrowUp } from 'react-icons/fi'
import { SOCIAL_LINKS } from '@/lib/constants'
import { FiGithub, FiLinkedin, FiInstagram, FiMail } from 'react-icons/fi'
import type { IconType } from 'react-icons'

// Map string icon names from constants to actual React Icons
const IconMap: Record<string, IconType> = {
  FiGithub,
  FiLinkedin,
  FiInstagram,
  FiMail,
}

/**
 * Premium cinematic Footer.
 * Features minimal branding, smooth scroll to top, and a subtle glowing top border.
 */
export const Footer = memo(function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative mt-20 overflow-hidden bg-background pt-16 pb-8">
      {/* Subtle top border glow */}
      <div className="absolute left-1/2 top-0 h-px w-full max-w-7xl -translate-x-1/2 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      <div className="absolute left-1/2 top-0 h-[2px] w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/30 to-transparent blur-sm" />

      <div className="section-container relative z-10 flex flex-col items-center justify-between gap-8 sm:flex-row">
        
        {/* Left: Branding & Copyright */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center sm:items-start"
        >
          <a href="#hero" className="mb-2 font-display text-xl font-black tracking-tighter text-foreground transition-colors hover:text-accent">
            AW<span className="text-accent">.</span>
          </a>
          <p className="text-sm font-medium text-foreground-muted">
            &copy; {currentYear} Adriel Walintukan. All rights reserved.
          </p>
        </motion.div>

        {/* Center/Right: Socials & Back to Top */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-6"
        >
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((link) => {
              const Icon = IconMap[link.icon]
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground-muted transition-colors hover:text-accent hover:-translate-y-0.5"
                  aria-label={link.name}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </a>
              )
            })}
          </div>

          <div className="h-4 w-px bg-border" />

          <button
            onClick={scrollToTop}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-surface/30 backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-surface/60 hover:shadow-glow"
            aria-label="Scroll to top"
          >
            <FiArrowUp className="h-4 w-4 text-foreground-subtle transition-transform group-hover:-translate-y-1 group-hover:text-accent" />
          </button>
        </motion.div>

      </div>
    </footer>
  )
})
