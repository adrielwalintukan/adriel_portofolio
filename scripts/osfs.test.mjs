import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PROJECTS, CERTIFICATES_DATA, CONTACT_INFO, EXPERIENCE_TIMELINE } from '../src/lib/constants.ts'
import { buildFs, projectFolder, resolve } from '../src/studio/os/fs.ts'

const projects = PROJECTS.filter((p) => !p.inDevelopment)
const root = buildFs()
const names = (f) => f.children.map((c) => c.name)

test('the root holds the standard folders and about-me.txt', () => {
  for (const n of ['Projects', 'Certificates', 'Pictures', 'Recycle Bin', 'about-me.txt']) assert.ok(names(root).includes(n), n)
})

test('every project is a folder with a README that names its title and technologies', () => {
  const folder = resolve(root, ['Projects'])
  assert.equal(folder.children.length, projects.length)
  for (const p of projects) {
    const readme = resolve(root, ['Projects', p.title, 'README.txt'])
    assert.equal(readme.kind, 'text', p.title)
    assert.ok(readme.text.includes(p.title))
    for (const t of p.technologies) assert.ok(readme.text.includes(t), `${p.title}: ${t}`)
  }
})

test('videos, youtube demos and links become files that carry their source', () => {
  for (const p of projects) {
    const files = resolve(root, ['Projects', p.title]).children
    if (p.video) assert.equal(files.find((f) => f.kind === 'video')?.src, p.video)
    if (p.youtubeId) assert.equal(files.find((f) => f.kind === 'youtube')?.src, p.youtubeId)
    for (const url of [p.liveUrl, p.repoUrl].filter(Boolean)) assert.ok(files.some((f) => f.kind === 'link' && f.src === url), url)
  }
})

test('a project with no media or links still opens as a valid folder', () => {
  const bare = { ...projects[0], images: [], video: undefined, youtubeId: undefined, liveUrl: undefined, repoUrl: undefined }
  const folder = projectFolder(bare)
  assert.deepEqual(folder.children.map((c) => c.name), ['README.txt'])
  assert.equal(folder.projectId, bare.id)
})

test('Pictures counts every screenshot, Certificates every scan', () => {
  const total = projects.reduce((n, p) => n + p.images.length, 0)
  assert.equal(resolve(root, ['Pictures']).children.filter((c) => c.kind === 'image').length, total)
  const scans = CERTIFICATES_DATA.filter((c) => c.image).length
  assert.equal(resolve(root, ['Certificates']).children.filter((c) => c.kind === 'image').length, scans)
})

test('resolve finds nested files and returns null for a missing path', () => {
  assert.equal(resolve(root, ['Projects', projects[0].title, 'README.txt']).name, 'README.txt')
  assert.equal(resolve(root, ['nope']), null)
  assert.equal(resolve(root, []), root)
})

test('about-me.txt uses the real city and latest role; the bin holds one text file', () => {
  const about = resolve(root, ['about-me.txt'])
  assert.ok(about.text.includes(CONTACT_INFO.city))
  assert.ok(about.text.includes(EXPERIENCE_TIMELINE[0].title))
  const bin = resolve(root, ['Recycle Bin'])
  assert.equal(bin.children.length, 1)
  assert.equal(bin.children[0].kind, 'text')
})
