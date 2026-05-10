import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import { LoadingScreen } from '@/components/effects'

/**
 * Application router — add new routes here as pages are created.
 */
export function AppRouter() {
  const [isAppReady, setIsAppReady] = useState(false)

  return (
    <>
      {!isAppReady && <LoadingScreen onComplete={() => setIsAppReady(true)} />}
      
      {/* 
        We render the router immediately so background assets (images, 3D) begin preloading.
        The LoadingScreen overlays everything with z-[999] and locks the scroll.
      */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}
