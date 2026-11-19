import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Music, RotateCcw, VolumeX } from 'lucide-react'
import { CertificateModal, ProjectGalleryModal } from '@/components/ui'
import { CONTACT_INFO, EXPERIENCE_TIMELINE, SKILLS_DATA, type Certificate, type Project } from '@/lib/constants'
import {
  DESK_COLS,
  DESK_PROJECTS,
  SCREEN_PX,
  STATIONS,
  TV_PICKS,
  deskOverlay,
  terminalLog,
  tvOverlay,
  type StationId,
  type TvMode,
  type ViewId,
} from '@/studio/data'
import { DeskWindow } from '@/studio/DeskWindow'
import { potted, rerack, table } from '@/studio/pool'
import { startMusic, stopMusic, unlock } from '@/studio/sound'
import { runCommand, type TermData } from '@/studio/terminal'
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
  const [tvMode, setTvMode] = useState<TvMode>('menu')
  // highlighted item on the TV's menu or video list
  const [tvSel, setTvSel] = useState(0)
  const [video, setVideo] = useState(TV_PICKS[0].id)
  // the computer: highlighted folder, and the project open in its window
  const [deskSel, setDeskSel] = useState(0)
  const [deskOpen, setDeskOpen] = useState<number | null>(null)
  // walking away from the desk closes the window, so coming back shows the folders again
  const [lastView, setLastView] = useState(view)
  if (view !== lastView) {
    setLastView(view)
    // leaving the desk closes the window; arriving keeps one the terminal asked to open
    if (view !== 'projects') setDeskOpen(null)
  }

  // the left monitor's terminal: real commands over the portfolio's own data
  const [command, setCommand] = useState('')
  const termData = useMemo<TermData>(
    () => ({
      name: 'Adriel Walintukan',
      about: 'Information Systems student building AI-powered web and mobile products',
      city: CONTACT_INFO.city,
      email: CONTACT_INFO.email,
      availability: CONTACT_INFO.availability,
      projects: DESK_PROJECTS.map((p) => p.title),
      skills: SKILLS_DATA.map((s) => ({
        category: s.category,
        names: s.skills.map((k) => k.name),
      })),
    }),
    []
  )
  const typeCommand = (value: string) => {
    setCommand(value)
    terminalLog.input = value
  }
  const submitCommand = () => {
    const result = runCommand(command, termData)
    terminalLog.lines = result.clear ? [] : [...terminalLog.lines, ...result.lines].slice(-200)
    typeCommand('')
    if (result.open !== undefined) {
      setDeskSel(result.open)
      setDeskOpen(result.open)
      setView('projects')
    }
  }

  const coarse = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  )

  // only one panel layout is mounted, or the TV's YouTube iframe would play twice
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const onChange = () => setDesktop(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

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

  // the poster and the TV are room views, not stations: same overview hash, no panel
  const inRoom =
    view === 'room' ||
    view === 'poster' ||
    view === 'tv' ||
    view === 'terminal' ||
    view === 'sideboard' ||
    view === 'billiards'

  // station lives in the hash: shareable and refresh-safe without a server rewrite per station
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.history.replaceState(null, '', inRoom ? '/studio' : `/studio#${view}`)
  }, [view, inRoom])

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

  // leaving the TV puts it back on its menu, so it never sits on a stale "now playing" frame
  const closeTv = useCallback(() => {
    setTvMode('menu')
    setTvSel(0)
    setView('room')
  }, [])

  // Enter (or a tap on the screen) on a TV item: menu → pong / video list, video list → play it on the TV
  const tvPick = useCallback(
    (index: number) => {
      if (tvMode === 'menu') {
        setTvMode(index === 0 ? 'game' : 'videos')
        setTvSel(0)
      } else if (tvMode === 'videos') {
        setVideo(TV_PICKS[index].id)
        setTvMode('youtube')
      }
    },
    [tvMode]
  )

  // Esc / Backspace on the TV steps back one screen, and off the menu it leaves the TV
  const tvBack = useCallback(() => {
    if (tvMode === 'youtube') setTvMode('videos')
    else if (tvMode === 'videos') {
      setTvMode('menu')
      setTvSel(1)
    } else if (tvMode === 'game') {
      setTvMode('menu')
      setTvSel(0)
    } else closeTv()
  }, [tvMode, closeTv])

  // the player takes keyboard focus when it loads or is clicked; take it back so Esc and the arrows keep driving the TV
  const tvVideo = view === 'tv' && tvMode === 'youtube'
  const deskProject = view === 'projects' && deskOpen !== null ? DESK_PROJECTS[deskOpen] : null
  useEffect(() => {
    if (!tvVideo && !deskProject?.youtubeId) return
    const reclaim = () =>
      window.setTimeout(() => {
        if (document.activeElement instanceof HTMLIFrameElement) {
          document.activeElement.blur()
          window.focus()
        }
      }, 0)
    window.addEventListener('blur', reclaim)
    return () => window.removeEventListener('blur', reclaim)
  }, [tvVideo, deskProject])

  // room music: off until the visitor's first click or key (browsers require one), remembered across visits,
  // and quiet while a video on the TV, the computer or a project modal has the sound
  const [musicOn, setMusicOn] = useState(() => {
    try {
      return localStorage.getItem('studio-music') !== 'off'
    } catch {
      return true
    }
  })
  const [heard, setHeard] = useState(false)
  useEffect(() => {
    const first = () => {
      unlock()
      setHeard(true)
    }
    window.addEventListener('pointerdown', first, { once: true, capture: true })
    window.addEventListener('keydown', first, { once: true, capture: true })
    return () => {
      window.removeEventListener('pointerdown', first, { capture: true })
      window.removeEventListener('keydown', first, { capture: true })
    }
  }, [])
  const videoPlaying = tvVideo || Boolean(deskProject) || Boolean(project)
  useEffect(() => {
    if (heard && musicOn && !videoPlaying) startMusic()
    else stopMusic()
  }, [heard, musicOn, videoPlaying])
  useEffect(() => stopMusic, [])
  const toggleMusic = () => {
    unlock()
    setHeard(true)
    setMusicOn((on) => {
      try {
        localStorage.setItem('studio-music', on ? 'off' : 'on')
      } catch {
        // private mode: the choice just isn't remembered
      }
      return !on
    })
  }

  // the pool score lives in the physics module; read it a few times a second while the table is open
  const [score, setScore] = useState({ shots: 0, potted: 0 })
  useEffect(() => {
    if (view !== 'billiards') return
    const timer = window.setInterval(() => {
      const next = { shots: table.shots, potted: potted(table) }
      setScore((prev) => (prev.shots === next.shots && prev.potted === next.potted ? prev : next))
    }, 200)
    return () => window.clearInterval(timer)
  }, [view])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (view === 'projects' && !project && !certificate) {
        if (deskOpen !== null) {
          if (e.key === 'Escape' || e.key === 'Backspace') {
            e.preventDefault()
            setDeskOpen(null)
          }
          return
        }
        const n = DESK_PROJECTS.length
        const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -DESK_COLS, ArrowDown: DESK_COLS }[
          e.key
        ]
        if (step) {
          e.preventDefault()
          setDeskSel((s) =>
            Math.abs(step) === 1 ? (s + step + n) % n : s + step >= 0 && s + step < n ? s + step : s
          )
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          setDeskOpen(deskSel)
          return
        }
      }
      if (view === 'tv' && !project && !certificate) {
        const count = tvMode === 'menu' ? 2 : tvMode === 'videos' ? TV_PICKS.length : 0
        const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key]
        if (step && count) {
          e.preventDefault()
          setTvSel((s) => (s + step + count) % count)
          return
        }
        if (e.key === 'Enter' && count) {
          e.preventDefault()
          tvPick(tvSel)
          return
        }
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault()
          tvBack()
          return
        }
      }
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
  }, [
    project,
    certificate,
    view,
    tvMode,
    tvSel,
    tvPick,
    tvBack,
    deskOpen,
    deskSel,
    closeAll,
    navigate,
  ])

  const onHover = useCallback((label: string | null, x: number, y: number) => {
    setHover(label ? { label, x, y } : null)
  }, [])

  const onGreet = useCallback(() => {
    setGreetKey((key) => key + 1)
    setHello(false)
  }, [])

  const station = inRoom ? null : STATIONS.find((s) => s.id === view)
  // the computer is used on its own screen and experience is written on the whiteboard: no side panel
  const panel = station?.id === 'projects' || station?.id === 'experience' ? null : station
  const panelOpen = Boolean(panel)
  const tvLabel =
    tvMode === 'menu'
      ? ['Pong', 'YouTube'][tvSel]
      : tvMode === 'videos'
        ? TV_PICKS[tvSel]?.label
        : tvMode === 'game'
          ? 'Pong is playing'
          : 'Video is playing'

  if (!webgl) {
    return (
      <div className="section-dark grid min-h-[100svh] place-items-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-3xl font-black uppercase">3D Studio needs WebGL</h1>
          <p className="mt-3 text-sm text-foreground-muted">
            Your browser has WebGL turned off, so the room can&apos;t render. The regular portfolio
            works everywhere.
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
          // supersampled to at least 1.5x for crisp edges; phones get shadows too, on a smaller map
          shadowSize={coarse ? 1024 : 4096}
          dpr={[1.5, 2]}
          greetKey={greetKey}
          onReady={() => setReady(true)}
          onPick={setView}
          onHover={onHover}
          onGreet={onGreet}
          onPoster={() => setView('poster')}
          onTv={() => {
            // a tap on the TV mid-match must not throw the game back to the menu
            if (view === 'tv') return
            setTvMode('menu')
            setTvSel(0)
            setView('tv')
          }}
          onTvPick={tvPick}
          // any way out of the TV view (pills, Room, Esc) leaves the screen on its menu
          tvMode={view === 'tv' ? tvMode : 'menu'}
          tvSel={view === 'tv' ? tvSel : 0}
          deskSel={deskSel}
          onDeskOpen={setDeskOpen}
          onLook={setView}
        />
      </div>

      {/* screen overlays: laid out at SCREEN_PX, then mapped onto the 3D screen every frame by Room.tsx */}
      {/* off while Details is open: the gallery plays the same video, and two soundtracks would overlap */}
      {deskProject && !project && (
        <div
          ref={(el) => {
            deskOverlay.el = el
          }}
          style={{ width: SCREEN_PX.w, height: SCREEN_PX.h }}
          className="invisible absolute left-0 top-0 z-10 origin-top-left overflow-hidden"
        >
          <DeskWindow
            project={deskProject}
            onClose={() => setDeskOpen(null)}
            onDetails={() => setProject(deskProject)}
          />
        </div>
      )}

      {tvVideo && (
        <div
          ref={(el) => {
            tvOverlay.el = el
          }}
          style={{ width: SCREEN_PX.w, height: SCREEN_PX.h }}
          className="invisible absolute left-0 top-0 z-10 origin-top-left overflow-hidden bg-black"
        >
          <iframe
            key={video}
            src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0&modestbranding=1`}
            title="YouTube player on the TV"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full"
          />
        </div>
      )}

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
                aria-pressed={inRoom}
                className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  inRoom ? 'bg-[#3fb0b7]/15 text-[#3fb0b7]' : 'text-[#8fa0ad] hover:text-[#eef2f3]'
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
                    view === item.id
                      ? 'bg-[#3fb0b7]/15 text-[#3fb0b7]'
                      : 'text-[#8fa0ad] hover:text-[#eef2f3]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={toggleMusic}
                aria-pressed={musicOn}
                aria-label={musicOn ? 'Mute the room music' : 'Play the room music'}
                title={musicOn ? 'Music on' : 'Music off'}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white/10 bg-[#0b1226]/80 text-[#a7b0bd] backdrop-blur transition-colors hover:border-white/30 hover:text-[#eef2f3]"
              >
                {musicOn ? <Music className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => (view === 'room' ? navigate('/') : setView('room'))}
                className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#0b1226]/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] backdrop-blur transition-colors hover:border-white/30 hover:text-[#eef2f3]"
              >
                {view === 'room' ? (
                  'Exit'
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" /> Room
                  </>
                )}
                <kbd className="hidden rounded border border-white/15 px-1 text-[10px] sm:inline">
                  Esc
                </kbd>
              </button>
            </div>
          </div>

          <nav
            aria-label="Rooms"
            className="pointer-events-auto -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:hidden"
          >
            <button
              onClick={() => setView('room')}
              aria-pressed={inRoom}
              className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider ${
                inRoom
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
            <AnimatePresence mode="wait">
              {desktop && panel ? (
                <motion.div
                  key={panel.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                >
                  <StudioPanel
                    station={panel.id}
                    onClose={() => setView('room')}
                    onOpenCertificate={setCertificate}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* hint */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 md:justify-start md:pl-4 ${
              panelOpen ? 'hidden md:flex' : 'flex'
            }`}
          >
            {view === 'tv' ? (
              <div className="flex items-center gap-2">
                {tvMode !== 'menu' && (
                  <button
                    onClick={tvBack}
                    className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b1226]/85 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] backdrop-blur transition-colors hover:border-white/30 hover:text-[#eef2f3]"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                )}
                <p className="rounded-full border border-white/10 bg-[#0b1226]/85 px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad] backdrop-blur">
                  {tvMode === 'game'
                    ? coarse
                      ? 'Drag left and right to steer'
                      : 'Move the pointer to steer · Esc to stop'
                    : tvMode === 'youtube'
                      ? coarse
                        ? 'Playing on the TV'
                        : 'Playing on the TV · Esc for the list'
                      : coarse
                        ? 'Tap a choice on the TV'
                        : '← → choose · Enter select · Esc back'}
                </p>
              </div>
            ) : view === 'projects' ? (
              <div className="flex items-center gap-2">
                {deskProject && (
                  <button
                    onClick={() => setDeskOpen(null)}
                    className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b1226]/85 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] backdrop-blur transition-colors hover:border-white/30 hover:text-[#eef2f3]"
                  >
                    <ArrowLeft className="h-3 w-3" /> Folders
                  </button>
                )}
                <p className="rounded-full border border-white/10 bg-[#0b1226]/85 px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad] backdrop-blur">
                  {deskProject
                    ? coarse
                      ? 'Open on the computer'
                      : 'Open on the computer · Esc for the folders'
                    : coarse
                      ? 'Tap a folder on the screen'
                      : '← → ↑ ↓ choose · Enter open · Esc back'}
                </p>
              </div>
            ) : view === 'billiards' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={rerack}
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b1226]/85 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] backdrop-blur transition-colors hover:border-white/30 hover:text-[#eef2f3]"
                >
                  Rerack
                </button>
                <p
                  aria-live="polite"
                  className="rounded-full border border-[#3fb0b7]/30 bg-[#0b1226]/85 px-3 py-1.5 font-mono text-[11px] text-[#dbe5ea] backdrop-blur"
                >
                  {score.potted}/{table.balls.length - 1} potted · {score.shots}{' '}
                  {score.shots === 1 ? 'shot' : 'shots'}
                </p>
                <p className="hidden rounded-full border border-white/10 bg-[#0b1226]/85 px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad] backdrop-blur sm:block">
                  {coarse
                    ? 'Tap the felt to shoot · farther is harder'
                    : 'Aim with the pointer · click to shoot · farther is harder'}
                </p>
              </div>
            ) : view === 'terminal' ? (
              <form
                className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-full border border-[#3fb0b7]/40 bg-[#0b1226]/90 px-4 py-1.5 backdrop-blur"
                onSubmit={(e) => {
                  e.preventDefault()
                  submitCommand()
                }}
              >
                <span className="font-mono text-[11px] text-[#3fb0b7]" aria-hidden="true">
                  $
                </span>
                <input
                  autoFocus
                  value={command}
                  onChange={(e) => typeCommand(e.target.value)}
                  placeholder="type help, then Enter"
                  aria-label="Terminal command"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-[#dbe5ea] outline-none placeholder:text-[#5f7186]"
                />
              </form>
            ) : (
              <p className="rounded-full border border-white/10 bg-[#0b1226]/85 px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad] backdrop-blur">
                Drag to look around · Click anything in the room
              </p>
            )}
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
      <AnimatePresence mode="wait">
        {!desktop && panel ? (
          <motion.div
            key={panel.id}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-2 bottom-2 z-30 h-[52svh] md:hidden"
          >
            <StudioPanel
              station={panel.id}
              onClose={() => setView('room')}
              onOpenCertificate={setCertificate}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* hotspot tooltip */}
      {hover && !coarse && !panelOpen && view !== 'tv' && view !== 'projects' && (
        <div
          className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-md border border-white/15 bg-[#0b1226]/95 px-2.5 py-1.5 font-mono text-[11px] text-[#dbe5ea] shadow-lg"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.label}
          <span className="ml-2 text-[#3fb0b7]">click</span>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {view === 'billiards'
          ? 'Pool table: aim and click the felt to shoot'
          : view === 'tv'
            ? `TV: ${tvLabel}`
            : view === 'projects'
              ? deskProject
                ? `Computer: ${deskProject.title} opened`
                : `Computer: ${DESK_PROJECTS[deskSel].title}`
              : view === 'experience'
                ? `Whiteboard: ${EXPERIENCE_TIMELINE.map((e) => `${e.title}, ${e.role}, ${e.year}`).join('; ')}`
                : station
                  ? `${station.label} panel opened`
                : 'Back to the room'}
      </p>

      {!ready && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#070c16] transition-opacity duration-500">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#8fa0ad]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3fb0b7]" /> entering the
            studio
          </p>
        </div>
      )}

      <ProjectGalleryModal project={project} onClose={closeProject} />
      <CertificateModal certificate={certificate} onClose={closeCertificate} />
    </div>
  )
}

export default memo(StudioPage)
