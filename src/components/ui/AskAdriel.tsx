import { lazy, memo, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppReady } from '@/hooks'

// the terminal (and its constants) only downloads when someone opens it
const AskAdrielTerminal = lazy(() => import('./AskAdrielTerminal'))

/** Floating "Ask Adriel" launcher; opens the AI terminal. */
export const AskAdriel = memo(function AskAdriel() {
  const [open, setOpen] = useState(false)
  const ready = useAppReady()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [pastHero, setPastHero] = useState(false)

  // the hero has its own CTA in the same corner: only show the launcher once that has scrolled away
  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return setPastHero(true)
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { rootMargin: '0px 0px -85% 0px' })
    io.observe(hero)
    return () => io.disconnect()
  }, [])
  const visible = ready && pastHero && !open

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={() => setOpen(true)}
        aria-label="Ask Adriel"
        aria-haspopup="dialog"
        aria-expanded={open}
        initial={{ opacity: 0, y: 16 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-xl border border-border-hover bg-ink px-4 py-3 font-mono text-xs uppercase tracking-widest text-paper shadow-xl transition-colors hover:border-accent sm:bottom-6 sm:right-6"
        style={{ pointerEvents: visible ? 'auto' : 'none' }}
        tabIndex={visible ? 0 : -1}
      >
        <span className="text-accent" aria-hidden="true">&gt;_</span>
        {/* icon only on phones so it covers less of the page while scrolling */}
        <span className="hidden sm:inline" aria-hidden="true">Ask Adriel</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <Suspense fallback={null}>
            <AskAdrielTerminal onClose={close} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  )
})
