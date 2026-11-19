import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { SHORTCUTS } from './keymap'

/** The shortcut list, as a glass dialog over the room. Esc or the close button dismisses it. */
export function Help({ onClose }: { onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/25 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border glass-dark p-5"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#3fb0b7]">Keyboard</p>
            <h2 id="help-title" className="mt-1 font-display text-2xl font-black uppercase text-[#eef2f3]">
              Shortcuts
            </h2>
          </div>
          <button
            ref={close}
            onClick={onClose}
            aria-label="Close shortcuts"
            className="rounded-full border border-white/10 p-1.5 text-[#a7b0bd] hover:border-white/30 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <dl className="mt-4 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4 text-sm">
              <dt>
                <kbd className="rounded border border-white/20 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-[#dbe5ea]">{s.keys}</kbd>
              </dt>
              <dd className="text-right text-[#a7b0bd]">{s.does}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
