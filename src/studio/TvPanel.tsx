import { memo, useState } from 'react'
import { Gamepad2, Play, X, ArrowLeft } from 'lucide-react'
import type { TvMode } from './data'

/** A few good defaults; the input below takes any YouTube link or id. */
const PICKS: { id: string; label: string }[] = [
  { id: '5qap5aO4i9A', label: 'lofi hip hop radio' },
  { id: 'jfKfPfyJRdk', label: 'lofi girl — live' },
  { id: 'n61ULEU7CO0', label: 'best of lofi' },
]

/** Accepts a full watch/short/youtu.be URL or a bare 11-char id. */
const videoId = (input: string) => {
  const value = input.trim()
  if (/^[\w-]{11}$/.test(value)) return value
  const match = value.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)
  return match ? match[1] : null
}

interface TvPanelProps {
  mode: TvMode
  onMode: (mode: TvMode) => void
  onClose: () => void
}

/** The TV's remote: pick the little match or a real YouTube player, all inside the room. */
export const TvPanel = memo(function TvPanel({ mode, onMode, onClose }: TvPanelProps) {
  const [video, setVideo] = useState(PICKS[0].id)
  const [draft, setDraft] = useState('')
  const [bad, setBad] = useState(false)

  const play = (input: string) => {
    const id = videoId(input)
    if (!id) {
      setBad(true)
      return
    }
    setBad(false)
    setVideo(id)
    setDraft('')
    onMode('youtube')
  }

  return (
    <div className="pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c1424]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#3fb0b7]">the lounge</p>
          <h2 className="mt-0.5 font-display text-2xl font-black uppercase tracking-tight text-[#eef2f3]">Night circuit</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Back to the room"
          className="mt-0.5 rounded-md border border-white/10 p-1.5 text-[#8fa0ad] transition-colors hover:border-white/25 hover:text-[#eef2f3]"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {mode === 'menu' && (
          <div className="space-y-2">
            <button
              onClick={() => onMode('game')}
              className="group flex w-full items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-left transition-colors hover:border-[#3fb0b7]/40 hover:bg-white/[0.06]"
            >
              <Gamepad2 className="h-4 w-4 shrink-0 text-[#3fb0b7]" aria-hidden="true" />
              <span className="flex-1">
                <span className="block font-display text-sm font-extrabold uppercase tracking-wide text-[#eef2f3]">Play pong</span>
                <span className="mt-0.5 block text-xs text-[#8fa0ad]">Move the pointer to steer your paddle</span>
              </span>
            </button>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-[#eef2f3]">
                <Play className="h-4 w-4 text-[#ffd08a]" aria-hidden="true" /> YouTube
              </p>
              <p className="mt-0.5 text-xs text-[#8fa0ad]">Pick a video, or paste any YouTube link.</p>
              <ul className="mt-2 space-y-1">
                {PICKS.map((pick) => (
                  <li key={pick.id}>
                    <button
                      onClick={() => play(pick.id)}
                      className="w-full rounded border border-white/10 px-2 py-1.5 text-left text-xs text-[#dbe5ea] transition-colors hover:border-[#3fb0b7]/50 hover:text-[#3fb0b7]"
                    >
                      {pick.label}
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-2 flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault()
                  play(draft)
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setBad(false)
                  }}
                  placeholder="youtube.com/watch?v=…"
                  aria-label="YouTube link or video id"
                  className="min-w-0 flex-1 rounded border border-white/10 bg-[#070c16] px-2 py-1.5 font-mono text-[11px] text-[#dbe5ea] outline-none placeholder:text-[#5f7186] focus:border-[#3fb0b7]/60"
                />
                <button
                  type="submit"
                  className="rounded bg-[#3fb0b7] px-2.5 py-1.5 font-display text-[11px] font-extrabold uppercase tracking-wide text-[#0b1226] transition-colors hover:bg-[#5cc2c8]"
                >
                  Play
                </button>
              </form>
              {bad && <p className="mt-1.5 font-mono text-[11px] text-[#e08a7a]">That doesn&apos;t look like a YouTube link.</p>}
            </div>
          </div>
        )}

        {mode === 'game' && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[#a7b0bd]">
              The match is on the TV — move your pointer left and right to steer the paddle. Esc or Room stops it.
            </p>
            <button
              onClick={() => onMode('menu')}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#8fa0ad] transition-colors hover:border-white/25 hover:text-[#eef2f3]"
            >
              <ArrowLeft className="h-3 w-3" /> Back to the menu
            </button>
          </div>
        )}

        {mode === 'youtube' && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
              <iframe
                key={video}
                src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0&modestbranding=1`}
                title="YouTube player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="aspect-video w-full"
              />
            </div>
            <button
              onClick={() => onMode('menu')}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#8fa0ad] transition-colors hover:border-white/25 hover:text-[#eef2f3]"
            >
              <ArrowLeft className="h-3 w-3" /> Back to the menu
            </button>
          </div>
        )}
      </div>
    </div>
  )
})
