import { memo } from 'react'
import Tilt from 'react-parallax-tilt'
import { FiGithub, FiExternalLink } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import { useDeviceDetect } from '@/hooks'
import { type Project } from '@/lib/constants'
import { TechBadge } from './TechBadge'
import { Button } from './Button'

interface FeaturedProjectCardProps {
  project: Project
  className?: string
}

/**
 * Featured project card for the bento grid.
 * Occupies more space, uses stronger visual presence, and richer descriptions.
 */
export const FeaturedProjectCard = memo(function FeaturedProjectCard({
  project,
  className,
}: FeaturedProjectCardProps) {
  const { isTouchDevice } = useDeviceDetect()

  const cardContent = (
    <div className={cn('glass-strong group relative flex h-full flex-col overflow-hidden rounded-2xl md:flex-row transition-all duration-500 hover:shadow-glow-lg hover:border-accent/40', className)}>
      {/* Image Container (Left on Desktop, Top on Mobile) */}
      <div className="relative aspect-video w-full overflow-hidden border-b border-border/50 bg-surface md:w-3/5 md:border-b-0 md:border-r">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/90 via-background/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-background/90" />
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 will-change-transform"
        />
        
        {/* Decorative ambient glow inside image container */}
        <div className="absolute inset-0 z-0 bg-accent/10 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      {/* Content Container (Right on Desktop, Bottom on Mobile) */}
      <div className="relative z-20 flex flex-1 flex-col justify-center p-6 sm:p-8 md:p-10">
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-accent">
            Featured Project
          </span>
          <div className="h-px w-8 bg-accent/30" />
        </div>

        <h3 className="mb-4 font-display text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-neon-cyan sm:text-3xl lg:text-4xl">
          {project.title}
        </h3>

        <p className="mb-8 text-sm text-foreground-subtle sm:text-base lg:text-lg">
          {project.longDescription || project.description}
        </p>

        <div className="mb-8 flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <TechBadge key={tech} name={tech} />
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-4">
          {project.liveUrl && (
            <Button href={project.liveUrl} variant="primary" icon={<FiExternalLink className="h-4 w-4" />}>
              Live Preview
            </Button>
          )}
          {project.githubUrl && (
            <Button href={project.githubUrl} variant="outline" icon={<FiGithub className="h-4 w-4" />}>
              Source Code
            </Button>
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
      tiltMaxAngleX={2}
      tiltMaxAngleY={2}
      glareEnable={true}
      glareMaxOpacity={0.03}
      glarePosition="all"
      transitionSpeed={1200}
      scale={1.005}
      className="h-full"
    >
      {cardContent}
    </Tilt>
  )
})
