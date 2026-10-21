import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const INTRO = 'ADRIEL'
const HOLD_MS = 1000 // from navigation start; letters finish revealing ~0.8s after first paint
const EXIT_MS = 450

function shouldSkipIntro(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Intro screen: "ADRIEL" slides up letter by letter, then the screen wipes upward.
 * The letters are a CSS animation so they play from the prerendered HTML, before JS loads;
 * the wipe starts once the app has hydrated and the letters have had time to land.
 * Plays on every page load; skipped for reduced motion.
 */
export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [skip] = useState(shouldSkipIntro)
  const [isLoaded, setIsLoaded] = useState(skip)

  useEffect(() => {
    function finish() {
      document.body.style.overflow = ''
      window.__APP_READY__ = true
      window.dispatchEvent(new CustomEvent('app-ready'))
      onComplete()
    }

    if (skip) {
      finish()
      return
    }

    document.body.style.overflow = 'hidden'
    let exitTimer: ReturnType<typeof setTimeout>
    // on a slow connection hydration already took longer than the reveal: wipe right away
    const holdTimer = setTimeout(() => {
      setIsLoaded(true)
      exitTimer = setTimeout(finish, EXIT_MS)
    }, Math.max(0, HOLD_MS - performance.now()))

    return () => {
      clearTimeout(holdTimer)
      clearTimeout(exitTimer)
      document.body.style.overflow = ''
    }
  }, [skip, onComplete])

  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          key="loading-screen"
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: EXIT_MS / 1000, ease: [0.87, 0, 0.13, 1] }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-ink motion-reduce:hidden"
        >
          <span
            aria-label={INTRO}
            className="flex overflow-hidden font-display text-6xl font-black uppercase leading-none text-paper sm:text-8xl"
          >
            {INTRO.split('').map((c, i) => (
              <span key={i} aria-hidden="true" className="intro-letter" style={{ animationDelay: `${i * 0.04}s` }}>
                {c}
              </span>
            ))}
          </span>
          <span className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.3em] text-foreground-subtle">
            Portfolio &copy; {new Date().getFullYear()}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
