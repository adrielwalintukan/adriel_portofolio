import { useRef, useState, type KeyboardEvent } from 'react'
import { MESSAGE_MAX, NAME_MAX, type Note } from '@/lib/guestbook'

/** The guest book's sign form: name and a short note, posted to /api/guestbook. */
export function GuestForm({ onClose, onPosted }: { onClose: () => void; onPosted: (note: Note) => void }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const form = useRef<HTMLFormElement>(null)

  const send = async () => {
    setSending(true)
    setError('')
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message, website }),
    }).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { note?: Note; error?: string } | null
    setSending(false)
    if (res?.ok && data?.note) onPosted(data.note)
    else setError(data?.error ?? 'The guest book is offline.')
  }

  // keep Tab inside the dialog, and Esc closes it
  const onKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Escape') onClose()
    if (e.key !== 'Tab' || !form.current) return
    const items = [...form.current.querySelectorAll<HTMLElement>('input:not([tabindex="-1"]), textarea, button')]
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const field =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#eef2f3] outline-none placeholder:text-[#5f7186] focus:border-[#3fb0b7]'
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/25 px-4" onClick={onClose}>
      <form
        ref={form}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        onSubmit={(e) => {
          e.preventDefault()
          if (!sending) void send()
        }}
        className="w-full max-w-sm rounded-2xl border glass-dark p-5"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#3fb0b7]">The cork board</p>
        <h2 id="guest-title" className="mt-1 font-display text-2xl font-black uppercase text-[#eef2f3]">
          Sign the guest book
        </h2>
        <label className="mt-4 block font-mono text-[11px] text-[#8fa0ad]">
          Name
          <input
            autoFocus
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            className={`${field} mt-1`}
            placeholder="Your name"
            required
          />
        </label>
        <label className="mt-3 block font-mono text-[11px] text-[#8fa0ad]">
          <span className="flex justify-between">
            Note
            <span aria-hidden="true">
              {message.length}/{MESSAGE_MAX}
            </span>
          </span>
          <textarea
            value={message}
            maxLength={MESSAGE_MAX}
            onChange={(e) => setMessage(e.target.value)}
            className={`${field} mt-1 h-20 resize-none`}
            placeholder="Say hi, leave a tip, anything friendly"
            required
          />
        </label>
        {/* hidden from people; bots fill it in and get turned away */}
        <input
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          name="website"
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />
        <p role="alert" className="mt-2 min-h-4 text-xs text-[#e08a7a]">
          {error}
        </p>
        <p className="mt-1 text-[11px] text-[#5f7186]">Notes show up for everyone straight away.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#a7b0bd] hover:border-white/30 hover:text-[#eef2f3]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-[#3fb0b7] px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#06202a] hover:bg-[#5cc4ca] disabled:opacity-60"
          >
            {sending ? 'Pinning…' : 'Pin it'}
          </button>
        </div>
      </form>
    </div>
  )
}
