import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { AppRouter } from './App'

/** Build-time prerender of a route's HTML; see scripts/prerender.mjs. */
export function render(path: string): string {
  return renderToString(
    <StrictMode>
      <AppRouter ssrPath={path} />
    </StrictMode>
  )
}
