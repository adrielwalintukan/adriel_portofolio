import { PROJECTS } from '../../lib/constants.ts'
import type { FsNode } from './fs'
import type { DesktopCtx } from './ctx'

/** Opens a file or folder the way a desktop would: each kind goes to the app that shows it. */
export const openNode = (node: FsNode, path: string[], ctx: DesktopCtx, from?: number) => {
  if (node.type === 'folder') {
    const next = [...path, node.name]
    if (from !== undefined) ctx.retarget(from, node.name, { path: next })
    else ctx.open('explorer', node.name, { path: next })
    return
  }
  switch (node.kind) {
    case 'image':
      ctx.open('photos', 'Photos', { src: node.src })
      return
    case 'video':
    case 'youtube': {
      // both demos are called "demo", so the title says whose it is
      const owner = PROJECTS.find((p) => p.id === node.projectId)?.title
      ctx.open('media', owner ? `${owner} demo` : node.name, { src: node.src, kind: node.kind })
      return
    }
    case 'text':
      ctx.open('notepad', node.name, { path: [...path, node.name] })
      return
    case 'link': {
      const project = PROJECTS.find((p) => p.id === node.projectId)
      ctx.open('browser', node.name, { src: node.src, title: project?.title ?? node.name, blurb: project?.description })
      return
    }
    case 'app':
      if (node.app) ctx.open(node.app, node.name)
  }
}
