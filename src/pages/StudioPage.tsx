import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Music, Route, RotateCcw, VolumeX } from 'lucide-react'
import { CertificateModal, ProjectGalleryModal } from '@/components/ui'
import { CERTIFICATES_DATA, CONTACT_INFO, EXPERIENCE_TIMELINE, PROJECTS, SKILLS_DATA, type Certificate, type Project } from '@/lib/constants'
import {
  DESK_PROJECTS,
  SCREEN_PX,
  STATIONS,
  TV_PICKS,
  deskOverlay,
  screenPower,
  terminalLog,
  tvOverlay,
  type StationId,
  type TvMode,
  type ViewId,
} from '@/studio/data'
import { Desktop, type Intent } from '@/studio/os/Desktop'
import { PowerScreen } from '@/studio/os/PowerScreen'
import { Help } from '@/studio/Help'
import { keyAction } from '@/studio/keymap'
import { togglePhase } from '@/studio/daylight'
import { defaultQuality, type Quality } from '@/studio/quality'
import { applyEffect } from '@/studio/os/termGlue'
import { potted, rerack, table } from '@/studio/pool'
import { startMusic, stopMusic, unlock } from '@/studio/sound'
import { TOUR, TOUR_STEP_MS } from '@/studio/tour'
import { GuestForm } from '@/studio/GuestForm'
import type { Note } from '@/lib/guestbook'
import { runCommand, type TermData } from '@/studio/terminal'
import { StudioScene } from '@/studio/Scene'
import { StudioPanel } from '@/studio/StudioPanel'

const isStation = (value: string): value is StationId => STATIONS.some((s) => s.id === value)

const devicePixelRatioNow = () => (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)
const savedHd = (): 'on' | 'off' | null => {
  try {
    const v = localStorage.getItem('studio-hd')
    return v === 'on' || v === 'off' ? v : null
  } catch {
    return null
  }
}

/** Whether this browser can make a WebGL2 context, and if not, the reason it gives (shown on the fallback screen). */
const probeWebGL = (): { ok: boolean; reason: string } => {
  let reason = ''
  try {
    const canvas = document.createElement('canvas')
    canvas.addEventListener('webglcontextcreationerror', (e) => (reason = (e as WebGLContextEvent).statusMessage || reason))
    // three 0.187 dropped WebGL 1, so a device with only WebGL 1 must get the fallback, not a blank canvas
    const gl = canvas.getContext('webgl2')
    // the probe must not keep a GPU context alive: browsers cap them, and a leaked one starves the real canvas
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return { ok: Boolean(gl), reason: gl ? '' : reason || 'getContext("webgl2") returned null' }
  } catch (error) {
    return { ok: false, reason: String(error) }
  }
}

/**
 * 3D studio: a room you can look around, with the portfolio's real content in HTML panels.
 * three.js is only downloaded here, so the main site is unaffected.
 */
function StudioPage() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion() ?? false
  const [{ ok: webgl, reason: webglReason }] = useState(probeWebGL)
  const [view, setView] = useState<ViewId>(() => {
    if (typeof window === 'undefined') return 'room'
    const hash = window.location.hash.replace('#', '')
    return isStation(hash) ? hash : 'room'
  })
  // the side panel can be tucked away for a full view of the room; it comes back whenever the view changes
  const [panelHidden, setPanelHidden] = useState(false)
  const [panelView, setPanelView] = useState(view)
  if (view !== panelView) {
    setPanelView(view)
    setPanelHidden(false)
  }
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
  // the computer's desktop: what its media window plays, and a folder the terminal asked it to open
  const [deskMedia, setDeskMedia] = useState<'none' | 'video' | 'youtube'>('none')
  const [deskIntent, setDeskIntent] = useState<Intent>(null)
  // both monitors: AdrielOS "Shut down" turns them off, leaving the view does not
  const [screensOn, setScreensOnState] = useState(true)
  const setScreensOn = useCallback((on: boolean) => {
    screenPower.on = on
    setScreensOnState(on)
  }, [])

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
    if (result.effect) applyEffect(result.effect)
    if (result.open !== undefined) {
      setDeskIntent((prev) => ({ id: (prev?.id ?? 0) + 1, project: DESK_PROJECTS[result.open!].title }))
      setView('projects')
    }
  }

  const coarse = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  )

  // render quality: HD on desktops, Fast on phones; a choice made with the HD chip is remembered and never overridden
  const [quality, setQuality] = useState<Quality>(() => defaultQuality(coarse, devicePixelRatioNow(), savedHd()))
  const [autoQuality, setAutoQuality] = useState(() => savedHd() === null)
  const toggleHd = () => {
    const next = quality.hd ? 'off' : 'on'
    try {
      localStorage.setItem('studio-hd', next)
    } catch {
      /* private mode: the choice lasts for this visit */
    }
    setAutoQuality(false)
    setQuality(defaultQuality(coarse, devicePixelRatioNow(), next))
  }

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
    view === 'billiards' ||
    view === 'guestbook'

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

  // guest book: notes for the cork board, and the sign form
  const [guestNotes, setGuestNotes] = useState<Note[]>([])
  const [signing, setSigning] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  useEffect(() => {
    let live = true
    // no storage (or plain `vite` dev without the API) just leaves the board empty
    fetch('/api/guestbook')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { notes?: Note[] } | null) => {
        if (live && Array.isArray(d?.notes)) setGuestNotes(d.notes)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])

  // guided tour: the camera visits each station with a caption; any input of the visitor ends it
  const [tour, setTour] = useState<number | null>(null)
  const tourTo = useCallback((i: number) => {
    if (i >= TOUR.length) {
      setTour(null)
      return
    }
    setTour(i)
    setView(TOUR[i].view)
  }, [])
  useEffect(() => {
    if (tour === null) return
    const id = window.setTimeout(() => tourTo(tour + 1), TOUR_STEP_MS)
    // keys end the tour, except Tab and the keys pressed on its own Skip/Stop buttons
    const stop = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Shift') return
      if (e.target instanceof Element && e.target.closest('[data-tour-bar]')) return
      setTour(null)
    }
    window.addEventListener('keydown', stop)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', stop)
    }
  }, [tour, tourTo])
  // header and nav buttons: a visitor picking a view takes over from the tour
  const go = useCallback((next: ViewId) => {
    setTour(null)
    setView(next)
  }, [])

  // Enter (or a tap on the screen) on a TV item: menu → pong / video list, video list → play it on the TV
  const tvPick = useCallback(
    (index: number) => {
      if (tvMode === 'menu') {
        setTvMode((['game', 'breakout', 'videos'] as const)[index])
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
      setTvSel(2)
    } else if (tvMode === 'game' || tvMode === 'breakout') {
      setTvMode('menu')
      setTvSel(tvMode === 'game' ? 0 : 1)
    } else closeTv()
  }, [tvMode, closeTv])

  // the player takes keyboard focus when it loads or is clicked; take it back so Esc and the arrows keep driving the TV
  const tvVideo = view === 'tv' && tvMode === 'youtube'
  const deskYoutube = view === 'projects' && deskMedia === 'youtube'
  useEffect(() => {
    if (!tvVideo && !deskYoutube) return
    const reclaim = () =>
      window.setTimeout(() => {
        if (document.activeElement instanceof HTMLIFrameElement) {
          document.activeElement.blur()
          window.focus()
        }
      }, 0)
    window.addEventListener('blur', reclaim)
    return () => window.removeEventListener('blur', reclaim)
  }, [tvVideo, deskYoutube])

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
  const videoPlaying = tvVideo || (view === 'projects' && deskMedia !== 'none') || Boolean(project)
  useEffect(() => {
    if (heard && musicOn && !videoPlaying) startMusic()
    else stopMusic()
  }, [heard, musicOn, videoPlaying])
  useEffect(() => stopMusic, [])
  const toggleMusic = useCallback(() => {
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
  }, [])

  // keyboard shortcuts: never while typing, behind a modal, or on the computer's own desktop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      const typing = t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      const modal = Boolean(project || certificate || signing || helpOpen || (view === 'projects' && screensOn))
      // the help dialog is the one thing that may open from the desktop
      const action = keyAction(e, { typing, modal: modal && !(e.key === '?' && !helpOpen && !project && !certificate && !signing) })
      if (!action) return
      e.preventDefault()
      switch (action.type) {
        case 'help':
          setHelpOpen(true)
          break
        case 'music':
          toggleMusic()
          break
        case 'tour':
          if (tour === null) tourTo(0)
          else setTour(null)
          break
        case 'night':
          togglePhase()
          break
        case 'room':
          go('room')
          break
        case 'station':
          go(action.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [project, certificate, signing, helpOpen, view, screensOn, tour, tourTo, go, toggleMusic])

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
      if (signing || helpOpen) return
      // the desktop handles its own keys (Esc closes its top window, then leaves)
      if (view === 'projects' && !project && !certificate) return
      if (view === 'tv' && !project && !certificate) {
        const count = tvMode === 'menu' ? 3 : tvMode === 'videos' ? TV_PICKS.length : 0
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
    closeAll,
    navigate,
    signing,
    helpOpen,
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
  const panel = tour !== null || station?.id === 'projects' || station?.id === 'experience' ? null : station
  const panelOpen = Boolean(panel) && !panelHidden
  const tvLabel =
    tvMode === 'menu'
      ? ['Pong', 'Breakout', 'YouTube'][tvSel]
      : tvMode === 'videos'
        ? TV_PICKS[tvSel]?.label
        : tvMode === 'game'
          ? 'Pong is playing'
          : tvMode === 'breakout'
            ? 'Breakout is playing'
            : 'Video is playing'

  if (!webgl) {
    return (
      <div className="section-dark grid min-h-[100svh] place-items-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-3xl font-black uppercase">3D Studio needs WebGL</h1>
          <p className="mt-3 text-sm text-foreground-muted">
            Your browser has WebGL turned off, so the room can&apos;t render. Turn on hardware
            acceleration in its settings and reload, or try Chrome or Edge. The regular portfolio
            works everywhere.
          </p>
          <p className="mt-2 font-mono text-[10px] text-foreground-subtle">{webglReason}</p>
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
      <div
        className="absolute inset-0"
        onPointerDownCapture={() => setTour(null)}
        onWheelCapture={() => setTour(null)}
      >
        <StudioScene
          view={view}
          reduced={reducedMotion}
          // supersampled to at least 1.5x for crisp edges; phones get shadows too, on a smaller map
          shadowSize={coarse ? 1024 : 4096}
          quality={quality}
          onQuality={setQuality}
          autoQuality={autoQuality}
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
          onLook={setView}
          // from the room a frame first flies the camera to the wall; at the wall it opens that certificate
          onCert={(id) =>
            view === 'certificates'
              ? setCertificate(CERTIFICATES_DATA.find((c) => c.id === id) ?? null)
              : go('certificates')
          }
          guestNotes={guestNotes}
          onSign={() => (view === 'guestbook' ? setSigning(true) : go('guestbook'))}
        />
      </div>

      {/* screen overlays: laid out at SCREEN_PX, then mapped onto the 3D screen every frame by Room.tsx */}
      {/* off while Details is open: the gallery plays the same video, and two soundtracks would overlap */}
      {view === 'projects' && (
        <div
          ref={(el) => {
            deskOverlay.el = el
          }}
          style={{ width: SCREEN_PX.w, height: SCREEN_PX.h }}
          className="invisible absolute left-0 top-0 z-10 origin-top-left overflow-hidden"
        >
          {!screensOn ? (
            <PowerScreen
              enabled={!project && !certificate && !signing && !helpOpen}
              touch={coarse}
              onOn={() => setScreensOn(true)}
              onExit={() => setView('room')}
            />
          ) : (
          <Desktop
            enabled={!project && !certificate && !signing && !helpOpen}
            touch={coarse}
            paused={Boolean(project)}
            intent={deskIntent}
            termData={termData}
            onExit={() => setView('room')}
            onShutdown={() => {
              setScreensOn(false)
              setView('room')
            }}
            onDetails={(id) => setProject(PROJECTS.find((p) => p.id === id) ?? null)}
            onMedia={setDeskMedia}
          />
          )}
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
                className="flex items-center gap-2 rounded-full border border-white/10 glass-dark px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] transition-colors hover:border-white/30 hover:text-[#eef2f3]"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Site
              </Link>
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.28em] text-[#5f7186] sm:block">
                Adriel&apos;s 3D studio
              </span>
            </div>

            <nav
              aria-label="Rooms"
              className="pointer-events-auto hidden items-center gap-1 rounded-full border border-white/10 glass-dark p-1 md:flex"
            >
              <button
                onClick={() => go('room')}
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
                  onClick={() => go(item.id)}
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
                onClick={() => (tour === null ? tourTo(0) : setTour(null))}
                aria-pressed={tour !== null}
                aria-label={tour === null ? 'Take the tour' : 'Stop the tour'}
                className="flex h-[30px] items-center gap-1.5 rounded-full border border-[#3fb0b7]/40 glass-dark px-2.5 font-mono text-[11px] uppercase tracking-wider text-[#3fb0b7] transition-colors hover:border-[#3fb0b7] hover:text-[#eef2f3]"
              >
                <Route className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tour === null ? 'Take the tour' : 'Stop tour'}</span>
              </button>
              <button
                onClick={() => setHelpOpen(true)}
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts (?)"
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white/10 glass-dark font-mono text-[12px] font-bold text-[#a7b0bd] transition-colors hover:text-[#eef2f3]"
              >
                ?
              </button>
              <button
                onClick={toggleHd}
                aria-pressed={quality.hd}
                aria-label={quality.hd ? 'HD graphics on: switch to faster mode' : 'Faster mode: switch to HD graphics'}
                title={quality.hd ? 'HD graphics on' : 'Faster mode'}
                className={`flex h-[30px] items-center rounded-full border glass-dark px-2.5 font-mono text-[11px] font-bold tracking-[0.12em] transition-colors ${
                  quality.hd ? 'border-[#3fb0b7]/50 text-[#3fb0b7]' : 'border-white/10 text-[#a7b0bd] hover:text-[#eef2f3]'
                }`}
              >
                HD
              </button>
              <button
                onClick={toggleMusic}
                aria-pressed={musicOn}
                aria-label={musicOn ? 'Mute the room music' : 'Play the room music'}
                title={musicOn ? 'Music on' : 'Music off'}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white/10 glass-dark text-[#a7b0bd] transition-colors hover:border-white/30 hover:text-[#eef2f3]"
              >
                {musicOn ? <Music className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => (view === 'room' && tour === null ? navigate('/') : go('room'))}
                className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 glass-dark px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] transition-colors hover:border-white/30 hover:text-[#eef2f3]"
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
              onClick={() => go('room')}
              aria-pressed={inRoom}
              className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider ${
                inRoom
                  ? 'border-[#3fb0b7]/60 bg-[#3fb0b7]/15 text-[#3fb0b7]'
                  : 'border-white/10 glass-dark text-[#8fa0ad]'
              }`}
            >
              Room
            </button>
            {STATIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                aria-pressed={view === item.id}
                className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider ${
                  view === item.id
                    ? 'border-[#3fb0b7]/60 bg-[#3fb0b7]/15 text-[#3fb0b7]'
                    : 'border-white/10 glass-dark text-[#8fa0ad]'
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
              {desktop && panel && !panelHidden ? (
                <motion.div
                  key={panel.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full"
                >
                  <button
                    onClick={() => setPanelHidden(true)}
                    aria-label="Hide the panel for a full view"
                    title="Hide panel"
                    className="pointer-events-auto absolute -left-11 top-1/2 flex h-10 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 glass-dark text-[#a7b0bd] transition-colors hover:border-white/35 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
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
            {tour !== null ? (
              <div
                data-tour-bar
                className="pointer-events-auto flex max-w-xl items-center gap-2 rounded-2xl border border-[#3fb0b7]/30 glass-dark py-1.5 pl-4 pr-1.5">
                <p className="min-w-0 flex-1 text-xs text-[#dbe5ea]">
                  <span className="mr-2 font-mono text-[10px] text-[#3fb0b7]">
                    {tour + 1}/{TOUR.length}
                  </span>
                  {TOUR[tour].caption}
                </p>
                <button
                  onClick={() => tourTo(tour + 1)}
                  className="shrink-0 rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] transition-colors hover:border-white/30 hover:text-[#eef2f3]"
                >
                  Skip
                </button>
                <button
                  onClick={() => setTour(null)}
                  className="shrink-0 rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] transition-colors hover:border-white/30 hover:text-[#eef2f3]"
                >
                  Stop
                </button>
              </div>
            ) : view === 'tv' ? (
              <div className="flex items-center gap-2">
                {tvMode !== 'menu' && (
                  <button
                    onClick={tvBack}
                    className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 glass-dark px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] transition-colors hover:border-white/30 hover:text-[#eef2f3]"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                )}
                <p className="rounded-full border border-white/10 glass-dark px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad]">
                  {tvMode === 'game' || tvMode === 'breakout'
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
              <p className="rounded-full border border-white/10 glass-dark px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad]">
                {!screensOn
                  ? coarse
                    ? 'The monitor is off · tap it to power on'
                    : 'The monitor is off · Enter powers it on · Esc leaves'
                  : coarse
                    ? 'Tap an icon to open it'
                    : 'Double-click an icon · Esc closes the top window'}
              </p>
            ) : view === 'guestbook' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSigning(true)}
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-[#3fb0b7]/50 bg-[#3fb0b7]/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#dbe5ea] backdrop-blur transition-colors hover:bg-[#3fb0b7]/35"
                >
                  Sign the guest book
                </button>
                <p className="hidden rounded-full border border-white/10 glass-dark px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad] sm:block">
                  {guestNotes.length
                    ? `${guestNotes.length} ${guestNotes.length === 1 ? 'note' : 'notes'} on the board · click it to add yours`
                    : 'No notes yet · be the first'}
                </p>
              </div>
            ) : view === 'billiards' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={rerack}
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 glass-dark px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] transition-colors hover:border-white/30 hover:text-[#eef2f3]"
                >
                  Rerack
                </button>
                <p
                  aria-live="polite"
                  className="rounded-full border border-[#3fb0b7]/30 glass-dark px-3 py-1.5 font-mono text-[11px] text-[#dbe5ea]"
                >
                  {score.potted}/{table.balls.length - 1} potted · {score.shots}{' '}
                  {score.shots === 1 ? 'shot' : 'shots'}
                </p>
                <p className="hidden rounded-full border border-white/10 glass-dark px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad] sm:block">
                  {coarse
                    ? 'Tap the felt to shoot · farther is harder'
                    : 'Aim with the pointer · click to shoot · farther is harder'}
                </p>
              </div>
            ) : view === 'terminal' && !screensOn ? (
              <button
                onClick={() => setScreensOn(true)}
                className="pointer-events-auto rounded-full border border-[#3fb0b7]/50 bg-[#3fb0b7]/20 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#dbe5ea] backdrop-blur hover:bg-[#3fb0b7]/35"
              >
                The monitors are off · power on
              </button>
            ) : view === 'terminal' ? (
              <form
                className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-full border border-[#3fb0b7]/40 glass-dark px-4 py-1.5"
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
                  placeholder="type help (or hint, for the secrets)"
                  aria-label="Terminal command"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-[#dbe5ea] outline-none placeholder:text-[#5f7186]"
                />
              </form>
            ) : (
              <p className="rounded-full border border-white/10 glass-dark px-4 py-1.5 text-center font-mono text-[11px] text-[#8fa0ad]">
                Drag to look around · Click anything in the room
              </p>
            )}
          </div>

          <AnimatePresence>
            {hello && tour === null && view === 'room' && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 bottom-16 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-xl border border-[#3fb0b7]/30 glass-dark px-4 py-2 text-center text-xs text-[#dbe5ea]"
              >
                Hi, I&apos;m Adriel. The room is yours — drag it, click through it.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* a tab to bring a hidden panel back */}
      {panel && panelHidden && (
        <button
          onClick={() => setPanelHidden(false)}
          aria-label="Show the panel"
          title="Show panel"
          className="absolute right-3 top-1/2 z-30 flex h-11 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 glass-dark text-[#a7b0bd] transition-colors hover:border-white/35 hover:text-white md:right-4"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* mobile sheet */}
      <AnimatePresence mode="wait">
        {!desktop && panel && !panelHidden ? (
          <motion.div
            key={panel.id}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-2 bottom-2 z-30 h-[52svh] md:hidden"
          >
            <button
              onClick={() => setPanelHidden(true)}
              aria-label="Hide the panel for a full view"
              className="absolute -top-11 right-2 z-10 flex h-9 w-10 items-center justify-center rounded-full border border-white/15 glass-dark text-[#a7b0bd]"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
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
          className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-md border glass-dark px-2.5 py-1.5 font-mono text-[11px] text-[#dbe5ea]"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.label}
          <span className="ml-2 text-[#3fb0b7]">click</span>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {tour !== null
          ? `Tour, stop ${tour + 1} of ${TOUR.length}: ${TOUR[tour].caption}`
          : view === 'guestbook'
          ? `Guest book: ${guestNotes.map((n) => `${n.name}: ${n.message}`).join('; ') || 'no notes yet'}`
          : view === 'billiards'
          ? 'Pool table: aim and click the felt to shoot'
          : view === 'tv'
            ? `TV: ${tvLabel}`
            : view === 'projects'
              ? 'Computer: the AdrielOS desktop. Double-click an icon to open it.'
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

      <ProjectGalleryModal project={project} onClose={closeProject} glass />
      <CertificateModal certificate={certificate} onClose={closeCertificate} glass />
      {helpOpen && <Help onClose={() => setHelpOpen(false)} />}
      {signing && (
        <GuestForm
          onClose={() => setSigning(false)}
          onPosted={(note) => {
            setGuestNotes((prev) => [note, ...prev].slice(0, 8))
            setSigning(false)
          }}
        />
      )}
    </div>
  )
}

export default memo(StudioPage)
