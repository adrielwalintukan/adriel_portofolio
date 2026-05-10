import { memo } from 'react'

/**
 * Noise/grain overlay for cinematic texture.
 * Static (no animation) — the grain CSS class is static for performance.
 * Hidden on mobile via CSS media query in globals.css.
 */
export const NoiseOverlay = memo(function NoiseOverlay() {
  return <div className="noise-overlay" aria-hidden="true" />
})
