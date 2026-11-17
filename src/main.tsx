import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { AppRouter } from './App'

const root = document.getElementById('root')!

// some hosts hand out the studio shell as /studio.html: keep the shareable path the router knows
if (/^\/studio(\.html|\/)$/.test(window.location.pathname)) {
  window.history.replaceState(null, '', `/studio${window.location.hash}`)
}

const app = (
  <StrictMode>
    <AppRouter />
  </StrictMode>
)

// production HTML is prerendered (scripts/prerender.mjs); the dev server serves an empty root
// the studio is not prerendered, so it must not hydrate the home page markup
if (root.hasChildNodes() && window.location.pathname === '/') {
  // let the browser paint the prerendered HTML first; hydrating straight away delays first paint on slow CPUs
  requestAnimationFrame(() => setTimeout(() => hydrateRoot(root, app)))
} else {
  createRoot(root).render(app)
}
