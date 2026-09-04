import { memo, useState, useEffect, useRef } from 'react'

interface TypewriterTextProps {
  text: string | string[]
  speed?: number
  deleteSpeed?: number
  pauseDelay?: number
  startDelay?: number
  delay?: number
  loop?: boolean
  className?: string
  cursorClassName?: string
}

/**
 * Continuous, smooth, accessible Typewriter animation with blinking caret.
 * Waits for the loading screen to finish before starting, and continuously
 * loops (type -> pause -> delete -> pause -> type) so it is always active.
 */
export const TypewriterText = memo(function TypewriterText({
  text,
  speed = 42,
  deleteSpeed = 22,
  pauseDelay = 3000,
  startDelay = 200, delay,
  loop = true,
  className = '',
  cursorClassName = 'text-accent',
}: TypewriterTextProps) {
  const texts = Array.isArray(text) ? text : [text]
  const effectiveStartDelay = delay ?? startDelay
  const [currentTextIdx, setCurrentTextIdx] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Track app ready status to ensure animation starts in sync with page visibility
  useEffect(() => {
    let startTimer: number

    const triggerStart = () => {
      startTimer = window.setTimeout(() => {
        setIsReady(true)
      }, effectiveStartDelay)
    }

    if (typeof window !== 'undefined' && (window as unknown as { __APP_READY__?: boolean }).__APP_READY__) {
      triggerStart()
    } else {
      const handler = () => triggerStart()
      window.addEventListener('app-ready', handler, { once: true })
      // Fallback: If loading screen completes without event or after 2.8s
      const fallbackTimer = window.setTimeout(triggerStart, 2800 + effectiveStartDelay)

      return () => {
        window.removeEventListener('app-ready', handler)
        window.clearTimeout(fallbackTimer)
        window.clearTimeout(startTimer)
      }
    }

    return () => {
      window.clearTimeout(startTimer)
    }
  }, [effectiveStartDelay])

  const targetText = texts[currentTextIdx % texts.length]
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isReady) return

    if (!isDeleting) {
      // TYPING FORWARD
      if (displayedText.length < targetText.length) {
        timerRef.current = window.setTimeout(() => {
          setDisplayedText(targetText.slice(0, displayedText.length + 1))
        }, speed)
      } else {
        // FINISHED TYPING
        if (loop) {
          timerRef.current = window.setTimeout(() => {
            setIsDeleting(true)
          }, pauseDelay)
        }
      }
    } else {
      // DELETING BACKWARD
      if (displayedText.length > 0) {
        timerRef.current = window.setTimeout(() => {
          setDisplayedText(targetText.slice(0, displayedText.length - 1))
        }, deleteSpeed)
      } else {
        // FINISHED DELETING
        setIsDeleting(false)
        setCurrentTextIdx((prev) => (prev + 1) % texts.length)
        timerRef.current = window.setTimeout(() => {}, 500)
      }
    }

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [isReady, displayedText, isDeleting, targetText, texts.length, speed, deleteSpeed, pauseDelay, loop])

  return (
    <span className={`inline ${className}`} aria-label={targetText}>
      <span aria-hidden="true">{displayedText}</span>
      <span
        className={`ml-1 inline-block font-mono font-bold animate-[pulse_1s_ease-in-out_infinite] ${cursorClassName}`}
        aria-hidden="true"
      >
        |
      </span>
    </span>
  )
})
