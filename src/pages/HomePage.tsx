import { lazy, memo, Suspense } from 'react'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/animations'
import { RootLayout } from '@/components/shared/RootLayout'
import { HeroSection } from '@/components/sections/HeroSection'

// Everything below the fold ships as its own chunk so first paint only evaluates the hero
const BelowFold = lazy(() => import('./BelowFold'))

/**
 * Home page — the main portfolio landing page.
 */
function HomePage() {
  return (
    <RootLayout>
      <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit">
        <HeroSection />
        <Suspense fallback={<div className="min-h-[100svh] bg-ink" />}>
          <BelowFold />
        </Suspense>
      </motion.div>
    </RootLayout>
  )
}

export default memo(HomePage)
