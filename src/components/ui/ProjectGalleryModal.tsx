import { memo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { type Project } from '@/lib/constants'
import { TechBadge } from './TechBadge'

interface ProjectGalleryModalProps {
  project: Project | null
  onClose: () => void
}

/**
 * Premium cinematic image gallery modal for exploring local project screenshots.
 * Features an immersive dark backdrop, smooth touch-swipe navigation, desktop arrows,
 * lazy image loading, image counters, and detailed metadata headers.
 */
export const ProjectGalleryModal = memo(function ProjectGalleryModal({
  project,
  onClose,
}: ProjectGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  // Reset index when project changes
  useEffect(() => {
    if (project) {
      setCurrentIndex(0)
    }
  }, [project])

  const images = project?.images || []
  const totalImages = images.length

  const handleNext = useCallback(() => {
    if (totalImages <= 1) return
    setDirection('right')
    setCurrentIndex((prev) => (prev + 1) % totalImages)
  }, [totalImages])

  const handlePrev = useCallback(() => {
    if (totalImages <= 1) return
    setDirection('left')
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages)
  }, [totalImages])

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!project) return

    // Lock scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [project, onClose, handleNext, handlePrev])

  if (!project) return null

  // Framer motion variants for smooth slide transitions
  const slideVariants: any = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.3 },
      },
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? -100 : 100,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    }),
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 md:p-6">
        {/* Dark Cinematic Backdrop with Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/90 backdrop-blur-xl"
        />

        {/* Ambient Glow behind Modal */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[120px] pointer-events-none" />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="glass-strong relative z-10 flex h-full max-h-[92svh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border/50 bg-surface/60 shadow-glow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Metadata Bar */}
          <div className="flex items-center justify-between border-b border-border/40 bg-surface/40 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur-md">
            <div className="flex flex-col gap-1 overflow-hidden pr-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent border border-accent/20">
                  {project.category}
                </span>
              </div>
              <h3 className="truncate font-display text-base font-bold text-foreground sm:text-xl md:text-2xl">
                {project.title}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/40 bg-surface/50 text-foreground-muted transition-all duration-300 hover:border-accent/40 hover:bg-accent/10 hover:text-accent hover:shadow-glow"
              aria-label="Close Gallery"
            >
              <FiX className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
            </button>
          </div>

          {/* Main Image Viewport with Slide & Swipe Support */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background/40 p-2 sm:p-4">
            {totalImages > 0 ? (
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag={totalImages > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    const swipeThreshold = 50
                    if (info.offset.x < -swipeThreshold) {
                      handleNext()
                    } else if (info.offset.x > swipeThreshold) {
                      handlePrev()
                    }
                  }}
                  className="relative flex h-full w-full items-center justify-center cursor-grab active:cursor-grabbing"
                >
                  <img
                    src={images[currentIndex]}
                    alt={`${project.title} screenshot ${currentIndex + 1}`}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] select-none rounded-lg"
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-sm text-foreground-muted">No images available</div>
            )}

            {/* Desktop Navigation Arrows Overlay */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border/40 bg-surface/70 p-3 text-foreground backdrop-blur-md transition-all duration-300 hover:border-accent/50 hover:bg-accent/20 hover:text-accent hover:shadow-glow sm:flex"
                  aria-label="Previous Image"
                >
                  <FiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border/40 bg-surface/70 p-3 text-foreground backdrop-blur-md transition-all duration-300 hover:border-accent/50 hover:bg-accent/20 hover:text-accent hover:shadow-glow sm:flex"
                  aria-label="Next Image"
                >
                  <FiChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Floating Image Counter Badge */}
            {totalImages > 1 && (
              <div className="absolute bottom-3 right-3 rounded-full border border-border/40 bg-surface/80 px-3 py-1 text-xs font-medium tracking-widest text-foreground backdrop-blur-md sm:bottom-4 sm:right-4">
                {currentIndex + 1} / {totalImages}
              </div>
            )}
          </div>

          {/* Bottom Project Description & Technologies */}
          <div className="flex flex-col gap-3 border-t border-border/40 bg-surface/30 p-4 sm:p-6 backdrop-blur-md overflow-y-auto max-h-[30svh]">
            <p className="text-xs leading-relaxed text-foreground-subtle sm:text-sm md:text-base">
              {project.longDescription || project.description}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:gap-2">
              {project.technologies.map((tech) => (
                <TechBadge key={tech} name={tech} />
              ))}
            </div>

            {/* Touch helper message for mobile viewports */}
            {totalImages > 1 && (
              <div className="text-center text-[11px] text-foreground-muted sm:hidden pt-1">
                Swipe horizontally to browse gallery
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
})
