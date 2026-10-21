import { lazy, memo, Suspense, useSyncExternalStore } from 'react'
import { RootLayout } from '@/components/shared/RootLayout'
import { HeroSection } from '@/components/sections/HeroSection'

// Everything below the fold ships as its own chunk so first paint only evaluates the hero
const BelowFold = lazy(() => import('./BelowFold'))
const noop = () => () => {}

/**
 * Home page — the main portfolio landing page.
 */
function HomePage() {
  // false during prerender and hydration: renderToString can't wait for the lazy chunk (React error #419)
  const hydrated = useSyncExternalStore(noop, () => true, () => false)
  const fallback = <div className="min-h-[100svh] bg-ink" />

  return (
    <RootLayout>
      {/* no page-level fade: the prerendered hero must be visible at first paint (it sits under the loader) */}
      <HeroSection />
      {hydrated ? (
        <Suspense fallback={fallback}>
          <BelowFold />
        </Suspense>
      ) : (
        fallback
      )}
    </RootLayout>
  )
}

export default memo(HomePage)
