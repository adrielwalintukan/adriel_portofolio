import { memo, useState, useEffect } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  cursorClassName?: string
}

/**
 * High-performance, smooth typewriter animation with blinking caret cursor.
 * Types text character-by-character on entry for an authentic developer terminal aesthetic.
 */
export const TypewriterText = memo(function TypewriterText({
  text,
  speed = 38,
  delay = 350,
  className = '',
  cursorClassName = 'text-accent',
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    let timeoutId: number
    let intervalId: number

    timeoutId = window.setTimeout(() => {
      let currentIdx = 0
      intervalId = window.setInterval(() => {
        if (currentIdx <= text.length) {
          setDisplayedText(text.slice(0, currentIdx))
          currentIdx++
        } else {
          setIsDone(true)
          window.clearInterval(intervalId)
        }
      }, speed)
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [text, speed, delay])

  return (
    <span className={`inline ${className}`} aria-label={text}>
      <span aria-hidden="true">{displayedText}</span>
      <span
        className={`ml-1 inline-block font-mono font-bold transition-opacity duration-300 ${
          isDone ? 'animate-[pulse_1.2s_ease-in-out_infinite]' : 'opacity-100'
        } ${cursorClassName}`}
        aria-hidden="true"
      >
        |
      </span>
    </span>
  )
})
