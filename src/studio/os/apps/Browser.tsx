import { ExternalLink, Globe } from 'lucide-react'
import type { AppProps } from '../ctx'

/** Most sites refuse to load inside another page, so this shows the destination and opens it in a real tab. */
export function Browser({ win }: AppProps) {
  const { src, title, blurb } = win.arg ?? {}
  return (
    <div className="flex h-full flex-col bg-[#0d1522]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#111a2b] px-3 py-1.5">
        <Globe className="h-3.5 w-3.5 shrink-0 text-[#3fb0b7]" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px] text-[#8fa0ad]">
          {src ?? 'about:blank'}
        </p>
      </div>
      <div className="flex flex-1 flex-col items-start justify-center gap-3 p-6">
        <p className="font-display text-2xl font-black uppercase text-[#eef2f3]">{title ?? 'New tab'}</p>
        {blurb && <p className="line-clamp-4 max-w-md text-sm text-[#a7b0bd]">{blurb}</p>}
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#3fb0b7] px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#06202a] hover:bg-[#5cc4ca]"
          >
            Open in new tab <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
