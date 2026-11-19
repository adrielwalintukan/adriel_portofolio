import { useEffect, useState, type ReactNode } from 'react'
import { activeId, type Win, type WinState } from './windows'

const clock = () =>
  new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit' })

/** AdrielOS logo: a teal "A" on a rounded square. */
export const Logo = ({ size = 22 }: { size?: number }) => (
  <span
    style={{ width: size, height: size, fontSize: size * 0.62 }}
    className="flex items-center justify-center rounded-md bg-[#3fb0b7] font-display font-black leading-none text-[#06202a]"
  >
    A
  </span>
)

type Props = {
  state: WinState
  iconOf: (w: Win) => ReactNode
  startOpen: boolean
  onStart: () => void
  onTask: (w: Win) => void
}

/** The bottom bar: Start, one button per open window, and the clock in Manado (WITA). */
export function Taskbar({ state, iconOf, startOpen, onStart, onTask }: Props) {
  const [time, setTime] = useState(clock)
  useEffect(() => {
    const id = window.setInterval(() => setTime(clock()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  const top = activeId(state)
  return (
    <div className="absolute inset-x-0 bottom-0 z-[9000] flex h-10 items-center gap-1 border-t border-white/10 bg-[#0a101c]/95 px-1.5">
      <button
        onClick={onStart}
        aria-label="Start"
        aria-expanded={startOpen}
        className={`flex h-8 items-center gap-1.5 rounded-md px-2 hover:bg-white/10 ${startOpen ? 'bg-white/10' : ''}`}
      >
        <Logo />
      </button>
      <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
        {state.wins.map((w) => (
          <button
            key={w.id}
            onClick={() => onTask(w)}
            className={`flex h-8 max-w-[150px] min-w-0 items-center gap-1.5 rounded-md border px-2 font-mono text-[11px] ${
              w.id === top ? 'border-[#3fb0b7]/60 bg-[#3fb0b7]/15 text-white' : 'border-white/10 text-[#a7b0bd] hover:bg-white/5'
            } ${w.min ? 'opacity-60' : ''}`}
          >
            <span className="shrink-0 text-[#3fb0b7]">{iconOf(w)}</span>
            <span className="truncate">{w.title}</span>
          </button>
        ))}
      </div>
      <p className="px-2 text-right font-mono text-[11px] leading-3 text-[#a7b0bd]">
        {time}
        <span className="block text-[9px] text-[#5f7186]">WITA</span>
      </p>
    </div>
  )
}
