import { type ReactNode, memo } from 'react'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { useSmoothScroll } from '@/hooks'

interface RootLayoutProps {
  children: ReactNode
}

/**
 * Root layout — wraps all pages with navbar, footer and smooth scroll.
 */
export const RootLayout = memo(function RootLayout({ children }: RootLayoutProps) {
  useSmoothScroll()

  return (
    <div className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1 w-full max-w-full overflow-x-clip">{children}</main>
      <Footer />
    </div>
  )
})
