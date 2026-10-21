import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CONTACT_INFO, NAV_LINKS, SOCIAL_LINKS } from '@/lib/constants'
import { Magnetic } from '@/components/animations'
import { Button, QuickContactModal } from '@/components/ui'
import { useDeviceDetect, useLocalTime } from '@/hooks'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Minimal header (logo · location · local time · Menu) plus a fullscreen menu
 * (PRD §6.12): ESC closes it, focus is trapped inside and returned on close.
 */
export const Navbar = memo(function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [pastTop, setPastTop] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const { isTouchDevice } = useDeviceDetect()
  const time = useLocalTime(CONTACT_INFO.timeZone)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    function handleScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          setPastTop(window.scrollY > 20)

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
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = useCallback(() => setIsOpen(false), [])

  // Scroll lock, ESC to close, focus trap, focus restore
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const menuButton = menuButtonRef.current
    overlayRef.current?.querySelector<HTMLElement>('button, a')?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        return
      }
      if (e.key !== 'Tab' || !overlayRef.current) return
      const focusable = overlayRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      menuButton?.focus()
    }
  }, [isOpen])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-500',
        // paper on the photo (dark hair on mobile, red on desktop); dark glass once content scrolls under it
        pastTop ? 'bg-ink/85 text-foreground backdrop-blur-md' : 'bg-transparent text-paper [--focus-ring:var(--color-paper)]'
      )}
    >
      <nav className="section-container flex h-16 items-center justify-between sm:h-20">
        <Magnetic strength={0.12} disabled={isTouchDevice}>
          <a href="#hero" className="font-display text-2xl font-black tracking-tight sm:text-3xl">
            AW<span className={pastTop ? 'text-accent' : undefined}>.</span>
          </a>
        </Magnetic>

        <div className="hidden gap-12 font-mono text-xs uppercase leading-tight md:flex">
          <div>
            <p className="opacity-60">Based in</p>
            <p className="font-semibold">{CONTACT_INFO.city}</p>
          </div>
          <div>
            <p className="opacity-60">Local time</p>
            <p className="font-semibold tabular-nums">
              {time} {CONTACT_INFO.timeZoneLabel}
            </p>
          </div>
        </div>

        <Magnetic strength={0.15} disabled={isTouchDevice}>
          <button
            ref={menuButtonRef}
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            aria-controls="site-menu"
            className="flex h-10 items-center gap-3 rounded-lg border border-current px-4 font-display text-sm font-extrabold uppercase tracking-wide transition-colors hover:bg-paper hover:text-ink"
          >
            Menu
            <span className="flex flex-col gap-1" aria-hidden="true">
              <span className="h-px w-4 bg-current" />
              <span className="h-px w-4 bg-current" />
            </span>
          </button>
        </Magnetic>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="site-menu"
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: [0.87, 0, 0.13, 1] }}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-ink text-foreground [--focus-ring:var(--color-accent)]"
          >
            <div className="section-container flex h-16 shrink-0 items-center justify-between border-b border-border sm:h-20">
              <span className="font-display text-2xl font-black uppercase tracking-tight text-accent sm:text-3xl">
                Adriel Walintukan
              </span>
              <button
                onClick={closeMenu}
                className="h-10 rounded-lg border border-border-hover px-4 font-mono text-xs uppercase tracking-wider transition-colors hover:border-foreground"
              >
                Close [Esc]
              </button>
            </div>

            <div className="section-container grid flex-1 gap-12 py-10 md:grid-cols-2">
              <div>
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">Navigation</p>
                <ul>
                  {NAV_LINKS.map((link, i) => {
                    const isActive = activeSection === link.href.substring(1)
                    return (
                      <motion.li
                        key={link.href}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.05, duration: 0.6, ease: EASE }}
                      >
                        <a
                          href={link.href}
                          onClick={closeMenu}
                          aria-current={isActive ? 'location' : undefined}
                          className={cn(
                            'block font-display text-5xl font-black uppercase leading-[1.05] tracking-tight transition-colors hover:text-accent focus-visible:text-accent sm:text-6xl',
                            isActive ? 'text-foreground' : 'text-foreground-subtle'
                          )}
                        >
                          {link.label}
                        </a>
                      </motion.li>
                    )
                  })}
                </ul>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="flex flex-col gap-10 md:pt-8"
              >
                <div>
                  <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">Get in touch</p>
                  <a href={`mailto:${CONTACT_INFO.email}`} className="text-xl font-medium hover:text-accent sm:text-2xl">
                    {CONTACT_INFO.email}
                  </a>
                  <p className="mt-2 text-sm text-foreground-muted">{CONTACT_INFO.availability}</p>
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        closeMenu()
                        setIsContactOpen(true)
                      }}
                      variant="primary"
                    >
                      Let&apos;s talk
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">Socials</p>
                  <ul className="flex flex-wrap gap-x-6 gap-y-2">
                    {SOCIAL_LINKS.filter((s) => s.name !== 'Email').map((s) => (
                      <li key={s.name}>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-lg hover:text-accent">
                          {s.name} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">Based in</p>
                  <p className="text-lg">{CONTACT_INFO.city}</p>
                </div>
              </motion.div>
            </div>

            <div className="section-container flex shrink-0 justify-between border-t border-border py-5 font-mono text-xs uppercase text-foreground-subtle">
              <span>&copy; {new Date().getFullYear()} Adriel Walintukan</span>
              <span className="tabular-nums">
                {time} {CONTACT_INFO.timeZoneLabel}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuickContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </header>
  )
})
