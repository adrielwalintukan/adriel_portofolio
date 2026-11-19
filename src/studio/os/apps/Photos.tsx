import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { resolve, type FsFile } from '../fs'
import type { AppProps } from '../ctx'

/** Every project screenshot as thumbnails; click one to view it large, then step with the arrows. */
export function Photos({ win, ctx }: AppProps) {
  const pictures = useMemo(() => {
    const folder = resolve(ctx.fs, ['Pictures'])
    return folder?.type === 'folder' ? (folder.children.filter((c): c is FsFile => c.type === 'file' && !!c.src)) : []
  }, [ctx.fs])
  // a certificate scan opened from the Explorer is not in Pictures: show it on its own
  const list = useMemo<FsFile[]>(() => {
    const src = win.arg?.src
    return src && !pictures.some((p) => p.src === src)
      ? [{ type: 'file', name: win.title, kind: 'image', src }]
      : pictures
  }, [pictures, win.arg?.src, win.title])
  const start = win.arg?.src ? list.findIndex((p) => p.src === win.arg?.src) : -1
  // a new photo opened into this window restarts the viewer on it
  const [viewed, setViewed] = useState({ from: win.arg?.src, index: start >= 0 ? start : null as number | null })
  if (viewed.from !== win.arg?.src) setViewed({ from: win.arg?.src, index: start >= 0 ? start : null })
  const index = viewed.index
  const setIndex = (i: number | null) => setViewed((v) => ({ ...v, index: i }))
  const step = (d: number) => setViewed((v) => ({ ...v, index: v.index === null ? null : (v.index + d + list.length) % list.length }))
  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      // not while typing in the Terminal, nor while the Details gallery (which has its own arrows) is up
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return
      if (document.querySelector('[aria-label="Close Gallery"]')) return
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, list.length])

  if (index !== null && list[index]) {
    return (
      <div className="relative flex h-full flex-col bg-black">
        <img src={list[index].src} alt={list[index].name} className="min-h-0 flex-1 object-contain" />
        <div className="flex items-center justify-between border-t border-white/10 bg-[#111a2b] px-2 py-1">
          <button onClick={() => setIndex(null)} className="rounded px-2 py-0.5 font-mono text-[11px] text-[#a7b0bd] hover:text-white">
            Back to grid
          </button>
          <p className="truncate px-2 font-mono text-[11px] text-[#8fa0ad]">
            {index + 1}/{list.length} · {list[index].name}
          </p>
          <div className="flex gap-1">
            <button aria-label="Previous photo" onClick={() => step(-1)} className="rounded p-1 text-[#a7b0bd] hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button aria-label="Next photo" onClick={() => step(1)} className="rounded p-1 text-[#a7b0bd] hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="h-full overflow-auto bg-[#0d1522] p-2">
      {list.length === 0 && (
        <p className="flex items-center gap-2 p-3 text-sm text-[#8fa0ad]">
          <ImageIcon className="h-4 w-4" /> No photos yet.
        </p>
      )}
      <div className="grid grid-cols-4 gap-1.5">
        {list.map((p, i) => (
          <button key={p.src} onClick={() => setIndex(i)} className="aspect-[4/3] overflow-hidden rounded border border-white/10 hover:border-[#3fb0b7]">
            <img src={p.src} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
