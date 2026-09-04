import { type ReactNode, memo } from 'react'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { NoiseOverlay } from '@/components/effects'
import { AmbientGlow } from '@/components/effects'
import { useSmoothScroll } from '@/hooks'

interface RootLayoutProps {
  children: ReactNode
}

/**
 * Root layout — wraps all pages with navbar, footer, smooth scroll,
 * and lightweight ambient effects.
 */
export const RootLayout = memo(function RootLayout({ children }: RootLayoutProps) {
  useSmoothScroll()

  return (
    <div className="relative flex min-h-screen flex-col">
      <NoiseOverlay />
      <AmbientGlow variant="primary" />
      <AmbientGlow variant="secondary" />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
})
