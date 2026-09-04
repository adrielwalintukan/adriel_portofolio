import { memo, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Terminal, Sparkles } from 'lucide-react'

interface HeroCodingAnimationProps {
  className?: string
}

/**
 * Premium cinematic animated developer scene for the Hero section.
 * Features a high-energy chibi anime developer coding with glowing magic syntax,
 * interactive 3D parallax tilt, ambient cyber orbits, and live status badge.
 */
export const HeroCodingAnimation = memo(function HeroCodingAnimation({
  className = '',
}: HeroCodingAnimationProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // 3D Parallax Tilt on Mouse Move
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 150 }
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    mouseX.set(clientX / width - 0.5)
    mouseY.set(clientY / height - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ perspective: 1200 }}
    >
      {/* Ambient Rotating Cyber Orbits */}
      <div className="pointer-events-none absolute -inset-10 flex items-center justify-center">
        {/* Outer orbital ring */}
        <div className="absolute h-[380px] w-[380px] sm:h-[460px] sm:w-[460px] lg:h-[540px] lg:w-[540px] rounded-full border border-dashed border-accent/20 animate-[spin_40s_linear_infinite]" />
        
        {/* Inner reverse orbital ring */}
        <div className="absolute h-[320px] w-[320px] sm:h-[390px] sm:w-[390px] lg:h-[460px] lg:w-[460px] rounded-full border border-dotted border-neon-cyan/25 animate-[spin_25s_linear_infinite_reverse]" />

        {/* Atmospheric Glow Pods */}
        <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-neon-cyan/20 blur-3xl" />
      </div>

      {/* Main Glassmorphic Terminal Window with 3D Tilt */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative z-10 w-full max-w-[420px] sm:max-w-[460px] overflow-hidden rounded-3xl border border-white/15 bg-surface/70 shadow-2xl backdrop-blur-2xl transition-shadow duration-500 hover:border-accent/50 hover:shadow-[0_0_50px_rgba(139,92,246,0.3)]"
      >
        {/* Window Title Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-background/60 px-4 py-3 backdrop-blur-md">
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block shadow-sm" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block shadow-sm" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block shadow-sm" />
          </div>

          {/* Terminal Tab Title */}
          <div className="flex items-center gap-1.5 font-mono text-xs text-foreground-muted">
            <Terminal className="h-3.5 w-3.5 text-accent" />
            <span>~/adriel/workspace</span>
            <span className="text-accent">/</span>
            <span className="text-foreground">code_magic.sh</span>
          </div>

          {/* Clean Status Indicator */}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span>DEV</span>
          </div>
        </div>

        {/* Animated Coding Character Stage */}
        <div className="relative aspect-square w-full overflow-hidden bg-background/90 p-3 sm:p-4 flex items-center justify-center">
          <img
            src="/images/coder_chibi.gif"
            alt="Adriel - Chibi Anime Developer"
            draggable={false}
            className="h-full w-full object-contain rounded-2xl shadow-inner select-none"
          />

          {/* Bottom Gradient Overlay for Cinematic Integration */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

          {/* Floating Chip: Active Status */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-background/80 px-3 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] tracking-wider uppercase">
              Code Magic: Active
            </span>
          </div>
        </div>

        {/* Terminal Footer Bar */}
        <div className="flex items-center justify-between border-t border-white/10 bg-background/70 px-4 py-2.5 font-mono text-[11px] text-foreground-muted backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
            <span>npm run dev: live</span>
          </div>
          <span className="text-accent font-semibold">UTF-8 &bull; TSX</span>
        </div>
      </motion.div>
    </div>
  )
})
