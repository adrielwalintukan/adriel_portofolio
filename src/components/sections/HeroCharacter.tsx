import { memo, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'framer-motion'

// 3D Adriel rendered in 5 pitch × 21 yaw head poses (LivePortrait). The body is one static image with
// the head area cut out; each pose is just the head tile, laid over it at the same spot.
const BODY = '/images/hero-body.webp'
const SUIT = '/images/hero-suit.webp' // same framing, suit from the chest down, revealed by the cursor lens
const LENS = 'radial-gradient(circle var(--lr, 0px) at var(--lx, -999px) var(--ly, -999px), #000 45%, transparent 100%)'
const mask = (image: string) => {
  const m = `linear-gradient(#000 0 0), url(${image}), ${LENS}`
  const fit = '100% 100%'
  return { maskImage: m, WebkitMaskImage: m, maskSize: fit, WebkitMaskSize: fit, maskComposite: 'exclude, intersect', WebkitMaskComposite: 'xor, source-in' }
}
// The suit fades in over the jacket (plain source-over, so the lens edge never thins out to the page);
// under the lens the jacket is cut away only where the suit has no cloth: the body and head in the outfit
// area (off the face), and the per-pose jacket scraps beside the neck anywhere without cloth
const BODY_MASK = mask('/images/hero-suit-erase.webp')
const SCRAPS_MASK = mask('/images/hero-suit-cloth.webp')
// rows of a tile around the neck (0.44–0.53 of the frame) where jacket scraps ride along with each pose
const NECK_ROWS = [432, 545]
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
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const scraps = useRef<HTMLCanvasElement>(null)
  const still = useRef<HTMLImageElement>(null)
  const poses = useRef<HTMLImageElement[]>([])
  const shown = useRef(MID)
  const [loadAll, setLoadAll] = useState(false)
  const reduceMotion = useReducedMotion()
  const lensOn = loadAll && !reduceMotion
  const tx = useMotionValue(0)
  const ty = useMotionValue(0)
  const spring = { stiffness: 70, damping: 18, mass: 0.7 }
  const x = useSpring(tx, spring)
  const y = useSpring(ty, spring)
  const shiftX = useTransform(x, (v) => `${v * 0.8}%`)
  const shiftY = useTransform(y, (v) => `${v * 0.4}%`)

  // one crisp pose at a time, painted onto a single canvas: clear + draw lands in the same frame, so the
  // head never vanishes between poses (swapping <img> opacity flashed the hole in the body while decoding)
  const draw = (img: HTMLImageElement) => {
    const ctx = canvas.current?.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.clearRect(0, 0, TILE.w, TILE.h)
    ctx.drawImage(img, 0, 0)
    if (still.current) still.current.style.visibility = 'hidden' // the canvas has taken over from the first pose
    const cut = scraps.current?.getContext('2d')
    if (!cut) return
    // per row, keep the neck skin and whatever lies between its edges; dark jacket outside it moves to the
    // scraps canvas, but not warm dark (the shadow under the jaw), which would leave a seam under the chin
    const [y0, y1] = NECK_ROWS
    const band = ctx.getImageData(0, y0, TILE.w, y1 - y0)
    const moved = new ImageData(TILE.w, y1 - y0)
    const d = band.data
    const lum = (i: number) => 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]
    for (let row = 0; row < y1 - y0; row++) {
      const at = (col: number) => (row * TILE.w + col) * 4
      let lo = TILE.w, hi = -1
      for (let col = 0; col < TILE.w; col++) {
        const i = at(col)
        if (d[i + 3] > 128 && lum(i) > 115 && d[i] > d[i + 1]) { lo = Math.min(lo, col); hi = col }
      }
      if (hi < 0) continue
      for (let col = 0; col < TILE.w; col++) {
        const i = at(col)
        if ((col < lo - 1 || col > hi + 1) && lum(i) < 120 && d[i] < d[i + 1] + 12) {
          moved.data.set(d.subarray(i, i + 4), i)
          d[i + 3] = 0
        }
      }
    }
    ctx.putImageData(band, 0, y0)
    cut.clearRect(0, 0, TILE.w, TILE.h)
    cut.putImageData(moved, 0, y0)
  }

  const pick = () => {
    const c = Math.round(((1 - x.get()) / 2) * (COLS - 1))
    const r = Math.round(((y.get() + 1) / 2) * (ROWS - 1))
    const next = r * COLS + c
    const img = poses.current[next]
    if (next === shown.current || !img?.complete || !img.naturalWidth) return // keep the last pose while one loads
    draw(img)
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
      if (i === MID) img.onload = () => shown.current === MID && draw(img) // the lens needs a head before the first turn
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
      // suit lens: CSS variables on the stage, so the mask follows the pointer without re-rendering
      const s = stage.current
      if (!s) return
      const b = s.getBoundingClientRect()
      const inside = e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom
      s.style.setProperty('--lx', `${e.clientX - b.left}px`)
      s.style.setProperty('--ly', `${e.clientY - b.top}px`)
      s.style.setProperty('--lr', inside ? `${b.width * 0.2}px` : '0px')
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduceMotion, loadAll, tx, ty])

  return (
    // square stage that fits the box like object-contain, pinned to the bottom
    <div ref={ref} className="relative h-full w-full [container-type:size]">
      <motion.div
        ref={stage}
        className="absolute bottom-0 left-1/2 aspect-square -translate-x-1/2"
        style={{ width: 'min(100cqw, 100cqh)', x: shiftX, y: shiftY }}
      >
        {/* the masks only kick in once the lens exists; full-stage wrappers keep mask coordinates on the stage */}
        <div className="absolute inset-0" style={lensOn ? BODY_MASK : undefined}>
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
        </div>
        {lensOn && (
          // only fine pointers set the lens variables, so on touch these stay fully masked
          <>
            <div className="absolute inset-0" style={SCRAPS_MASK}>
              <canvas ref={scraps} width={TILE.w} height={TILE.h} aria-hidden="true" className="absolute" style={BOX} />
            </div>
            <img
              src={SUIT}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full"
              style={{ maskImage: LENS, WebkitMaskImage: LENS }}
            />
          </>
        )}
      </motion.div>
    </div>
  )
})
