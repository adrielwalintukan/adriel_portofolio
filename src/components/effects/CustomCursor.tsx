import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useDeviceDetect } from '@/hooks'

/**
 * Premium custom cursor with smooth trailing and hover state detection.
 * Disabled automatically on touch devices to preserve performance.
 */
export function CustomCursor() {
  const { isTouchDevice } = useDeviceDetect()
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Track mouse position directly via motion values to bypass React state for 60fps
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  // Apply smooth spring physics to the trailing circle
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)

  useEffect(() => {
    if (isTouchDevice) return

    // Show cursor on initial mouse move
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true)
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    // Hide cursor when leaving window
    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    // Detect hover on interactive elements
    const handleInteractableEnter = () => setIsHovering(true)
    const handleInteractableLeave = () => setIsHovering(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', handleMouseLeave)
    window.addEventListener('mouseover', handleMouseEnter)

    // Attach listeners to interactive elements
    const updateInteractables = () => {
      const interactables = document.querySelectorAll('a, button, input, textarea, [role="button"]')
      interactables.forEach((el) => {
        el.addEventListener('mouseenter', handleInteractableEnter)
        el.addEventListener('mouseleave', handleInteractableLeave)
      })
    }

    updateInteractables()
    
    // Setup an observer to attach listeners to newly added elements
    const observer = new MutationObserver(() => {
      updateInteractables()
    })
    
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseLeave)
      window.removeEventListener('mouseover', handleMouseEnter)
      observer.disconnect()
      const interactables = document.querySelectorAll('a, button, input, textarea, [role="button"]')
      interactables.forEach((el) => {
        el.removeEventListener('mouseenter', handleInteractableEnter)
        el.removeEventListener('mouseleave', handleInteractableLeave)
      })
    }
  }, [isTouchDevice, isVisible, mouseX, mouseY])

  // Don't render anything on mobile/touch devices
  if (isTouchDevice) return null

  return (
    <>
      {/* Tiny solid dot exactly on the cursor */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent mix-blend-screen"
        style={{
          x: mouseX,
          y: mouseY,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.15 }}
      />
      
      {/* Larger trailing ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent mix-blend-screen shadow-[0_0_10px_rgba(0,255,255,0.3)]"
        style={{
          x: cursorX,
          y: cursorY,
          opacity: isVisible ? 1 : 0,
        }}
        animate={{
          width: isHovering ? 48 : 24,
          height: isHovering ? 48 : 24,
          backgroundColor: isHovering ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 255, 255, 0)',
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.2 }}
      />
    </>
  )
}
