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
      <a
        href="#main"
        className="sr-only rounded-lg bg-ink px-4 py-2 font-display font-extrabold uppercase text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 w-full max-w-full overflow-x-clip outline-none">
        {children}
      </main>
      <Footer />
    </div>
  )
})
