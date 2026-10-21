// Injects the server-rendered home page into dist/index.html so the hero paints before JS runs.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const ssr = fileURLToPath(new URL('../dist-ssr/', import.meta.url))
const { render } = await import(pathToFileURL(`${ssr}entry-server.js`).href)

const file = `${dist}index.html`
const html = readFileSync(file, 'utf8')
if (!html.includes('<div id="root"></div>')) throw new Error('prerender: empty #root not found in dist/index.html')
writeFileSync(file, html.replace('<div id="root"></div>', `<div id="root">${render('/')}</div>`))
rmSync(ssr, { recursive: true, force: true })
console.log('prerendered / into dist/index.html')
