import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { CONTACT_INFO, PROJECTS, SELECTED_PROJECT_IDS, SKILLS_DATA, SOCIAL_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'

type Line = { id: number; kind: 'in' | 'out' | 'ai' | 'err'; text: string }
type Turn = { role: 'user' | 'model'; text: string }

const SUGGESTIONS = ['What has he built with AI?', 'Is he open to internships?', 'Apa saja tech stack-nya?']
const HELP = `Ask anything about Adriel in plain words (English or Indonesian), or type a command:
  projects   featured work
  skills     tech stack
  contact    how to reach him
  clear      clear the screen
  exit       close the terminal`

const COMMANDS: Record<string, () => string> = {
  help: () => HELP,
  projects: () =>
    SELECTED_PROJECT_IDS.map((id) => PROJECTS.find((p) => p.id === id))
      .filter((p) => !!p)
      .map((p, i) => `  0${i + 1}  ${p.title}  [${p.category}]`)
      .join('\n') + '\n  More with screenshots: scroll to Selected Work.',
  skills: () => SKILLS_DATA.map((g) => `  ${g.category}: ${g.skills.map((s) => s.name).join(', ')}`).join('\n'),
  contact: () =>
    [`  Email     ${CONTACT_INFO.email}`, ...SOCIAL_LINKS.filter((s) => s.name !== 'Email').map((s) => `  ${s.name.padEnd(9)} ${s.url}`)].join('\n'),
}

const ERRORS: Record<string, string> = {
  rate_limited: 'Too many questions in a short time. Try again in a few minutes.',
  not_configured: `The AI is offline right now. Commands still work, or email ${CONTACT_INFO.email}.`,
}

let nextId = 0
const line = (kind: Line['kind'], text: string): Line => ({ id: nextId++, kind, text })

/** Reveals an AI answer character by character; instant for reduced motion. */
function Typed({ text, onTick }: { text: string; onTick: () => void }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? text.length : 0)
  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) clearInterval(id)
        return Math.min(text.length, n + 3)
      })
      onTick()
    }, 16)
    return () => clearInterval(id)
  }, [text, reduce, onTick])
  return <>{text.slice(0, shown)}</>
}

/**
 * "Ask Adriel" terminal: local commands plus free questions answered by /api/ask (Gemini,
 * grounded in the portfolio data). Lazy-loaded the first time the launcher is clicked.
 */
export default function AskAdrielTerminal({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>(() => [
    line('out', "Hi! I'm an AI that knows Adriel's portfolio. Ask about his projects, skills or availability."),
    line('out', 'Type help for commands.'),
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const history = useRef<Turn[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollDown = useCallback(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }), [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useEffect(() => {
    scrollDown()
  }, [lines, busy, scrollDown])

  async function run(raw: string) {
    const text = raw.trim()
    if (!text || busy) return
    setInput('')
    const cmd = text.toLowerCase()
    if (cmd === 'clear') return setLines([])
    if (cmd === 'exit') return onClose()
    setLines((l) => [...l, line('in', text)])
    if (COMMANDS[cmd]) return setLines((l) => [...l, line('out', COMMANDS[cmd]())])

    setBusy(true)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text.slice(0, 500), history: history.current }),
      })
      const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: string }
      if (!res.ok || !data.answer) throw new Error(data.error ?? 'failed')
      history.current = [...history.current, { role: 'user' as const, text }, { role: 'model' as const, text: data.answer }].slice(-6)
      setLines((l) => [...l, line('ai', data.answer!)])
    } catch (e) {
      const code = e instanceof Error ? e.message : ''
      setLines((l) => [...l, line('err', ERRORS[code] ?? `Something went wrong. Try again, or email ${CONTACT_INFO.email}.`)])
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    run(input)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <motion.div
      role="dialog"
      aria-label="Ask Adriel terminal"
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-3 bottom-3 top-20 z-[70] flex flex-col overflow-hidden rounded-2xl border border-border-hover bg-ink font-mono text-sm text-foreground shadow-2xl [--focus-ring:var(--color-accent)] sm:inset-x-auto sm:right-6 sm:top-auto sm:bottom-6 sm:h-[min(600px,80svh)] sm:w-[440px]"
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <p className="text-xs uppercase tracking-widest text-foreground-subtle">
          <span className="text-accent">adriel</span>@portfolio:~
        </p>
        <button onClick={onClose} aria-label="Close terminal" className="rounded-md p-1.5 text-foreground-muted hover:bg-surface hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={logRef} data-lenis-prevent aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4 leading-relaxed">
        {lines.map((l) => (
          <p
            key={l.id}
            className={cn(
              'whitespace-pre-wrap break-words',
              l.kind === 'in' && 'text-foreground',
              l.kind === 'out' && 'text-foreground-muted',
              l.kind === 'ai' && 'text-foreground',
              l.kind === 'err' && 'text-accent'
            )}
          >
            {l.kind === 'in' && <span className="text-accent">&gt; </span>}
            {l.kind === 'ai' ? <Typed text={l.text} onTick={scrollDown} /> : l.text}
          </p>
        ))}
        {busy && (
          <p className="text-foreground-subtle">
            thinking<span className="animate-pulse">_</span>
          </p>
        )}
        {lines.length <= 2 && !busy && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => run(s)}
                className="rounded-full border border-border-hover px-3 py-1 text-xs text-foreground-muted transition-colors hover:border-accent hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-3">
        <span className="text-accent" aria-hidden="true">
          &gt;
        </span>
        <label htmlFor="ask-adriel-input" className="sr-only">
          Ask a question or type a command
        </label>
        <input
          id="ask-adriel-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          autoComplete="off"
          spellCheck={false}
          placeholder={busy ? 'thinking…' : 'ask something, or type help'}
          disabled={busy}
          className="min-w-0 flex-1 bg-transparent text-foreground caret-accent outline-none placeholder:text-foreground-subtle"
        />
      </form>
    </motion.div>
  )
}
