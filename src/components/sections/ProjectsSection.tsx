import { memo, useEffect, useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowUpRight, Plus, Minus, Volume2, VolumeX } from 'lucide-react'
import { FiGithub } from 'react-icons/fi'
import { PROJECTS, SELECTED_PROJECT_IDS, type Project } from '@/lib/constants'
import { ProjectGalleryModal } from '@/components/ui'
import { useInView } from '@/hooks'
import { cn } from '@/lib/utils'

const SELECTED = SELECTED_PROJECT_IDS.map((id) => PROJECTS.find((p) => p.id === id)).filter(
  (p): p is Project => !!p
)
const OTHERS = PROJECTS.filter((p) => !SELECTED_PROJECT_IDS.includes(p.id))
const pad = (n: number) => String(n).padStart(2, '0')

interface StackCardProps {
  project: Project
  index: number
  stacked: boolean
  /** Scroll progress through the whole card list (0 → 1) */
  progress: MotionValue<number>
  onSelect: (p: Project) => void
}

const StackCard = memo(function StackCard({
  project,
  index,
  stacked,
  progress,
  onSelect,
}: StackCardProps) {
  const [portrait, setPortrait] = useState(false)
  const reduceMotion = useReducedMotion()
  const [videoRef, videoInView] = useInView<HTMLVideoElement>({ threshold: 0.3, triggerOnce: false })
  const articleRef = useRef<HTMLElement>(null)
  const [covered, setCovered] = useState(false)
  // sticky cards stay "in view" under the next card, so also check whether the next one has slid over half of this
  // (scroll events, not `progress`: that clamps at 1 before the last cards finish sliding in)
  useEffect(() => {
    const el = articleRef.current
    const next = el?.nextElementSibling
    if (!project.video || !el || !next) return
    const check = () => {
      const box = el.getBoundingClientRect()
      setCovered(next.getBoundingClientRect().top < box.top + box.height / 2)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [project.video])
  // play only while on screen and uncovered; preload="none" means nothing downloads until then
  useEffect(() => {
    const v = videoRef.current
    if (!v || reduceMotion) return
    if (videoInView && !covered) v.play().catch(() => {})
    else v.pause()
  }, [videoInView, covered, reduceMotion, videoRef])
  const [muted, setMuted] = useState(true)
  const toggleSound = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    if (!v.muted && v.paused) v.play().catch(() => {})
    setMuted(v.muted)
  }
  // the gallery plays the same video with sound: silence the card so they don't overlap
  const open = () => {
    if (videoRef.current) videoRef.current.muted = true
    setMuted(true)
    onSelect(project)
  }
  // Once later cards start sliding over this one, shrink it (deeper cards shrink more) and darken it
  const depth = SELECTED.length - 1 - index
  const start = index / SELECTED.length
  const scale = useTransform(progress, [start, 1], [1, 1 - depth * 0.04])
  const shade = useTransform(progress, [start, 1], [0, depth ? 0.5 : 0])

  return (
    <motion.article
      ref={articleRef}
      style={stacked ? { scale, top: `${96 + index * 20}px` } : undefined}
      className={cn(
        'relative grid origin-top overflow-hidden rounded-2xl bg-ink text-paper lg:grid-cols-[1fr_1.35fr]',
        // single column on small screens: copy on top, screenshot takes whatever height is left
        stacked && 'grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1',
        // cards must be direct siblings in one container: sticky only pins within its parent
        stacked && 'sticky h-[min(78svh,680px)]',
        stacked && depth > 0 && 'mb-[25svh]'
      )}
    >
      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest">
          <span className="text-accent">{pad(index + 1)}</span>
          <span className="text-foreground-subtle">{project.category}</span>
        </div>
        <h3 className="mt-4 font-display text-[clamp(2.25rem,5vw,4.5rem)] sm:mt-6 font-black uppercase leading-[0.9] tracking-tight text-paper">
          {project.title}
        </h3>
        <p className={cn('mt-4 max-w-md text-sm leading-relaxed text-foreground-muted sm:text-base', stacked && 'line-clamp-3 lg:line-clamp-none')}>
          {project.description}
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {project.technologies.map((t) => (
            <li
              key={t}
              className="rounded-full border border-border-hover px-3 py-1 text-xs text-foreground-muted"
            >
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-3 lg:mt-auto">
          <button
            onClick={open}
            className="group inline-flex w-fit items-center gap-3 rounded-lg bg-accent py-2 pl-5 pr-2 font-display text-base font-extrabold uppercase tracking-wide text-ink transition-colors hover:bg-accent-hover"
          >
            View project
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-accent transition-transform group-hover:translate-x-1">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </button>
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} source code on GitHub`}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-hover px-4 font-display text-base font-extrabold uppercase tracking-wide text-paper transition-colors hover:border-paper"
            >
              <FiGithub className="h-4 w-4" />
              Code
            </a>
          )}
        </div>
      </div>

      <div className={cn('relative overflow-hidden', project.video ? 'bg-black' : 'bg-surface', stacked ? 'min-h-40 lg:min-h-0' : 'h-64 sm:h-80 lg:h-auto')}>
      <button
        onClick={open}
        aria-label={`Open ${project.title} gallery`}
        className="group absolute inset-0"
      >
        {project.video ? (
          <video
            ref={videoRef}
            src={project.video}
            poster={project.image}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            // whole 16:9 frame, letterboxed, so captions and UI in the clip aren't cut off
            className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
        <img
          src={project.image}
          alt=""
          loading={index === 0 ? 'eager' : 'lazy'}
          onLoad={(e) => setPortrait(e.currentTarget.naturalHeight > e.currentTarget.naturalWidth)}
          // phone screenshots are portrait: show them whole instead of cropping
          className={cn(
            'absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.03]',
            portrait ? 'object-contain p-6' : 'object-cover object-top'
          )}
        />
        )}
      </button>
      {project.video && (
        <button
          onClick={toggleSound}
          aria-label={muted ? 'Turn sound on' : 'Mute video'}
          aria-pressed={!muted}
          className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full border border-border-hover bg-ink/80 text-paper backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}
      </div>

      {stacked && (
        <motion.div
          style={{ opacity: shade }}
          className="pointer-events-none absolute inset-0 bg-ink"
        />
      )}
    </motion.article>
  )
})

/**
 * Selected Work — featured projects as sticky stacked cards (a plain list for reduced
 * motion), plus an expandable list of the rest (PRD §6.3). All open the gallery modal.
 */
export const ProjectsSection = memo(function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showAll, setShowAll] = useState(false)
  const reduceMotion = useReducedMotion()
  const stacked = !reduceMotion
  const listRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start start', 'end end'] })

  return (
    <section id="projects" className="relative bg-paper py-16 text-ink sm:py-20 md:py-28">
      <div className="section-container">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent-strong">
              Selected work
            </p>
            <h2 className="font-display text-[clamp(3.5rem,11vw,10rem)] font-black uppercase leading-[0.85] tracking-tight text-ink">
              Selected
              <br />
              <span className="text-paper-dim">Work</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm text-paper-fg-muted sm:text-base">
            {pad(SELECTED.length)} featured projects across AI, web and mobile. Click any project to
            browse its screenshots.
          </p>
        </div>

        <div ref={listRef} className={cn('flex flex-col', stacked ? 'gap-0' : 'gap-6')}>
          {SELECTED.map((project, i) => (
            <StackCard
              key={project.id}
              project={project}
              index={i}
              stacked={stacked}
              progress={scrollYProgress}
              onSelect={setSelectedProject}
            />
          ))}
        </div>

        <div className="mt-16 md:mt-24">
          <button
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            aria-controls="more-projects"
            className="flex w-full items-center justify-between border-b-2 border-ink pb-4 font-display text-3xl font-black uppercase tracking-tight sm:text-5xl"
          >
            <span>
              More projects <span className="text-paper-dim">({pad(OTHERS.length)})</span>
            </span>
            {showAll ? <Minus className="h-8 w-8" /> : <Plus className="h-8 w-8" />}
          </button>

          <AnimatePresence initial={false}>
            {showAll && (
              <motion.ul
                id="more-projects"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                {OTHERS.map((project, i) => (
                  <li key={project.id} className="border-b border-paper-line">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="group grid w-full grid-cols-[3rem_1fr_auto] items-center gap-4 py-5 text-left sm:grid-cols-[4rem_1fr_14rem_auto]"
                    >
                      <span className="font-mono text-xs text-paper-fg-muted">
                        {pad(SELECTED.length + i + 1)}
                      </span>
                      <span className="font-display text-2xl font-extrabold uppercase tracking-tight transition-colors group-hover:text-accent-strong sm:text-3xl">
                        {project.title}
                      </span>
                      <span className="hidden text-sm text-paper-fg-muted sm:block">
                        {project.category}
                      </span>
                      <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ProjectGalleryModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </section>
  )
})
