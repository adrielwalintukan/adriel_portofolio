import { resolve } from '../fs'
import type { AppProps } from '../ctx'

/** A read-only text window: README files, about-me.txt. */
export function Notepad({ win, ctx }: AppProps) {
  const node = resolve(ctx.fs, win.arg?.path ?? [])
  const body = node?.type === 'file' ? (node.text ?? '') : 'This file could not be opened.'
  const projectId = node?.type === 'file' ? node.projectId : undefined
  return (
    <div className="flex h-full flex-col bg-[#0d1522]">
      <div className="flex-1 overflow-auto p-3">
        <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-5 text-[#dbe5ea]">{body}</pre>
      </div>
      {projectId && (
        <div className="flex justify-end border-t border-white/10 bg-[#111a2b] px-3 py-1.5">
          <button
            onClick={() => ctx.details(projectId)}
            className="rounded-md border border-[#3fb0b7]/50 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[#3fb0b7] hover:bg-[#3fb0b7]/15"
          >
            Details
          </button>
        </div>
      )}
    </div>
  )
}
