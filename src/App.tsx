import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, StaticRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import HomePage from '@/pages/HomePage'
import { LoadingScreen } from '@/components/effects'

// full-screen 3D experience: three.js is only fetched when someone actually opens it
const StudioPage = lazy(() => import('@/pages/StudioPage'))

/**
 * Application router — add new routes here as pages are created.
 * `ssrPath` is only passed by the build-time prerender (src/entry-server.tsx).
 */
export function AppRouter({ ssrPath }: { ssrPath?: string }) {
  // the studio renders its own loader and locks the page itself; the home intro would only delay it
  const [isAppReady, setIsAppReady] = useState(
    () => typeof window !== 'undefined' && window.location.pathname.startsWith('/studio')
  )
  const routes = (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/studio"
        element={
          <Suspense fallback={<div className="min-h-[100svh] bg-[#070c16]" />}>
            <StudioPage />
          </Suspense>
        }
      />
    </Routes>
  )

  return (
    // reducedMotion="user": framer skips transform animations when the OS asks for reduced motion
    <MotionConfig reducedMotion="user">
      {!isAppReady && <LoadingScreen onComplete={() => setIsAppReady(true)} />}

      {/* 
        We render the router immediately so background assets (images) begin preloading.
        The LoadingScreen overlays everything with z-[999] and locks the scroll.
      */}
      {ssrPath ? <StaticRouter location={ssrPath}>{routes}</StaticRouter> : <BrowserRouter>{routes}</BrowserRouter>}
    </MotionConfig>
  )
}
