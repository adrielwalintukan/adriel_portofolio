import { memo, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'framer-motion'

// 3D Adriel rendered in 5 pitch × 21 yaw head poses (LivePortrait). The body is one static image with
// the head area cut out; each pose is just the head tile, laid over it at the same spot.
const BODY = '/images/hero-body.webp'
const ROWS = 5 // r0 looks up … r4 looks down
const COLS = 21 // c0 faces screen-right … c20 faces screen-left (every 2.5°)
const MID = 2 * COLS + 10
const TILE = { w: 640, h: 630 } // pixel size of every head tile
const tile = (i: number) => `/head/r${Math.floor(i / COLS)}c${i % COLS}.webp`
// where the tiles sit in the square frame (left, top, width, height in %)
const BOX = { left: '23.9%', top: '9.6%', width: '51.1%', height: '50.2%' }

/** Character whose head and eyes follow the cursor; idles with a slow look-around on touch. */
export const HeroCharacter = memo(function HeroCharacter() {
  const ref = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const still = useRef<HTMLImageElement>(null)
  const poses = useRef<HTMLImageElement[]>([])
  const shown = useRef(MID)
  const [loadAll, setLoadAll] = useState(false)
  const reduceMotion = useReducedMotion()
  const tx = useMotionValue(0)
  const ty = useMotionValue(0)
  const spring = { stiffness: 70, damping: 18, mass: 0.7 }
  const x = useSpring(tx, spring)
  const y = useSpring(ty, spring)
  const shiftX = useTransform(x, (v) => `${v * 0.8}%`)
  const shiftY = useTransform(y, (v) => `${v * 0.4}%`)

  // one crisp pose at a time, painted onto a single canvas: clear + draw lands in the same frame, so the
  // head never vanishes between poses (swapping <img> opacity flashed the hole in the body while decoding)
  const pick = () => {
    const c = Math.round(((1 - x.get()) / 2) * (COLS - 1))
    const r = Math.round(((y.get() + 1) / 2) * (ROWS - 1))
    const next = r * COLS + c
    const img = poses.current[next]
    const ctx = canvas.current?.getContext('2d')
    if (next === shown.current || !ctx || !img?.complete || !img.naturalWidth) return // keep the last pose while one loads
    ctx.clearRect(0, 0, TILE.w, TILE.h)
    ctx.drawImage(img, 0, 0)
    if (still.current) still.current.style.visibility = 'hidden' // the canvas has taken over from the first pose
    shown.current = next
  }
  useMotionValueEvent(x, 'change', pick)
  useMotionValueEvent(y, 'change', pick)

  // the other poses wait until the page has loaded and gone idle
  useEffect(() => {
    const go = () => ('requestIdleCallback' in window ? requestIdleCallback(() => setLoadAll(true)) : setLoadAll(true))
    if (document.readyState === 'complete') go()
    else window.addEventListener('load', go, { once: true })
    return () => window.removeEventListener('load', go)
  }, [])

  useEffect(() => {
    if (!loadAll) return
    poses.current = Array.from({ length: ROWS * COLS }, (_, i) => {
      const img = new Image()
      img.src = tile(i)
      return img
    })
  }, [loadAll])

  useEffect(() => {
    if (reduceMotion || !loadAll) return
    if (!matchMedia('(pointer: fine)').matches) {
      // touch: no cursor to follow, so glance around now and then
      const a = animate(tx, [0, -0.8, -0.8, 0.7, 0.7, 0], { duration: 10, repeat: Infinity, ease: 'easeInOut' })
      const b = animate(ty, [0, 0.3, -0.4, -0.4, 0.4, 0], { duration: 10, repeat: Infinity, ease: 'easeInOut' })
      return () => { a.stop(); b.stop() }
    }
    const onMove = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const clamp = (v: number) => Math.max(-1, Math.min(1, v))
      tx.set(clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)))
      ty.set(clamp((e.clientY - (r.top + r.height * 0.3)) / (innerHeight / 2)))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduceMotion, loadAll, tx, ty])

  return (
    // square stage that fits the box like object-contain, pinned to the bottom
    <div ref={ref} className="relative h-full w-full [container-type:size]">
      <motion.div
        className="absolute bottom-0 left-1/2 aspect-square -translate-x-1/2"
        style={{ width: 'min(100cqw, 100cqh)', x: shiftX, y: shiftY }}
      >
        <img
          src={BODY}
          alt="Adriel Walintukan, 3D character"
          width={1254}
          height={1254}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full"
        />
        {/* front-facing head straight from the HTML, shown until the canvas draws its first pose */}
        <img ref={still} src={tile(MID)} alt="" aria-hidden="true" fetchPriority="high" className="absolute" style={BOX} />
        <canvas ref={canvas} width={TILE.w} height={TILE.h} aria-hidden="true" className="absolute" style={BOX} />
      </motion.div>
    </div>
  )
})
