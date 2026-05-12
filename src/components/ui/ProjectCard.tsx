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
 * Standard project card for the bento grid.
 * Features a glassmorphism base, image zoom on hover, desktop 3D tilt,
 * and triggers interactive local image gallery overlay on click.
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
        'glass group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-glow-lg hover:border-accent/30 cursor-pointer',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-video w-full overflow-hidden border-b border-border/50 bg-surface">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform"
        />
        
        {/* Category Label */}
        <div className="absolute left-4 top-4 z-20 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-md">
          {project.category}
        </div>

        {/* Gallery Preview Count Overlay */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-semibold text-foreground-muted backdrop-blur-md transition-colors group-hover:text-accent border border-border/40">
          <FiImage className="h-3 w-3" />
          <span>{imageCount}</span>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">
            {project.title}
          </h3>
          <span className="text-xs font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100 shrink-0 pt-1">
            Open Gallery →
          </span>
        </div>

        <p className="mb-6 line-clamp-2 text-sm text-foreground-subtle sm:text-base">
          {project.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-2">
          {project.technologies.slice(0, 4).map((tech) => (
            <TechBadge key={tech} name={tech} />
          ))}
          {project.technologies.length > 4 && (
            <TechBadge name={`+${project.technologies.length - 4}`} />
          )}
        </div>
      </div>
    </div>
  )

  if (isTouchDevice) {
    return cardContent
  }

  return (
    <Tilt
      tiltMaxAngleX={3}
      tiltMaxAngleY={3}
      glareEnable={true}
      glareMaxOpacity={0.05}
      glarePosition="all"
      transitionSpeed={1000}
      scale={1.01}
      className="h-full"
    >
      {cardContent}
    </Tilt>
  )
})
