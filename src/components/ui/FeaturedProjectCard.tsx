import { memo } from 'react'
import Tilt from 'react-parallax-tilt'
import { FiImage } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import { useDeviceDetect } from '@/hooks'
import { type Project } from '@/lib/constants'
import { TechBadge } from './TechBadge'

interface FeaturedProjectCardProps {
  project: Project
  onSelectProject?: (project: Project) => void
  className?: string
}

/**
 * Featured cinematic project card for the infinite marquee.
 * Occupies more horizontal space and uses stronger visual presence.
 */
export const FeaturedProjectCard = memo(function FeaturedProjectCard({
  project,
  onSelectProject,
  className,
}: FeaturedProjectCardProps) {
  const { isTouchDevice } = useDeviceDetect()
  const imageCount = project.images?.length || 1

  const cardContent = (
    <div 
      onClick={() => onSelectProject?.(project)}
      className={cn(
        'group relative flex h-full w-full overflow-hidden rounded-2xl cursor-pointer aspect-[16/10] md:aspect-[16/9] border border-accent/20 transition-all duration-700 hover:border-accent/60 shadow-2xl hover:shadow-glow-lg',
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
      <div className="absolute inset-0 bg-accent/10 opacity-0 transition-opacity duration-700 group-hover:opacity-100 mix-blend-overlay" />

      {/* Top Badges */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-3">
        <div className="rounded-full border border-accent/30 bg-background/70 px-4 py-1.5 text-[10px] sm:text-xs font-bold tracking-widest text-accent backdrop-blur-md uppercase shadow-lg">
          Featured Project
        </div>
      </div>

      <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-background/60 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-white backdrop-blur-md transition-colors group-hover:border-accent/40 group-hover:text-accent">
        <FiImage className="h-3.5 w-3.5" />
        <span>{imageCount} {imageCount > 1 ? 'Images' : 'Image'}</span>
      </div>

      {/* Content Area at Bottom */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end p-5 sm:p-6 lg:p-8 transition-transform duration-700 ease-out">
        <h3 className="mb-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-neon-cyan drop-shadow-lg">
          {project.title}
        </h3>
        
        <p className="mb-6 line-clamp-2 text-sm sm:text-base text-gray-200 drop-shadow-md max-w-[90%] md:max-w-[80%] leading-relaxed">
          {project.longDescription || project.description}
        </p>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((tech) => (
              <TechBadge key={tech} name={tech} />
            ))}
            {project.technologies.length > 4 && (
              <span className="text-[11px] font-medium text-white bg-surface/50 backdrop-blur-md border border-white/20 rounded-full px-2.5 py-1 flex items-center shadow-sm">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
          <span className="hidden sm:flex items-center gap-2 text-xs font-bold text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 uppercase tracking-widest">
            Explore Gallery →
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
      transitionSpeed={1200}
      scale={1.01}
      className="h-full w-full"
    >
      {cardContent}
    </Tilt>
  )
})
