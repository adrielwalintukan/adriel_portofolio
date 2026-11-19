import { useRef, type ReactNode } from 'react'
import { Maximize2, Minimize2, Minus, X } from 'lucide-react'
import { AREA, type Win } from './windows'

type Props = {
  win: Win
  active: boolean
  icon: ReactNode
  children: ReactNode
  onFocus: () => void
  onClose: () => void
  onMin: () => void
  onMax: () => void
  onMove: (x: number, y: number) => void
}

/** A draggable window with the usual title bar. Maximized windows fill the desktop above the taskbar. */
export function Window({ win, active, icon, children, onFocus, onClose, onMin, onMax, onMove }: Props) {
  const drag = useRef<{ px: number; py: number; x: number; y: number; scale: number } | null>(null)
  const frame = win.max ? { left: 0, top: 0, width: AREA.w, height: AREA.h } : { left: win.x, top: win.y, width: win.w, height: win.h }
  const btn = 'flex h-6 w-7 items-center justify-center rounded text-[#a7b0bd] hover:bg-white/10 hover:text-white'
  return (
    <div
      role="dialog"
      aria-label={win.title}
      onPointerDown={onFocus}
      style={{ ...frame, zIndex: win.z, display: win.min ? 'none' : undefined }}
      className={`absolute flex flex-col overflow-hidden border bg-[#0b1220] shadow-[0_12px_40px_rgba(0,0,0,0.55)] ${
        win.max ? 'rounded-none' : 'rounded-lg'
      } ${active ? 'border-[#3fb0b7]/60' : 'border-white/15'}`}
    >
      <header
        className="flex h-8 shrink-0 cursor-default select-none items-center gap-2 border-b border-white/10 bg-[#111a2b] pl-2.5 pr-1"
        onDoubleClick={onMax}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button') || win.max) return
          e.currentTarget.setPointerCapture(e.pointerId)
          // the screen is mapped onto the monitor, so a pointer pixel is not a desktop pixel: measure the ratio
          const root = e.currentTarget.closest('[data-desktop]')?.getBoundingClientRect()
          drag.current = { px: e.clientX, py: e.clientY, x: win.x, y: win.y, scale: root && root.width ? AREA.w / root.width : 1 }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (d) onMove(d.x + (e.clientX - d.px) * d.scale, d.y + (e.clientY - d.py) * d.scale)
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <span className="text-[#3fb0b7]">{icon}</span>
        <p className="min-w-0 flex-1 truncate font-mono text-[12px] text-[#dbe5ea]">{win.title}</p>
        <button aria-label="Minimize" onClick={onMin} className={btn}>
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button aria-label={win.max ? 'Restore' : 'Maximize'} onClick={onMax} className={btn}>
          {win.max ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
        </button>
        <button aria-label="Close" onClick={onClose} className={`${btn} hover:!bg-[#c0392b]`}>
          <X className="h-3.5 w-3.5" />
        </button>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
