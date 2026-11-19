import { CERTIFICATES_DATA, CONTACT_INFO, EXPERIENCE_TIMELINE, PROJECTS, SKILLS_DATA, type Project } from '../../lib/constants.ts'

/** The desktop's file system, built once from the portfolio's own data: nothing here is typed in by hand. */
export type AppId = 'explorer' | 'photos' | 'media' | 'notepad' | 'terminal' | 'browser'
export type FileKind = 'image' | 'video' | 'youtube' | 'text' | 'link' | 'app'

export type FsFile = {
  type: 'file'
  name: string
  kind: FileKind
  /** image/video path, YouTube id or URL, depending on kind */
  src?: string
  text?: string
  app?: AppId
  projectId?: string
}
export type FsFolder = { type: 'folder'; name: string; children: FsNode[]; projectId?: string }
export type FsNode = FsFile | FsFolder

const text = (name: string, body: string, projectId?: string): FsFile => ({ type: 'file', name, kind: 'text', text: body, projectId })

export const readmeOf = (p: Project) =>
  [
    p.title,
    '='.repeat(p.title.length),
    `${p.category}`,
    '',
    p.longDescription ?? p.description,
    '',
    `Technologies: ${p.technologies.join(', ')}`,
  ].join('\n')

/** One project as a folder: README, screenshots, demo video and links, whichever the project has. */
export const projectFolder = (p: Project): FsFolder => {
  const children: FsNode[] = [text('README.txt', readmeOf(p), p.id)]
  p.images.forEach((src, i) => children.push({ type: 'file', name: `screenshot-${String(i + 1).padStart(2, '0')}.webp`, kind: 'image', src, projectId: p.id }))
  if (p.video) children.push({ type: 'file', name: 'demo.mp4', kind: 'video', src: p.video, projectId: p.id })
  if (p.youtubeId) children.push({ type: 'file', name: 'demo (YouTube)', kind: 'youtube', src: p.youtubeId, projectId: p.id })
  if (p.liveUrl) children.push({ type: 'file', name: 'Live site.url', kind: 'link', src: p.liveUrl, projectId: p.id })
  if (p.repoUrl) children.push({ type: 'file', name: 'Repository.url', kind: 'link', src: p.repoUrl, projectId: p.id })
  return { type: 'folder', name: p.title, children, projectId: p.id }
}

export const buildFs = (): FsFolder => {
  const projects = PROJECTS.filter((p) => !p.inDevelopment)
  const latest = EXPERIENCE_TIMELINE[0]
  return {
    type: 'folder',
    name: 'AdrielOS',
    children: [
      { type: 'folder', name: 'Projects', children: projects.map(projectFolder) },
      {
        type: 'folder',
        name: 'Certificates',
        children: CERTIFICATES_DATA.filter((c) => c.image).map(
          (c): FsFile => ({ type: 'file', name: `${c.title}.webp`, kind: 'image', src: c.image })
        ),
      },
      {
        type: 'folder',
        name: 'Pictures',
        children: projects.flatMap((p) =>
          p.images.map((src, i): FsFile => ({ type: 'file', name: `${p.title} ${i + 1}.webp`, kind: 'image', src, projectId: p.id }))
        ),
      },
      {
        type: 'folder',
        name: 'Recycle Bin',
        children: [text('bugs.txt', 'It works on my machine.\n(Deleted, then restored. Twice.)')],
      },
      text(
        'about-me.txt',
        [
          'Adriel Walintukan',
          CONTACT_INFO.city,
          '',
          `Now: ${latest.title}, ${latest.role} (${latest.year})`,
          `Stack: ${SKILLS_DATA.map((s) => s.category).join(' | ')}`,
          '',
          CONTACT_INFO.availability,
          CONTACT_INFO.email,
        ].join('\n')
      ),
    ],
  }
}

/** Follows a path of names down from a folder; an empty path is the folder itself. */
export const resolve = (root: FsFolder, path: string[]): FsNode | null => {
  let node: FsNode = root
  for (const name of path) {
    if (node.type !== 'folder') return null
    const next: FsNode | undefined = node.children.find((c) => c.name === name)
    if (!next) return null
    node = next
  }
  return node
}
