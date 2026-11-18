// Injects the server-rendered home page into dist/index.html so the hero paints before JS runs.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const ssr = fileURLToPath(new URL('../dist-ssr/', import.meta.url))
const { render } = await import(pathToFileURL(`${ssr}entry-server.js`).href)

const file = `${dist}index.html`
const html = readFileSync(file, 'utf8')
if (!html.includes('<div id="root"></div>'))
  throw new Error('prerender: empty #root not found in dist/index.html')
// /studio is its own experience: a copy with an empty #root means a hard refresh there never
// paints the home page first, and no hero images are fetched for nothing
// its link preview shows the room instead of the home page
const studio = html
  .replaceAll('Adriel Walintukan | Developer Portfolio', '3D Studio — Adriel Walintukan')
  .replaceAll(
    'https://www.adrielwalintukan.my.id/og-image.jpg',
    'https://www.adrielwalintukan.my.id/og-studio.jpg'
  )
  .replaceAll(
    'content="https://www.adrielwalintukan.my.id/"',
    'content="https://www.adrielwalintukan.my.id/studio"'
  )
  .replace(
    'href="https://www.adrielwalintukan.my.id/"',
    'href="https://www.adrielwalintukan.my.id/studio"'
  )
  .replace(
    "Adriel Walintukan's portfolio: portrait and name on the home page",
    "Adriel's 3D studio: an interactive room with his projects, desk and lounge"
  )
if (!studio.includes('og-studio.jpg'))
  throw new Error('prerender: studio link preview tags not found')
writeFileSync(`${dist}studio.html`, studio)
writeFileSync(file, html.replace('<div id="root"></div>', `<div id="root">${render('/')}</div>`))
rmSync(ssr, { recursive: true, force: true })
console.log('prerendered / into dist/index.html')
