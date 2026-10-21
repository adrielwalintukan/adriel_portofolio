import { useState } from 'react'
import { BrowserRouter, StaticRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import HomePage from '@/pages/HomePage'
import { LoadingScreen } from '@/components/effects'

/**
 * Application router — add new routes here as pages are created.
 * `ssrPath` is only passed by the build-time prerender (src/entry-server.tsx).
 */
export function AppRouter({ ssrPath }: { ssrPath?: string }) {
  const [isAppReady, setIsAppReady] = useState(false)
  const routes = (
    <Routes>
      <Route path="/" element={<HomePage />} />
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
