import { memo } from 'react'
import { ArrowUpRight, Folder, X } from 'lucide-react'
import type { Project } from '@/lib/constants'

interface DeskWindowProps {
  project: Project
  onClose: () => void
  onDetails: () => void
}

/**
 * A project opened on the main monitor: its promo video (or YouTube demo, or poster when it has
 * neither), with the details and live links underneath. Laid out at SCREEN_PX and mapped onto the screen.
 */
export const DeskWindow = memo(function DeskWindow({ project, onClose, onDetails }: DeskWindowProps) {
  return (
    <div
      role="dialog"
      aria-label={`${project.title} on the computer`}
      className="flex h-full w-full flex-col bg-[#0b1220] text-[#dbe5ea]"
    >
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#111a2b] px-4">
        <p className="flex min-w-0 items-center gap-2 font-mono text-sm">
          <Folder className="h-4 w-4 shrink-0 text-[#d9a44a]" aria-hidden="true" />
          <span className="text-[#5f7186]">~/projects/</span>
          <span className="truncate font-semibold text-[#eef2f3]">{project.title}</span>
        </p>
        <button
          onClick={onClose}
          aria-label="Close the project"
          className="rounded-md border border-white/10 p-1.5 text-[#8fa0ad] transition-colors hover:border-white/25 hover:text-[#eef2f3]"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 bg-black">
        {project.video ? (
          <video
            key={project.id}
            src={project.video}
            poster={project.image}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-contain"
          />
        ) : project.youtubeId ? (
          <iframe
            key={project.id}
            src={`https://www.youtube-nocookie.com/embed/${project.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={`${project.title} demo`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full"
          />
        ) : (
          <img src={project.image} alt={project.title} className="h-full w-full object-contain" />
        )}
      </div>

      <footer className="flex h-14 shrink-0 items-center gap-2 border-t border-white/10 bg-[#111a2b] px-4">
        <span className="mr-1 text-sm text-[#8fa0ad]">{project.category}</span>
        {project.technologies.slice(0, 3).map((tech) => (
          <span key={tech} className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px] text-[#8fa0ad]">
            {tech}
          </span>
        ))}
        <span className="flex-1" />
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-white/15 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#dbe5ea] transition-colors hover:border-[#3fb0b7]/60 hover:text-[#3fb0b7]"
          >
            Live <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
        <button
          onClick={onDetails}
          className="rounded-md bg-[#3fb0b7] px-3 py-1.5 font-display text-xs font-extrabold uppercase tracking-wide text-[#0b1226] transition-colors hover:bg-[#5cc2c8]"
        >
          Details
        </button>
      </footer>
    </div>
  )
})
