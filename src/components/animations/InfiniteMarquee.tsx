import { useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'

interface InfiniteMarqueeProps {
  children: ReactNode
  direction?: 'left' | 'right'
  speed?: number
  pauseOnHover?: boolean
  className?: string
}

/**
 * Wraps a value seamlessly between a min and max range.
 */
const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

/**
 * Premium Infinite Marquee component.
 * Uses Framer Motion for smooth GPU-accelerated continuous scrolling.
 * Supports manual dragging/swiping.
 */
export const InfiniteMarquee = ({
  children,
  direction = 'left',
  speed = 25, // pixels per second
  pauseOnHover = true,
  className,
}: InfiniteMarqueeProps) => {
  const baseX = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Track extra velocity from dragging for momentum
  const dragVelocity = useMotionValue(0)

  // Measure the width of a single block of children
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      setContentWidth(width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const dirMultiplier = direction === 'left' ? -1 : 1

  useAnimationFrame((_, delta) => {
    if (contentWidth === 0) return

    let moveBy = 0
    const currentV = dragVelocity.get()

    // Smoothly decay drag velocity (momentum friction)
    if (Math.abs(currentV) > 0.5) {
      dragVelocity.set(currentV * 0.94) // 0.94 is a tuned friction coefficient
    } else {
      dragVelocity.set(0)
    }

    if (isDragging) {
      // Direct drag handled by onPan
      return
    }

    if (currentV !== 0) {
      // Apply momentum if it exists
      moveBy = currentV * (delta / 16)
    } else if (!isHovered || !pauseOnHover) {
      // Fallback to auto-scroll
      moveBy = dirMultiplier * speed * (delta / 1000)
    }

    baseX.set(baseX.get() + moveBy)
  })

  // Transform baseX to a seamlessly wrapping x coordinate
  const x = useTransform(baseX, (v) => {
    if (contentWidth === 0) return '0px'
    // Always wrap between -contentWidth and 0
    // This allows endless scrolling in both directions
    const wrapped = wrap(-contentWidth, 0, v)
    return `${wrapped}px`
  })

  // Drag handling
  const handlePanStart = () => {
    setIsDragging(true)
    dragVelocity.set(0)
  }
  
  const handlePan = (_e: PointerEvent | TouchEvent | MouseEvent, info: PanInfo) => {
    baseX.set(baseX.get() + info.delta.x)
  }
  
  const handlePanEnd = (_e: PointerEvent | TouchEvent | MouseEvent, info: PanInfo) => {
    setIsDragging(false)
    // Scale velocity down slightly to feel cinematic and not too fast
    dragVelocity.set(info.velocity.x * 0.08)
  }

  // Handle trackpad or mouse wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaX !== 0) {
      // Temporarily halt auto-scroll by setting a tiny velocity that overrides it
      // or just apply deltaX directly to baseX
      baseX.set(baseX.get() - e.deltaX)
      // Optional: add small momentum to match wheel feel
      dragVelocity.set(-e.deltaX * 5)
    }
  }

  return (
    <div
      className={cn("overflow-hidden flex w-full", className)}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onWheel={handleWheel}
      style={{ touchAction: 'pan-y' }} // Allow native vertical scroll while panning horizontally
    >
      <motion.div
        className="flex cursor-grab active:cursor-grabbing"
        style={{ x }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
      >
        {/* Render 4 duplicates to guarantee filling ultra-wide screens */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            ref={i === 0 ? containerRef : null}
            className="flex shrink-0 items-center gap-6 sm:gap-8 pr-6 sm:pr-8"
          >
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
