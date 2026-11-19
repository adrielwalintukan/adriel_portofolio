import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Download, X } from 'lucide-react'
import { type Project } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ProjectLinkProps {
  project: Project
  /** smaller size for the gallery modal */
  compact?: boolean
  className?: string
}

/**
 * The one outward link for a project: a mobile app opens the APK download panel
 * (QR + install steps), a web app goes straight to the live site.
 * Renders nothing for projects that have neither.
 */
export const ProjectLink = function ProjectLink({ project, compact, className }: ProjectLinkProps) {
  const [open, setOpen] = useState(false)

  // Esc closes and the page behind stays put while the panel is up
  useEffect(() => {
    if (!open) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // capture: keep the gallery modal underneath open when this panel closes
      e.stopImmediatePropagation()
      setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const base = cn(
    'inline-flex items-center gap-2 rounded-lg border border-border-hover transition-colors',
    compact
      ? 'px-3 py-1.5 text-xs font-medium sm:text-sm hover:border-accent hover:text-accent'
      : 'h-11 px-4 font-display text-base font-extrabold uppercase tracking-wide hover:border-foreground',
    className
  )

  if (project.downloadUrl) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className={base} aria-label={`Download ${project.title}`}>
          <Download className="h-4 w-4" />
          Download APK
        </button>
        {open &&
          createPortal(
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-ink/25 p-4 backdrop-blur-[3px]"
              onClick={() => setOpen(false)}
              role="presentation"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="download-title"
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg rounded-2xl border border-white/40 bg-surface/82 p-6 text-foreground shadow-elevated backdrop-blur-2xl backdrop-saturate-150 sm:p-8"
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  autoFocus
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border-hover transition-colors hover:border-accent hover:text-accent"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="font-mono text-xs uppercase tracking-widest text-accent">Android app</p>
                <h3
                  id="download-title"
                  className="mt-2 pr-10 font-display text-3xl font-black uppercase leading-none tracking-tight"
                >
                  {project.title}
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Free APK{project.downloadSize && ` · ${project.downloadSize}`}
                </p>

                <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
                  {project.downloadQr && (
                    <img
                      src={project.downloadQr}
                      alt={`QR code to download ${project.title}`}
                      width={144}
                      height={144}
                      className="h-36 w-36 shrink-0 rounded-lg border border-border bg-white p-2"
                    />
                  )}
                  <ol className="space-y-2 text-sm leading-relaxed text-foreground-muted">
                    <li>1. Scan the QR with your phone camera, or tap Download below.</li>
                    <li>2. Open the file and allow installs from this source when asked.</li>
                    <li>3. Install, then sign in with Google to sync your data.</li>
                  </ol>
                </div>

                <a
                  href={project.downloadUrl}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-accent px-5 font-display text-base font-extrabold uppercase tracking-wide text-paper transition-colors hover:bg-accent-hover"
                >
                  <Download className="h-5 w-5" />
                  Download APK
                </a>
              </div>
            </div>,
            document.body
          )}
      </>
    )
  }

  if (!project.liveUrl) return null

  return (
    <a
      href={project.liveUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${project.title} live site`}
      className={base}
    >
      Live site
      <ArrowUpRight className="h-4 w-4" />
    </a>
  )
}
