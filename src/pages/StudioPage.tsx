import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { CertificateModal, ProjectGalleryModal } from '@/components/ui'
import type { Certificate, Project } from '@/lib/constants'
import { STATIONS, type StationId, type ViewId } from '@/studio/data'
import { StudioScene } from '@/studio/Scene'
import { StudioPanel } from '@/studio/StudioPanel'

const isStation = (value: string): value is StationId => STATIONS.some((s) => s.id === value)

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * 3D studio: a room you can look around, with the portfolio's real content in HTML panels.
 * three.js is only downloaded here, so the main site is unaffected.
 */
function StudioPage() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion() ?? false
  const [webgl] = useState(hasWebGL)
  const [view, setView] = useState<ViewId>(() => {
    if (typeof window === 'undefined') return 'room'
    const hash = window.location.hash.replace('#', '')
    return isStation(hash) ? hash : 'room'
  })
  const [ready, setReady] = useState(false)
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null)
  const [greetKey, setGreetKey] = useState(0)
  const [hello, setHello] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [certificate, setCertificate] = useState<Certificate | null>(null)

  const coarse = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  )

  // keep the studio out of the page scroll and restore it on the way out
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // the project/certificate modals lock the body too and release it when they close: hold our lock
  useEffect(() => {
    document.body.style.overflow = 'hidden'
  }, [project, certificate])

  useEffect(() => {
    const title = document.title
    document.title = '3D Studio — Adriel Walintukan'
    return () => {
      document.title = title
    }
  }, [])

  // station lives in the hash: shareable and refresh-safe without a server rewrite per station
  useEffect(() => {
    if (typeof window === 'undefined') return
    const room = view === 'room' || view === 'poster'
    window.history.replaceState(null, '', room ? '/studio' : `/studio#${view}`)
  }, [view])

  useEffect(() => {
    if (!hello) return
    const timer = window.setTimeout(() => setHello(false), 6500)
    return () => window.clearTimeout(timer)
  }, [hello])

  useEffect(() => {
    const cursor = hover && !coarse ? 'pointer' : ''
    document.body.style.cursor = cursor
    return () => {
      document.body.style.cursor = ''
    }
  }, [hover, coarse])

  const closeAll = useCallback(() => {
    setProject(null)
    setCertificate(null)
  }, [])

  // stable, so the modals' body-lock effects only re-run when a modal actually opens or closes
  const closeProject = useCallback(() => setProject(null), [])
  const closeCertificate = useCallback(() => setCertificate(null), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (project || certificate) {
        closeAll()
        return
      }
      if (view !== 'room') {
        setView('room')
        return
      }
      navigate('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [project, certificate, view, closeAll, navigate])

  const onHover = useCallback((label: string | null, x: number, y: number) => {
    setHover(label ? { label, x, y } : null)
  }, [])

  const onGreet = useCallback(() => {
    setGreetKey((key) => key + 1)
    setHello(false)
  }, [])

  const station = view === 'room' || view === 'poster' ? null : STATIONS.find((s) => s.id === view)

  if (!webgl) {
    return (
      <div className="section-dark grid min-h-[100svh] place-items-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-3xl font-black uppercase">3D Studio needs WebGL</h1>
          <p className="mt-3 text-sm text-foreground-muted">
            Your browser has WebGL turned off, so the room can&apos;t render. The regular portfolio works everywhere.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-paper"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the site
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section-dark fixed inset-0 overflow-hidden bg-[#070c16]">
      <div className="absolute inset-0">
        <StudioScene
          view={view}
          reduced={reducedMotion}
          shadows={!coarse}
          dpr={[1, coarse ? 1.4 : 1.75]}
          greetKey={greetKey}
          onReady={() => setReady(true)}
          onPick={setView}
          onHover={onHover}
          onGreet={onGreet}
          onPoster={() => setView('poster')}
        />
      </div>

      {/* UI layer: pointer-events-none so drags reach the canvas, re-enabled per control */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
        <header className="flex flex-col gap-2 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="pointer-events-auto flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1226]/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] backdrop-blur transition-colors hover:border-white/30 hover:text-[#eef2f3]"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Site
              </Link>
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.28em] text-[#5f7186] sm:block">
                Adriel&apos;s 3D studio
              </span>
            </div>

            <nav
              aria-label="Rooms"
              className="pointer-events-auto hidden items-center gap-1 rounded-full border border-white/10 bg-[#0b1226]/80 p-1 backdrop-blur md:flex"
            >
              <button
                onClick={() => setView('room')}
                aria-pressed={view === 'room' || view === 'poster'}
                className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  view === 'room' || view === 'poster'
                    ? 'bg-[#3fb0b7]/15 text-[#3fb0b7]'
                    : 'text-[#8fa0ad] hover:text-[#eef2f3]'
                }`}
              >
                Room
              </button>
              {STATIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  aria-pressed={view === item.id}
                  className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                    view === item.id ? 'bg-[#3fb0b7]/15 text-[#3fb0b7]' : 'text-[#8fa0ad] hover:text-[#eef2f3]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => (view === 'room' ? navigate('/') : setView('room'))}
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1226]/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] backdrop-blur transition-colors hover:border-white/30 hover:text-[#eef2f3]"
            >
              {view === 'room' ? 'Exit' : <><RotateCcw className="h-3.5 w-3.5" /> Room</>}
              <kbd className="hidden rounded border border-white/15 px-1 text-[10px] sm:inline">Esc</kbd>
            </button>
          </div>

          <nav aria-label="Rooms" className="pointer-events-auto -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:hidden">
            <button
              onClick={() => setView('room')}
              aria-pressed={view === 'room' || view === 'poster'}
              className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider ${
                view === 'room' || view === 'poster'
                  ? 'border-[#3fb0b7]/60 bg-[#3fb0b7]/15 text-[#3fb0b7]'
                  : 'border-white/10 bg-[#0b1226]/80 text-[#8fa0ad]'
              }`}
            >
              Room
            </button>
            {STATIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                aria-pressed={view === item.id}
                className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider ${
                  view === item.id
                    ? 'border-[#3fb0b7]/60 bg-[#3fb0b7]/15 text-[#3fb0b7]'
                    : 'border-white/10 bg-[#0b1226]/80 text-[#8fa0ad]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="relative flex-1">
          {/* desktop panel */}
          <div className="pointer-events-none absolute bottom-4 right-4 top-2 hidden w-[380px] md:block">
            <AnimatePresence>
              {station && (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                >
                  <StudioPanel
                    station={station.id}
                    onClose={() => setView('room')}
                    onOpenProject={setProject}
                    onOpenCertificate={setCertificate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* hint */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 md:justify-start md:pl-4 ${
              station ? 'hidden md:flex' : 'flex'
            }`}
          >
            <p className="rounded-full border border-white/10 bg-[#0b1226]/85 px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad] backdrop-blur">
              Drag to look around · Click anything in the room
            </p>
          </div>

          <AnimatePresence>
            {hello && view === 'room' && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 bottom-16 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-xl border border-[#3fb0b7]/30 bg-[#0b1226]/90 px-4 py-2 text-center text-xs text-[#dbe5ea] backdrop-blur"
              >
                Hi, I&apos;m Adriel. The room is yours — drag it, click through it.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* mobile sheet */}
      <AnimatePresence>
        {station && (
          <motion.div
            key={station.id}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-2 bottom-2 z-30 h-[52svh] md:hidden"
          >
            <StudioPanel
              station={station.id}
              onClose={() => setView('room')}
              onOpenProject={setProject}
              onOpenCertificate={setCertificate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* hotspot tooltip */}
      {hover && !coarse && !station && (
        <div
          className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-md border border-white/15 bg-[#0b1226]/95 px-2.5 py-1.5 font-mono text-[11px] text-[#dbe5ea] shadow-lg"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.label}
          <span className="ml-2 text-[#3fb0b7]">click</span>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {station ? `${station.label} panel opened` : 'Back to the room'}
      </p>

      {!ready && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#070c16] transition-opacity duration-500">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#8fa0ad]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3fb0b7]" /> entering the studio
          </p>
        </div>
      )}

      <ProjectGalleryModal project={project} onClose={closeProject} />
      <CertificateModal certificate={certificate} onClose={closeCertificate} />
    </div>
  )
}

export default memo(StudioPage)
