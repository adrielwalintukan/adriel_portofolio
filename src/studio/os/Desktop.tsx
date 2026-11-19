import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { FileText, Folder, Globe, Image as ImageIcon, Play, Power, TerminalSquare, Trash2 } from 'lucide-react'
import { PROJECTS, SOCIAL_LINKS } from '../../lib/constants.ts'
import type { TermData } from '../terminal'
import { buildFs, type AppId } from './fs'
import type { AppProps, DesktopCtx } from './ctx'
import { DESKTOP_ICONS, type DesktopIconId } from './icons'
import { Logo, Taskbar } from './Taskbar'
import { Window } from './Window'
import { activeId, close, focus, initial, minimize, move, open, retarget, toggleMax, type Win, type WinArg, type WinState } from './windows'
import { Browser } from './apps/Browser'
import { Explorer } from './apps/Explorer'
import { MediaPlayer } from './apps/MediaPlayer'
import { Notepad } from './apps/Notepad'
import { Photos } from './apps/Photos'
import { TerminalApp } from './apps/TerminalApp'

export type Intent = { id: number; project: string } | null
// survives the desktop unmounting, so coming back later never replays a folder the terminal already opened
let lastIntent = 0
type Props = {
  /** keys are live only while no modal is on top */
  enabled: boolean
  touch: boolean
  /** a modal with its own video is open: this desktop's media goes quiet */
  paused: boolean
  intent: Intent
  termData: TermData
  onExit: () => void
  /** AdrielOS "Shut down": the monitors go dark */
  onShutdown: () => void
  onDetails: (projectId: string) => void
  onMedia: (kind: 'none' | 'video' | 'youtube') => void
}

const APP_ICON: Record<AppId, ReactNode> = {
  explorer: <Folder className="h-3.5 w-3.5" />,
  photos: <ImageIcon className="h-3.5 w-3.5" />,
  media: <Play className="h-3.5 w-3.5" />,
  notepad: <FileText className="h-3.5 w-3.5" />,
  terminal: <TerminalSquare className="h-3.5 w-3.5" />,
  browser: <Globe className="h-3.5 w-3.5" />,
}
const ICON_ART: Record<DesktopIconId, ReactNode> = {
  explorer: <Folder className="h-8 w-8 text-[#d9a44a]" />,
  photos: <ImageIcon className="h-8 w-8 text-[#8fcfc9]" />,
  projects: <Folder className="h-8 w-8 text-[#3fb0b7]" />,
  about: <FileText className="h-8 w-8 text-[#dbe5ea]" />,
  terminal: <TerminalSquare className="h-8 w-8 text-[#7fd6b8]" />,
  bin: <Trash2 className="h-8 w-8 text-[#a7b0bd]" />,
}

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')

/** AdrielOS: icons, draggable windows, a taskbar and a Start menu, laid out at the screen's 960 x 532. */
export function Desktop({ enabled, touch, paused, intent, termData, onExit, onShutdown, onDetails, onMedia }: Props) {
  const fs = useMemo(() => buildFs(), [])
  const [state, setState] = useState<WinState>(initial)
  const [startOpen, setStartOpen] = useState(false)
  const [sel, setSel] = useState(0)

  const openApp = useCallback(
    (app: AppId, title: string, arg?: WinArg) => {
      setStartOpen(false)
      setState((s) => {
        // one player only: a second video replaces the first instead of playing over it
        const media = app === 'media' ? s.wins.find((w) => w.app === 'media') : undefined
        return media ? retarget(s, media.id, title, arg) : open(s, app, title, arg, touch)
      })
    },
    [touch]
  )
  const ctx = useMemo<DesktopCtx>(
    () => ({
      fs,
      open: openApp,
      retarget: (id, title, arg) => setState((s) => retarget(s, id, title, arg)),
      close: (id) => setState((s) => close(s, id)),
      details: onDetails,
      touch,
    }),
    [fs, openApp, onDetails, touch]
  )

  const openIcon = (id: DesktopIconId) => {
    if (id === 'explorer') openApp('explorer', 'File Explorer', { path: [] })
    else if (id === 'photos') openApp('photos', 'Photos')
    else if (id === 'projects') openApp('explorer', 'Projects', { path: ['Projects'] })
    else if (id === 'about') openApp('notepad', 'about-me.txt', { path: ['about-me.txt'] })
    else if (id === 'terminal') openApp('terminal', 'Terminal')
    else openApp('explorer', 'Recycle Bin', { path: ['Recycle Bin'] })
  }

  // the terminal's `open <n>` asks for a project folder
  useEffect(() => {
    if (!intent || intent.id === lastIntent) return
    // a timer, so the window opens after the effect and the intent is only marked used once it fires
    const timer = window.setTimeout(() => {
      lastIntent = intent.id
      openApp('explorer', intent.project, { path: ['Projects', intent.project] })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [intent, openApp])

  // tell the room whether a video is playing, so the music can duck
  const playing = paused ? undefined : state.wins.find((w) => w.app === 'media' && !w.min)
  useEffect(() => {
    onMedia(playing ? (playing.arg?.kind === 'youtube' ? 'youtube' : 'video') : 'none')
  }, [playing, onMedia])

  // Esc closes the top window, then the Start menu, then leaves the computer; arrows + Enter drive the icons
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const top = activeId(state)
      if (e.key === 'Escape') {
        e.preventDefault()
        if (startOpen) setStartOpen(false)
        else if (top !== null) setState((s) => close(s, top))
        else onExit()
        return
      }
      if (state.wins.length || startOpen || typing(e.target)) return
      // keys aimed at something else on the page (Site link, Start button) keep their own meaning;
      // Enter on a focused icon opens that icon
      const target = e.target instanceof Element ? e.target : null
      const iconEl = target?.closest<HTMLElement>('[data-icon]')
      if (target && target !== document.body && !iconEl) return
      const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key]
      if (step) {
        e.preventDefault()
        setSel((i) => (i + step + DESKTOP_ICONS.length) % DESKTOP_ICONS.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        openIcon(iconEl ? (iconEl.dataset.icon as DesktopIconId) : DESKTOP_ICONS[sel].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, state, startOpen, sel, onExit])

  const render = (w: Win) => {
    // a minimized or silenced player is unmounted, which also stops its sound
    if (w.app === 'media' && (w.min || paused)) return null
    const props: AppProps = { win: w, ctx }
    switch (w.app) {
      case 'explorer':
        return <Explorer {...props} />
      case 'photos':
        return <Photos {...props} />
      case 'media':
        return <MediaPlayer {...props} />
      case 'notepad':
        return <Notepad {...props} />
      case 'terminal':
        return <TerminalApp {...props} data={termData} />
      case 'browser':
        return <Browser {...props} />
    }
  }

  const featured = useMemo(() => PROJECTS.filter((p) => p.featured && !p.inDevelopment).slice(0, 4), [])
  const active = activeId(state)
  const menuItem = 'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-[11px] text-[#dbe5ea] hover:bg-white/10'
  return (
    <div
      data-desktop
      className="relative h-full w-full select-none overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 20% 15%, rgba(63,176,183,0.28), transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(180,105,58,0.2), transparent 50%), linear-gradient(135deg, #0b1626, #14283a)',
      }}
      onPointerDown={() => startOpen && setStartOpen(false)}
    >
      <div className="absolute left-3 top-3 grid grid-cols-2 gap-1">
        {DESKTOP_ICONS.map((icon, i) => (
          <button
            key={icon.id}
            onClick={() => (touch ? openIcon(icon.id) : setSel(i))}
            onDoubleClick={() => openIcon(icon.id)}
            data-icon={icon.id}
            aria-label={icon.label}
            className={`flex w-[86px] flex-col items-center gap-1 rounded-md border p-1.5 text-center ${
              i === sel ? 'border-[#3fb0b7]/70 bg-[#3fb0b7]/15' : 'border-transparent hover:bg-white/5'
            }`}
          >
            {ICON_ART[icon.id]}
            <span className="font-mono text-[10px] leading-3 text-[#eef2f3]">{icon.label}</span>
          </button>
        ))}
      </div>

      {state.wins.map((w) => (
        <Window
          key={w.id}
          win={w}
          active={w.id === active}
          icon={APP_ICON[w.app]}
          onFocus={() => setState((s) => (activeId(s) === w.id ? s : focus(s, w.id)))}
          onClose={() => setState((s) => close(s, w.id))}
          onMin={() => setState((s) => minimize(s, w.id))}
          onMax={() => setState((s) => toggleMax(s, w.id))}
          onMove={(x, y) => setState((s) => move(s, w.id, x, y))}
        >
          {render(w)}
        </Window>
      ))}

      {startOpen && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-11 left-1.5 z-[9500] w-60 rounded-lg border glass-dark p-1.5"
        >
          <p className="flex items-center gap-2 px-2 pb-1 pt-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#5f7186]">
            <Logo size={16} /> AdrielOS
          </p>
          {DESKTOP_ICONS.filter((i) => i.id !== 'projects').map((icon) => (
            <button key={icon.id} className={menuItem} onClick={() => openIcon(icon.id)}>
              <span className="scale-[0.6]">{ICON_ART[icon.id]}</span>
              {icon.label}
            </button>
          ))}
          <button
            className={menuItem}
            onClick={() => openApp('browser', 'GitHub', { src: SOCIAL_LINKS[0].url, title: SOCIAL_LINKS[0].name })}
          >
            <Globe className="mx-1 h-4 w-4 text-[#3fb0b7]" /> Browser
          </button>
          {featured.length > 0 && <p className="px-2 pb-0.5 pt-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-[#5f7186]">Featured</p>}
          {featured.map((p) => (
            <button key={p.id} className={menuItem} onClick={() => openApp('explorer', p.title, { path: ['Projects', p.title] })}>
              <Folder className="mx-1 h-4 w-4 text-[#d9a44a]" /> <span className="truncate">{p.title}</span>
            </button>
          ))}
          <button className={`${menuItem} mt-1 border-t border-white/10`} onClick={onShutdown}>
            <Power className="mx-1 h-4 w-4 text-[#e08a7a]" /> Shut down
          </button>
        </div>
      )}

      <Taskbar
        state={state}
        iconOf={(w) => APP_ICON[w.app]}
        startOpen={startOpen}
        onStart={() => setStartOpen((o) => !o)}
        onTask={(w) =>
          setState((s) => (w.min || activeId(s) !== w.id ? focus(s, w.id) : minimize(s, w.id)))
        }
      />
    </div>
  )
}
