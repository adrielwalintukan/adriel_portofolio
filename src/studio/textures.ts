import * as THREE from 'three'
import { EXPERIENCE_TIMELINE } from '@/lib/constants'
import type { Phase } from './daylight'

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

const WINDOW_SKY: Record<Phase, { sky: [string, string, string]; city: string; lit: number; orb: string; orbY: number }> = {
  night: { sky: ['#0a1730', '#143247', '#2b4a52'], city: '#0b1420', lit: 90, orb: '#dfe9ec', orbY: 120 },
  dawn: { sky: ['#8fb6cf', '#e9b38f', '#f3c29b'], city: '#3a3550', lit: 25, orb: '#ffe7c2', orbY: 470 },
  day: { sky: ['#5f9fcf', '#9ccbe4', '#cfe6f0'], city: '#5d7488', lit: 0, orb: '#fff6dc', orbY: 110 },
  dusk: { sky: ['#2c2350', '#7b4a6e', '#f0a35e'], city: '#2a2338', lit: 50, orb: '#ffcf8a', orbY: 430 },
}

/** The view out of the window at the current time in Manado: sky, sun or moon, and the city below. */
export const windowTexture = (phase: Phase = 'night') =>
  make(512, 640, (ctx, w, h) => {
    const look = WINDOW_SKY[phase]
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, look.sky[0])
    sky.addColorStop(0.55, look.sky[1])
    sky.addColorStop(1, look.sky[2])
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = look.orb
    ctx.beginPath()
    ctx.arc(380, look.orbY, 34, 0, Math.PI * 2)
    ctx.fill()
    if (phase === 'night') {
      ctx.fillStyle = 'rgba(223,233,236,0.25)'
      for (let i = 0; i < 40; i++) {
        ctx.beginPath()
        ctx.arc((i * 137) % w, (i * 83) % 380, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    if (phase === 'day') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      for (const [x, y, r] of [
        [110, 150, 30],
        [150, 140, 38],
        [195, 152, 28],
        [300, 250, 22],
        [335, 244, 30],
        [368, 254, 20],
      ]) {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.fillStyle = look.city
    for (let i = 0; i < 16; i++) {
      const bw = 26 + ((i * 17) % 34)
      const bh = 90 + ((i * 53) % 220)
      ctx.fillRect(i * 34 - 8, h - bh, bw, bh)
    }
    ctx.fillStyle = 'rgba(255,206,138,0.75)'
    for (let i = 0; i < look.lit; i++) {
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

/** A visitor's note for the guest book board: the message word-wrapped, signed at the bottom. */
export const guestNoteTexture = (paper: string, ink: string, message: string, name: string) =>
  make(256, 256, (ctx, w, h) => {
    ctx.fillStyle = paper
    ctx.fillRect(0, 0, w, h)
    const fold = ctx.createLinearGradient(0, 0, 0, 40)
    fold.addColorStop(0, 'rgba(0,0,0,0.12)')
    fold.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = fold
    ctx.fillRect(0, 0, w, 40)
    ctx.fillStyle = ink
    ctx.font = '500 19px "JetBrains Mono", monospace'
    const lines: string[] = []
    for (const word of message.split(' ')) {
      const last = lines[lines.length - 1]
      if (last !== undefined && ctx.measureText(`${last} ${word}`).width <= w - 40) lines[lines.length - 1] = `${last} ${word}`
      else lines.push(word)
    }
    lines.slice(0, 6).forEach((line, i) => ctx.fillText(line, 20, 62 + i * 26, w - 40))
    ctx.font = '700 18px "JetBrains Mono", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`— ${name}`, w - 20, h - 24, w - 40)
  })

/** The guest book board's title card. */
export const guestTitleTexture = () =>
  make(512, 96, (ctx, w, h) => {
    ctx.fillStyle = '#f3efe4'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1f6f6b'
    ctx.textAlign = 'center'
    ctx.font = '700 52px "Big Shoulders Display", "Arial Narrow", sans-serif'
    ctx.fillText('GUEST BOOK', w / 2, 58)
    ctx.fillStyle = '#b4693a'
    ctx.font = '600 17px "JetBrains Mono", monospace'
    ctx.fillText('click to leave a note', w / 2, 84)
  })

/**
 * The neon sign: a tube-style outline of the name on a transparent ground, with the letters spaced a little apart.
 * Drawn in white so the sign's material colour tints it; a click on the sign cycles that colour.
 */
export const neonTexture = () =>
  make(560, 160, (ctx, w, h) => {
    const text = 'ADRIEL'
    const gap = 16
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = '700 118px "Big Shoulders Display", "Arial Narrow", sans-serif'
    ctx.lineJoin = 'round'
    const widths = [...text].map((c) => ctx.measureText(c).width)
    const x = (w - widths.reduce((a, b) => a + b, 0) - gap * (text.length - 1)) / 2
    const draw = (stroke: string, width: number, blur: number) => {
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = blur
      ctx.strokeStyle = stroke
      ctx.lineWidth = width
      let cx = x
      ;[...text].forEach((c, i) => {
        ctx.strokeText(c, cx, h / 2 + 4)
        cx += widths[i] + gap
      })
    }
    draw('#9a9a9a', 9, 22)
    draw('#ffffff', 3, 0)
  })

/** Cork: warm brown with a scatter of darker flecks. */
export const corkTexture = () =>
  make(512, 384, (ctx, w, h) => {
    ctx.fillStyle = '#b88a5a'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = i % 3 ? 'rgba(90,58,30,0.35)' : 'rgba(230,200,150,0.35)'
      ctx.fillRect((i * 151) % w, (i * 97 + ((i * 13) % 7)) % h, 2 + (i % 3), 2)
    }
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
