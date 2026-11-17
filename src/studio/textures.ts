import * as THREE from 'three'

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
  texture.anisotropy = 4
  return texture
}

/** Main monitor: the project wall, small enough to read as an app grid. */
export const projectsTexture = () =>
  make(900, 560, (ctx, w, h) => {
    ctx.fillStyle = '#0d1422'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#e8eef1'
    ctx.font = '700 30px "Inter", system-ui, sans-serif'
    ctx.fillText('selected work', 40, 66)
    ctx.fillStyle = '#5f7186'
    ctx.font = '600 16px "JetBrains Mono", monospace'
    ctx.fillText('06 projects · 2024 — 2026', 40, 96)

    const tiles = [
      ['DailyBoost AI', '#7f5bd6'],
      ['SAKIP', '#2f8f8a'],
      ['Interview AI', '#c07a3e'],
      ['Carta AI', '#3f6fb0'],
      ['DentaVision', '#3f9b6a'],
      ['Rinegetan', '#a34b63'],
    ]
    tiles.forEach(([label, color], i) => {
      const x = 40 + (i % 3) * 278
      const y = 132 + Math.floor(i / 3) * 196
      ctx.fillStyle = '#141d2f'
      ctx.beginPath()
      ctx.roundRect(x, y, 250, 168, 12)
      ctx.fill()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(x + 18, y + 18, 60, 60, 8)
      ctx.fill()
      ctx.fillStyle = '#dbe5ea'
      ctx.font = '600 21px "Inter", system-ui, sans-serif'
      ctx.fillText(label, x + 18, y + 118)
      ctx.fillStyle = '#4d6076'
      ctx.font = '500 15px "JetBrains Mono", monospace'
      ctx.fillText('live · case study', x + 18, y + 146)
    })
  })

/** Whiteboard: the stack, drawn like the sketch it is. */
export const boardTexture = () =>
  make(1024, 600, (ctx, w, h) => {
    ctx.fillStyle = '#e9e6d9'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1f6f6b'
    ctx.font = '700 54px "Big Shoulders Display", "Arial Narrow", sans-serif'
    ctx.fillText('ADRIEL / SYSTEMS', 56, 90)
    ctx.strokeStyle = '#8fb3ae'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(56, 116)
    ctx.lineTo(700, 116)
    ctx.stroke()

    ctx.font = '600 27px "JetBrains Mono", monospace'
    const rows = [
      ['frontend', 'React · Next.js · Tailwind'],
      ['backend', 'Laravel · Node · PostgreSQL'],
      ['mobile', 'React Native · Expo'],
      ['ai', 'Gemini · RAG · evals'],
    ]
    rows.forEach(([left, right], i) => {
      ctx.fillStyle = '#2a6f6a'
      ctx.fillText(left, 60, 182 + i * 52)
      ctx.fillStyle = '#4c5560'
      ctx.fillText(right, 300, 182 + i * 52)
    })

    // data flow sketch
    const box = (x: number, y: number, label: string) => {
      ctx.fillStyle = '#fffdf6'
      ctx.strokeStyle = '#1f6f6b'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(x, y, 150, 62, 8)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#1f6f6b'
      ctx.font = '600 22px "JetBrains Mono", monospace'
      ctx.fillText(label, x + 18, y + 39)
    }
    box(70, 430, 'client')
    box(300, 430, 'api')
    box(530, 430, 'postgres')
    ctx.strokeStyle = '#b4693a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(222, 461)
    ctx.lineTo(298, 461)
    ctx.moveTo(452, 461)
    ctx.lineTo(528, 461)
    ctx.stroke()
    ctx.fillStyle = '#b4693a'
    ctx.font = '600 20px "JetBrains Mono", monospace'
    ctx.fillText('never skip the middle layer', 706, 466)
  })

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

/** One certificate face, reused for every frame on the wall. */
export const certificateTexture = () =>
  make(300, 380, (ctx, w, h) => {
    ctx.fillStyle = '#f2eee2'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#1f6f6b'
    ctx.lineWidth = 6
    ctx.strokeRect(16, 16, w - 32, h - 32)
    ctx.fillStyle = '#1f6f6b'
    ctx.font = '700 22px "Big Shoulders Display", "Arial Narrow", sans-serif'
    ctx.fillText('CERTIFICATE', 34, 70)
    ctx.fillStyle = '#4c5560'
    ctx.font = '600 13px "JetBrains Mono", monospace'
    ctx.fillText('of completion', 34, 94)
    ctx.fillStyle = '#8b939b'
    for (let i = 0; i < 4; i++) ctx.fillRect(34, 140 + i * 22, 190 - i * 18, 8)
    ctx.fillStyle = '#b4693a'
    ctx.beginPath()
    ctx.arc(150, 288, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f2eee2'
    ctx.font = '700 26px "Inter", system-ui, sans-serif'
    ctx.fillText('A', 140, 298)
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
