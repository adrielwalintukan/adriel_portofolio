import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { AppRouter } from './App'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <AppRouter />
  </StrictMode>
)

// production HTML is prerendered (scripts/prerender.mjs); the dev server serves an empty root
if (root.hasChildNodes()) {
  // let the browser paint the prerendered HTML first; hydrating straight away delays first paint on slow CPUs
  requestAnimationFrame(() => setTimeout(() => hydrateRoot(root, app)))
} else {
  createRoot(root).render(app)
}
