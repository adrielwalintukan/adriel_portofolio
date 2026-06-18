import { memo } from 'react'
import Tilt from 'react-parallax-tilt'
import { FiImage } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import { useDeviceDetect } from '@/hooks'
import { type Project } from '@/lib/constants'
import { TechBadge } from './TechBadge'

interface ProjectCardProps {
  project: Project
  onSelectProject?: (project: Project) => void
  className?: string
}

/**
 * Cinematic standard project card for the infinite marquee.
 * Features a 16:10 landscape aspect ratio, full-cover image, and premium gradient text overlay.
 */
export const ProjectCard = memo(function ProjectCard({
  project,
  onSelectProject,
  className,
}: ProjectCardProps) {
  const { isTouchDevice } = useDeviceDetect()
  const imageCount = project.images?.length || 1

  const cardContent = (
    <div 
      onClick={() => onSelectProject?.(project)}
      className={cn(
        'group relative flex h-full w-full overflow-hidden rounded-2xl cursor-pointer aspect-[16/10] border border-white/5 transition-all duration-500 hover:border-accent/40 shadow-xl',
        className
      )}
    >
      {/* Background Image */}
      <img
        src={project.image}
        alt={project.title}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 will-change-transform select-none"
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute inset-0 bg-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 mix-blend-overlay" />

      {/* Top Badges */}
      <div className="absolute top-4 left-4 z-20 rounded-full border border-white/10 bg-background/50 px-3 py-1.5 text-[9px] sm:text-[10px] font-semibold tracking-wider text-foreground-subtle backdrop-blur-md transition-colors group-hover:border-accent/30 group-hover:text-accent uppercase">
        {project.category}
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-background/50 px-2.5 py-1.5 text-[10px] font-semibold text-foreground-muted backdrop-blur-md transition-colors group-hover:text-accent group-hover:border-accent/30">
        <FiImage className="h-3 w-3" />
        <span>{imageCount}</span>
      </div>

      {/* Content Area at Bottom */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end p-4 sm:p-5 lg:p-6 transition-transform duration-500 ease-out">
        <h3 className="mb-2 font-display text-lg sm:text-xl font-bold tracking-tight text-white transition-colors group-hover:text-accent drop-shadow-md">
          {project.title}
        </h3>
        
        <p className="mb-4 line-clamp-2 text-xs sm:text-sm text-gray-300 drop-shadow-sm max-w-[95%] leading-relaxed">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {project.technologies.slice(0, 3).map((tech) => (
              <TechBadge key={tech} name={tech} />
            ))}
            {project.technologies.length > 3 && (
              <span className="text-[10px] font-medium text-foreground-subtle bg-surface/40 backdrop-blur-md border border-border/40 rounded-full px-2 py-0.5 flex items-center">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
          <span className="hidden sm:block text-[10px] font-bold text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 uppercase tracking-wider">
            View
          </span>
        </div>
      </div>
    </div>
  )

  if (isTouchDevice) {
    return cardContent
  }

  return (
    <Tilt
      tiltMaxAngleX={1}
      tiltMaxAngleY={1}
      glareEnable={false}
      transitionSpeed={1000}
      scale={1.01}
      className="h-full w-full"
    >
      {cardContent}
    </Tilt>
  )
})
