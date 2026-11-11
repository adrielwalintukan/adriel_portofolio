import { type ReactNode, memo, useEffect } from 'react'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { AskAdriel } from '@/components/ui'
import { useSmoothScroll } from '@/hooks'

interface RootLayoutProps {
  children: ReactNode
}

/**
 * Root layout — wraps all pages with navbar, footer and smooth scroll.
 */
export const RootLayout = memo(function RootLayout({ children }: RootLayoutProps) {
  useSmoothScroll()

  // cursor trail: ovals breadcrumbed along the pointer path, spaced by distance so a fast move
  // leaves a chain of ghosts (RootLayout owns the count, CSS owns the look). Section-local
  // coordinates + inline transforms: no repaint, and the ovals stay behind the section's content.
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const TRAIL = 6
    const STEP = 40 // px between breadcrumbs (~half the circle, so the ghosts stay distinct)
    const crumbs: { x: number; y: number }[] = []
    let pointerX = 0
    let pointerY = 0
    let frame = 0
    const draw = () => {
      frame = 0
      for (const root of document.querySelectorAll<HTMLElement>('.section-glow')) {
        while (root.childElementCount < TRAIL) root.appendChild(document.createElement('i'))
        const box = root.getBoundingClientRect()
        for (let i = 0; i < TRAIL; i++) {
          const at = i === 0 ? { x: pointerX, y: pointerY } : crumbs[i - 1]
          // the trail is only as long as the path walked so far
          const ghost = root.children[i] as HTMLElement
          ghost.style.transform = at
            ? `translate3d(${at.x - box.left}px, ${at.y - box.top}px, 0) translate(-50%, -50%)`
            : 'translate3d(-9999px, -9999px, 0)'
        }
      }
    }
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(draw)
    }
    const onMove = (e: PointerEvent) => {
      pointerX = e.clientX
      pointerY = e.clientY
      const last = crumbs[0]
      if (!last || Math.hypot(e.clientX - last.x, e.clientY - last.y) >= STEP) {
        crumbs.unshift({ x: e.clientX, y: e.clientY })
        crumbs.length = Math.min(crumbs.length, TRAIL - 1)
      }
      wake()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', wake, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', wake)
      cancelAnimationFrame(frame)
    }
  }, [])

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
      <AskAdriel />
    </div>
  )
})
