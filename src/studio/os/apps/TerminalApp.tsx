import { useEffect, useRef, useState } from 'react'
import { PROMPT, TERM_COLORS, runCommand, type TermData, type TermLine } from '../../terminal'
import { applyEffect } from '../termGlue'
import { PROJECTS } from '../../../lib/constants.ts'
import type { AppProps } from '../ctx'

const WELCOME: TermLine[] = [
  [PROMPT + 'welcome', TERM_COLORS.prompt],
  ['this terminal works. type help to start.', TERM_COLORS.out],
  ['psst: it has secrets too. type hint', TERM_COLORS.ok],
]

/** The same commands as the left monitor, in a window; hidden commands play their effect in the room. */
export function TerminalApp({ ctx, data }: AppProps & { data: TermData }) {
  const [lines, setLines] = useState<TermLine[]>(WELCOME)
  const [input, setInput] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  const submit = () => {
    const result = runCommand(input, data)
    setLines((prev) => (result.clear ? [] : [...prev, ...result.lines].slice(-200)))
    setInput('')
    if (result.effect) applyEffect(result.effect)
    if (result.open !== undefined) {
      const title = data.projects[result.open]
      if (PROJECTS.some((p) => p.title === title)) ctx.open('explorer', title, { path: ['Projects', title] })
    }
  }
  return (
    <div className="flex h-full flex-col bg-[#070c14] p-2 font-mono text-[12px] leading-5" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
      <div className="min-h-0 flex-1 overflow-auto">
        {lines.map(([text, color], i) => (
          <p key={i} className="whitespace-pre-wrap break-words" style={{ color }}>
            {text}
          </p>
        ))}
        <div ref={end} />
      </div>
      <form
        className="flex items-center gap-1 border-t border-white/10 pt-1"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <span className="text-[#3fb0b7]">{PROMPT}</span>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Terminal command"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[#dbe5ea] outline-none"
        />
      </form>
    </div>
  )
}
