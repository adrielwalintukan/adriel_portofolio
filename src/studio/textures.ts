import * as THREE from 'three'
import { EXPERIENCE_TIMELINE } from '@/lib/constants'

/**
 * Screens, boards and poster art are painted on 2D canvases and used as textures: no image
 * downloads, and the text stays crisp when the camera flies in. Client-only (called from the canvas).
 */
const make = (w: number, h: number, paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  paint(ctx, w, h)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16
  return texture
}

/**
 * Whiteboard: the experience timeline, written in marker. The right third and the top-left corner
 * stay clear for the pinned notes. Repaints once the web fonts arrive so the lettering is right.
 */
export const boardTexture = () => {
  const paint = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = '#e9e6d9'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1f6f6b'
    ctx.font = '700 104px "Big Shoulders Display", "Arial Narrow", sans-serif'
    ctx.fillText('EXPERIENCE', 290, 150)
    ctx.strokeStyle = '#8fb3ae'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(290, 186)
    ctx.lineTo(1300, 186)
    ctx.stroke()

    // the timeline: a marker line with a dot per entry, newest first
    const top = 300
    const gap = 232
    ctx.strokeStyle = '#b4693a'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(130, top - 20)
    ctx.lineTo(130, top + gap * (EXPERIENCE_TIMELINE.length - 1) + 20)
    ctx.stroke()
    EXPERIENCE_TIMELINE.forEach((item, i) => {
      const y = top + i * gap
      ctx.fillStyle = '#e9e6d9'
      ctx.strokeStyle = '#b4693a'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.arc(130, y, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#b4693a'
      ctx.font = '600 34px "JetBrains Mono", monospace'
      ctx.fillText(`${item.year}  ·  ${item.category}`, 190, y + 12)
      ctx.fillStyle = '#1d2a33'
      ctx.font = '700 66px "Big Shoulders Display", "Arial Narrow", sans-serif'
      ctx.fillText(item.title, 190, y + 84, 1150)
      ctx.fillStyle = '#4c5560'
      ctx.font = '500 34px "JetBrains Mono", monospace'
      ctx.fillText(item.role, 190, y + 132, 1150)
    })
  }
  const texture = make(2048, 1210, paint)
  const canvas = texture.image as HTMLCanvasElement
  void document.fonts?.ready.then(() => {
    paint(canvas.getContext('2d')!, canvas.width, canvas.height)
    texture.needsUpdate = true
  })
  return texture
}

/** Window at night: a soft city below, so the room feels lived in. */
export const windowTexture = () =>
  make(512, 640, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#0a1730')
    sky.addColorStop(0.55, '#143247')
    sky.addColorStop(1, '#2b4a52')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#dfe9ec'
    ctx.beginPath()
    ctx.arc(380, 120, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(223,233,236,0.25)'
    for (let i = 0; i < 40; i++) {
      ctx.beginPath()
      ctx.arc((i * 137) % w, (i * 83) % 380, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = '#0b1420'
    for (let i = 0; i < 16; i++) {
      const bw = 26 + ((i * 17) % 34)
      const bh = 90 + ((i * 53) % 220)
      ctx.fillRect(i * 34 - 8, h - bh, bw, bh)
    }
    ctx.fillStyle = 'rgba(255,206,138,0.75)'
    for (let i = 0; i < 90; i++) {
      ctx.fillRect(8 + ((i * 61) % 480), h - 30 - ((i * 97) % 260), 5, 6)
    }
  })

/** A paper pinned to the board: coloured stock with a few handwritten-looking lines. */
export const noteTexture = (paper: string, ink: string, lines: string[]) =>
  make(256, 256, (ctx, w, h) => {
    ctx.fillStyle = paper
    ctx.fillRect(0, 0, w, h)
    // a faint fold shadow along the top, where the pin holds it
    const fold = ctx.createLinearGradient(0, 0, 0, 40)
    fold.addColorStop(0, 'rgba(0,0,0,0.12)')
    fold.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = fold
    ctx.fillRect(0, 0, w, 40)
    ctx.fillStyle = ink
    ctx.font = '600 30px "JetBrains Mono", monospace'
    lines.forEach((line, i) => ctx.fillText(line, 24, 88 + i * 46))
  })

/** A polaroid of the night skyline: white border, a deeper bottom lip. */
export const polaroidTexture = () =>
  make(256, 300, (ctx, w, h) => {
    ctx.fillStyle = '#f6f3ea'
    ctx.fillRect(0, 0, w, h)
    const sky = ctx.createLinearGradient(0, 18, 0, 238)
    sky.addColorStop(0, '#12304a')
    sky.addColorStop(1, '#3fb0b7')
    ctx.fillStyle = sky
    ctx.fillRect(18, 18, w - 36, 220)
    ctx.fillStyle = '#0b1420'
    for (let i = 0; i < 9; i++) ctx.fillRect(18 + i * 25, 238 - (40 + ((i * 37) % 90)), 20, 40 + ((i * 37) % 90))
    ctx.fillStyle = '#4c5560'
    ctx.font = '600 22px "JetBrains Mono", monospace'
    ctx.fillText('manado', 24, 276)
  })

/** Phone lock screen: the time over a dusk gradient, with a notification card. */
export const phoneTexture = () =>
  make(240, 480, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#12304a')
    sky.addColorStop(1, '#1f6f6b')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#f3efe4'
    ctx.textAlign = 'center'
    ctx.font = '600 22px "JetBrains Mono", monospace'
    const now = new Date()
    ctx.fillText(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), w / 2, 92)
    ctx.font = '700 84px "Big Shoulders Display", "Arial Narrow", sans-serif'
    ctx.fillText(now.toTimeString().slice(0, 5), w / 2, 178)
    ctx.fillStyle = 'rgba(243, 239, 228, 0.16)'
    ctx.beginPath()
    ctx.roundRect(18, 236, w - 36, 74, 14)
    ctx.fill()
    ctx.fillStyle = '#f3efe4'
    ctx.textAlign = 'left'
    ctx.font = '600 17px "JetBrains Mono", monospace'
    ctx.fillText('GitHub', 34, 266)
    ctx.font = '400 15px "JetBrains Mono", monospace'
    ctx.fillText('CI passed on main', 34, 292)
    ctx.fillStyle = 'rgba(243, 239, 228, 0.7)'
    ctx.fillRect(w / 2 - 40, h - 22, 80, 5)
  })

/** Wood floor planks, tiled across the room. */
export const floorTexture = () => {
  const texture = make(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#6b4a33'
    ctx.fillRect(0, 0, w, h)
    for (let row = 0; row < 8; row++) {
      const y = row * 64
      ctx.fillStyle = row % 2 ? '#6f4d35' : '#674730'
      ctx.fillRect(0, y, w, 64)
      ctx.strokeStyle = '#4f3524'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
      // plank seam, staggered per row
      const seam = (row * 173) % w
      ctx.beginPath()
      ctx.moveTo(seam, y)
      ctx.lineTo(seam, y + 64)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.moveTo(0, y + 12 + i * 10)
        ctx.bezierCurveTo(120, y + 8 + i * 10, 380, y + 16 + i * 10, w, y + 10 + i * 10)
        ctx.stroke()
      }
    }
  })
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 3)
  return texture
}
