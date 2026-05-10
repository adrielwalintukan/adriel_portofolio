import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Premium cinematic loading screen that displays before the website reveals itself.
 */
export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Lock scroll while loading
    document.body.style.overflow = 'hidden'

    // Simulate loading progress
    const duration = 2000 // 2 seconds total loading time
    const intervalTime = 20
    const steps = duration / intervalTime

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      setProgress(Math.min((currentStep / steps) * 100, 100))

      if (currentStep >= steps) {
        clearInterval(interval)
        setIsLoaded(true)
        
        // Wait for exit animation to finish before signaling completion
        setTimeout(() => {
          document.body.style.overflow = ''
          onComplete()
        }, 800) // matches the exit duration
      }
    }, intervalTime)

    return () => {
      clearInterval(interval)
      document.body.style.overflow = ''
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background"
        >
          {/* Ambient Glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[50vh] w-[50vw] rounded-full bg-accent/5 blur-[100px]" />

          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo Reveal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="font-display text-4xl font-black tracking-tighter text-foreground sm:text-5xl"
            >
              AW<span className="text-accent">.</span>
            </motion.div>

            {/* Loading Status */}
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="font-mono text-xs tracking-[0.2em] text-foreground-muted uppercase"
              >
                Initializing Experience
              </motion.div>

              {/* Progress Bar Container */}
              <div className="relative h-px w-48 overflow-hidden bg-border sm:w-64">
                {/* Actual Progress */}
                <motion.div
                  className="absolute left-0 top-0 h-full bg-accent shadow-[0_0_10px_rgba(0,255,255,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
