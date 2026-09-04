import { useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/lib/constants'
import { Magnetic } from '@/components/animations'
import { Button, QuickContactModal } from '@/components/ui'
import { useDeviceDetect } from '@/hooks'

/**
 * Premium navbar — performance optimized:
 * - Magnetic disabled on touch devices
 * - Simplified mobile overlay (no clip-path animation)
 * - Passive scroll listener
 * - Memoized
 */
export const Navbar = memo(function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const { isTouchDevice } = useDeviceDetect()

  useEffect(() => {
    let ticking = false
    function handleScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50)
          
          // Simple active section detection
          const sections = NAV_LINKS.map(link => link.href.substring(1))
          const current = sections.find(section => {
            const el = document.getElementById(section)
            if (el) {
              const rect = el.getBoundingClientRect()
              return rect.top <= 100 && rect.bottom >= 100
            }
            return false
          })
          if (current) setActiveSection(current)
          
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Initial check
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const closeMenu = useCallback(() => setIsOpen(false), [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled ? 'glass-strong shadow-glow-lg border-b border-border/50' : 'bg-transparent border-b border-transparent'
      )}
    >
      <nav className="section-container flex h-16 items-center justify-between sm:h-18 md:h-20">
        {/* Logo */}
        <Magnetic strength={0.12} disabled={isTouchDevice}>
          <a
            href="#hero"
            className="relative font-display text-2xl font-black tracking-tighter text-foreground sm:text-3xl"
            onClick={closeMenu}
          >
            AW<span className="text-accent">.</span>
          </a>
        </Magnetic>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.substring(1)
            return (
              <Magnetic key={link.href} strength={0.08} disabled={isTouchDevice}>
                <a
                  href={link.href}
                  className={cn(
                    "group relative px-4 py-2 text-sm font-medium transition-colors hover:text-foreground",
                    isActive ? "text-foreground" : "text-foreground-muted"
                  )}
                >
                  {link.label}
                  {/* Subtle active indicator dot */}
                  <span 
                    className={cn(
                      "absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent transition-all duration-300",
                      isActive ? "opacity-100 scale-100 shadow-glow" : "opacity-0 scale-0 group-hover:opacity-50 group-hover:scale-100"
                    )} 
                  />
                </a>
              </Magnetic>
            )
          })}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Button
            onClick={() => setIsContactOpen(true)}
            variant="secondary"
            size="sm"
            className="px-6 py-2 h-10"
          >
            Let&apos;s Talk
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-50 p-2 md:hidden"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isOpen ? "close" : "open"}
              initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </motion.div>
          </AnimatePresence>
        </button>
      </nav>

      {/* Mobile Menu Overlay — simple opacity transition (no clip-path for perf) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-background/80 backdrop-blur-xl md:hidden"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-2xl font-bold tracking-tight text-foreground transition-colors active:text-accent sm:text-3xl"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="pt-2"
            >
              <Button
                onClick={() => {
                  closeMenu()
                  setIsContactOpen(true)
                }}
                variant="primary"
                size="md"
                className="px-8"
              >
                Let&apos;s Talk
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Contact Modal (Let's Talk) */}
      <QuickContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </header>
  )
})
