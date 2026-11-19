import { ArrowLeft, File, FileText, Folder, Image as ImageIcon, Link2, Play } from 'lucide-react'
import { resolve, type FsNode } from '../fs'
import { openNode } from '../open'
import type { AppProps } from '../ctx'

const SIDEBAR: { label: string; path: string[] }[] = [
  { label: 'Desktop', path: [] },
  { label: 'Projects', path: ['Projects'] },
  { label: 'Certificates', path: ['Certificates'] },
  { label: 'Pictures', path: ['Pictures'] },
]

const iconOf = (n: FsNode) => {
  if (n.type === 'folder') return <Folder className="h-9 w-9 text-[#d9a44a]" aria-hidden="true" />
  if (n.kind === 'image') return <ImageIcon className="h-9 w-9 text-[#8fcfc9]" aria-hidden="true" />
  if (n.kind === 'video' || n.kind === 'youtube') return <Play className="h-9 w-9 text-[#e9a77f]" aria-hidden="true" />
  if (n.kind === 'link') return <Link2 className="h-9 w-9 text-[#3fb0b7]" aria-hidden="true" />
  if (n.kind === 'text') return <FileText className="h-9 w-9 text-[#dbe5ea]" aria-hidden="true" />
  return <File className="h-9 w-9 text-[#a7b0bd]" aria-hidden="true" />
}

/** The folder view: sidebar, breadcrumb, back, and the current folder's items. */
export function Explorer({ win, ctx }: AppProps) {
  const path = win.arg?.path ?? []
  const node = resolve(ctx.fs, path)
  const folder = node?.type === 'folder' ? node : ctx.fs
  const go = (next: string[]) => ctx.retarget(win.id, next.at(-1) ?? 'File Explorer', { path: next })
  const projectId = folder.projectId

  return (
    <div className="flex h-full bg-[#0d1522] text-[#dbe5ea]">
      <nav aria-label="Places" className="w-28 shrink-0 border-r border-white/10 bg-[#0b1220] p-1.5">
        {SIDEBAR.map((s) => (
          <button
            key={s.label}
            onClick={() => go(s.path)}
            className={`mb-0.5 block w-full rounded px-2 py-1 text-left font-mono text-[11px] ${
              s.path[0] === path[0] ? 'bg-[#3fb0b7]/15 text-[#3fb0b7]' : 'text-[#a7b0bd] hover:bg-white/5'
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 border-b border-white/10 bg-[#111a2b] px-2 py-1">
          <button
            aria-label="Back"
            disabled={!path.length}
            onClick={() => go(path.slice(0, -1))}
            className="rounded p-1 text-[#a7b0bd] hover:text-white disabled:opacity-30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#8fa0ad]">
            {['AdrielOS', ...path].join(' › ')}
          </p>
          {projectId && (
            <button
              onClick={() => ctx.details(projectId)}
              className="shrink-0 rounded-md border border-[#3fb0b7]/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#3fb0b7] hover:bg-[#3fb0b7]/15"
            >
              Details
            </button>
          )}
        </div>
        <div className="grid flex-1 auto-rows-min grid-cols-4 content-start gap-1 overflow-auto p-2">
          {folder.children.length === 0 && <p className="col-span-4 p-2 text-sm text-[#8fa0ad]">This folder is empty.</p>}
          {folder.children.map((n) => (
            <button
              key={n.name}
              onClick={ctx.touch ? () => openNode(n, path, ctx, win.id) : undefined}
              onDoubleClick={() => openNode(n, path, ctx, win.id)}
              onKeyDown={(e) => e.key === 'Enter' && openNode(n, path, ctx, win.id)}
              className="flex flex-col items-center gap-1 rounded p-1.5 text-center hover:bg-white/5 focus:bg-[#3fb0b7]/15 focus:outline-none"
            >
              {iconOf(n)}
              <span className="line-clamp-2 w-full break-words font-mono text-[10px] leading-3">{n.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
