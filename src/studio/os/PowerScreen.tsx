import { useEffect, useState } from 'react'
import { Power } from 'lucide-react'
import { Logo } from './Taskbar'

/** The monitor while it is off: black, with a power button. Enter (or a tap) boots AdrielOS. */
export function PowerScreen({ enabled, touch, onOn, onExit }: { enabled: boolean; touch: boolean; onOn: () => void; onExit: () => void }) {
  const [booting, setBooting] = useState(false)
  useEffect(() => {
    if (!booting) return
    const timer = window.setTimeout(onOn, 1500)
    return () => window.clearTimeout(timer)
  }, [booting, onOn])
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
      } else if (e.key === 'Enter' && !booting) {
        e.preventDefault()
        setBooting(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, booting, onExit])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#030508] text-[#8fa0ad]">
      {booting ? (
        <>
          <Logo size={44} />
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#dbe5ea]">AdrielOS</p>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full origin-left animate-[boot_1.4s_ease-out_forwards] bg-[#3fb0b7]" />
          </div>
        </>
      ) : (
        <button
          onClick={() => setBooting(true)}
          aria-label="Power on"
          className="flex flex-col items-center gap-3 rounded-xl p-6 outline-none hover:text-[#dbe5ea] focus-visible:text-[#dbe5ea]"
        >
          <Power className="h-14 w-14 animate-pulse text-[#3fb0b7]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em]">{touch ? 'Tap to power on' : 'Press Enter to power on'}</span>
        </button>
      )}
    </div>
  )
}
