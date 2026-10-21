import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TextReveal } from '@/components/animations'

const SESSION_KEY = 'aw-intro-seen'
const HOLD_MS = 800 // letters finish revealing at ~0.8s
const EXIT_MS = 450

function shouldSkipIntro(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Intro screen: "ADRIEL" slides up letter by letter, then the screen wipes upward.
 * Shown once per browser session (PRD §6.0); skipped for reduced motion.
 */
export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [skip] = useState(shouldSkipIntro)
  const [isLoaded, setIsLoaded] = useState(skip)

  useEffect(() => {
    function finish() {
      document.body.style.overflow = ''
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        // storage blocked (private mode) — intro just plays again next visit
      }
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
    const holdTimer = setTimeout(() => {
      setIsLoaded(true)
      exitTimer = setTimeout(finish, EXIT_MS)
    }, HOLD_MS)

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
          className="fixed inset-0 z-[999] flex items-center justify-center bg-ink"
        >
          <TextReveal
            text="ADRIEL"
            by="char"
            staggerDelay={0.04}
            className="font-display text-6xl font-black uppercase leading-none text-paper sm:text-8xl"
          />
          <span className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.3em] text-foreground-subtle">
            Portfolio &copy; {new Date().getFullYear()}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
