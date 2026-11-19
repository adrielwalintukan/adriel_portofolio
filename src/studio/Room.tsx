import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  SCREEN_PX,
  TV_PICKS,
  charPos,
  deskOverlay,
  screenPower,
  dogPet,
  fxLevel,
  pointerDrag,
  roomFx,
  terminalLog,
  tvOverlay,
  type StationId,
  type TvMode,
} from './data'
import { CERTIFICATES_DATA } from '@/lib/constants'
import type { Note } from '@/lib/guestbook'
import { BALL_R, COLS as BREAKOUT_COLS, PADDLE_HALF, PADDLE_Y, brickAt, newGame, stepBreakout, type BreakoutState } from './breakout'
import { POOL, moving, shoot, step, table, type Hit } from './pool'
import { togglePhase, usePhase } from './daylight'
import { DESKTOP_ICONS } from './os/icons'
import { quadMatrix } from './quad'
import { bark, musicPulse, poolSound, unlock } from './sound'
import { PROMPT, TERM_COLORS, type TermLine } from './terminal'
import {
  boardTexture,
  corkTexture,
  floorTexture,
  guestNoteTexture,
  guestTitleTexture,
  neonTexture,
  noteTexture,
  spineTexture,
  phoneTexture,
  polaroidTexture,
  windowTexture,
} from './textures'

const C = {
  floor: '#6b4a33',
  wall: '#33424b',
  wainscot: '#21383a',
  trim: '#cfc7b6',
  wood: '#8a5d3b',
  woodDark: '#4a3225',
  metal: '#2b3138',
  dark: '#141b24',
  cream: '#d9d2c2',
  rug: '#6f2531',
  rugTrim: '#c2a98b',
  accent: '#3fb0b7',
  sofa: '#2c4a4d',
  sofaLight: '#35595b',
} as const

const ACCENT_LIGHT = '#7fd6b8'

/** Floor footprint: walls stay at x -6 and z -6, the open edges stop at x 5.4 and z 4.9. */
const ROOM = { cx: -0.3, cz: -0.55, w: 11.4, d: 10.9 }
/** The lounge is laid out in its own coordinates; this pushes it back against the rack and tower, 15% bigger. */
const LOUNGE_AT: Vec3 = [-1.45, 0, 0.85]
const LOUNGE_SCALE = 1.15

type Vec3 = [number, number, number]
type HotspotProps = {
  station: StationId
  label: string
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
  children: ReactNode
}

/** Wraps the furniture that opens a station: hover names it, click flies there. */
function Hotspot({ station, label, onPick, onHover, children }: HotspotProps) {
  const leaveTimer = useRef<number | undefined>(undefined)
  return (
    <group
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leaveTimer.current)
        onHover(label, e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leaveTimer.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return // that was a drag, not a click
        onPick(station)
      }}
    >
      {children}
    </group>
  )
}

function Box({
  position,
  size,
  color,
  rotation,
  roughness = 0.85,
  metalness = 0,
}: {
  position: Vec3
  size: Vec3
  color: string
  rotation?: Vec3
  roughness?: number
  metalness?: number
}) {
  const [w, h, d] = size
  // softly rounded edges catch the light like real furniture instead of reading as flat cards
  const geometry = useMemo(
    () => new RoundedBoxGeometry(w, h, d, 3, Math.min(0.03, Math.min(w, h, d) * 0.3)),
    [w, h, d]
  )
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

const corner = new THREE.Vector3()
const quad: [number, number][] = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
]

/**
 * Lays an HTML overlay (SCREEN_PX in size) exactly over a screen plane of halfW × halfH, at whatever
 * angle the camera sees it. Called every frame, so the box follows the camera's glide.
 */
const pinToScreen = (
  el: HTMLElement,
  plane: THREE.Object3D,
  halfW: number,
  halfH: number,
  camera: THREE.Camera,
  size: { width: number; height: number }
) => {
  const local = [
    [-halfW, halfH],
    [halfW, halfH],
    [halfW, -halfH],
    [-halfW, -halfH],
  ]
  local.forEach(([x, y], i) => {
    plane.localToWorld(corner.set(x, y, 0)).project(camera)
    quad[i][0] = ((corner.x + 1) / 2) * size.width
    quad[i][1] = ((1 - corner.y) / 2) * size.height
  })
  el.style.transform = `matrix3d(${quadMatrix(SCREEN_PX.w, SCREEN_PX.h, quad).join(',')})`
  el.style.visibility = 'visible'
}

/** The main monitor's desktop as seen from the room: the same wallpaper, icons and taskbar as the live one. */
const DESK_ICON_COLORS: Record<string, string> = {
  explorer: '#d9a44a',
  photos: '#8fcfc9',
  projects: '#3fb0b7',
  about: '#dbe5ea',
  terminal: '#7fd6b8',
  bin: '#a7b0bd',
}

const paintDesk = (ctx: CanvasRenderingContext2D) => {
  const { w, h } = SCREEN_PX
  const wall = ctx.createLinearGradient(0, 0, w, h)
  wall.addColorStop(0, '#0b1626')
  wall.addColorStop(1, '#14283a')
  ctx.fillStyle = wall
  ctx.fillRect(0, 0, w, h)
  const glow = ctx.createRadialGradient(w * 0.2, h * 0.15, 10, w * 0.2, h * 0.15, w * 0.5)
  glow.addColorStop(0, 'rgba(63,176,183,0.28)')
  glow.addColorStop(1, 'rgba(63,176,183,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // six icons in two columns, like the live desktop
  ctx.textAlign = 'center'
  DESKTOP_ICONS.forEach((icon, i) => {
    const cx = 12 + 43 + (i % 2) * 90
    const y = 12 + Math.floor(i / 2) * 100
    ctx.fillStyle = DESK_ICON_COLORS[icon.id]
    ctx.beginPath()
    ctx.roundRect(cx - 20, y + 8, 40, 34, 6)
    ctx.fill()
    ctx.fillStyle = '#eef2f3'
    ctx.font = '600 13px ui-monospace, monospace'
    ctx.fillText(icon.label, cx, y + 66)
  })

  const bar = 40
  ctx.fillStyle = 'rgba(10,16,28,0.95)'
  ctx.fillRect(0, h - bar, w, bar)
  ctx.fillStyle = '#3fb0b7'
  ctx.beginPath()
  ctx.roundRect(12, h - bar + 9, 22, 22, 5)
  ctx.fill()
  ctx.fillStyle = '#06202a'
  ctx.font = '900 15px ui-monospace, monospace'
  ctx.fillText('A', 23, h - bar + 26)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#a7b0bd'
  ctx.font = '600 14px ui-monospace, monospace'
  const time = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit' })
  ctx.fillText(time, w - 14, h - 22)
  ctx.fillStyle = '#5f7186'
  ctx.font = '600 10px ui-monospace, monospace'
  ctx.fillText('WITA', w - 14, h - 9)
}

// the desktop canvas, created on first use and repainted once a minute for the clock
let desk: { ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture } | null = null
const deskScreen = () => {
  if (!desk) {
    const canvas = document.createElement('canvas')
    canvas.width = SCREEN_PX.w
    canvas.height = SCREEN_PX.h
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 16
    desk = { ctx: canvas.getContext('2d')!, texture }
  }
  return desk
}

/** Deterministic pseudo-random so the shelf looks the same on every visit. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const BOOK_COLORS = [
  '#a24b3a',
  '#3f6d6a',
  '#c8a25a',
  '#5a5f8a',
  '#7d8c5a',
  '#8a5a3b',
  '#a9b0a2',
  '#6b4a63',
]

/** Ceiling-free room: two walls, so the isometric camera can look straight in. */
const RoomShell = memo(function RoomShell() {
  const floor = useMemo(() => floorTexture(), [])
  return (
    <group>
      {/* the whole room stands on a thick diorama base, so the floor reads as a slab; the floor runs
          from the walls (x -6, z -6) to the open edges (x 5.4, z 4.9) */}
      <Box
        position={[ROOM.cx, -0.55, ROOM.cz]}
        size={[ROOM.w + 0.4, 0.8, ROOM.d + 0.4]}
        color="#241811"
      />
      <Box
        position={[ROOM.cx, -0.15, ROOM.cz]}
        size={[ROOM.w + 0.58, 0.14, ROOM.d + 0.58]}
        color="#3a2719"
      />
      <Box
        position={[ROOM.cx, -0.026, ROOM.cz]}
        size={[ROOM.w + 0.7, 0.05, ROOM.d + 0.7]}
        color="#b8a48a"
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROOM.cx, 0, ROOM.cz]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial map={floor} roughness={0.9} />
      </mesh>

      {/* back and left walls, with a darker wainscot band like the reference room */}
      <Box position={[ROOM.cx, 2.5, -6.1]} size={[ROOM.w + 0.4, 5, 0.2]} color={C.wall} />
      <Box position={[ROOM.cx, 0.55, -5.98]} size={[ROOM.w + 0.2, 1.1, 0.06]} color={C.wainscot} />
      <Box position={[ROOM.cx, 1.12, -5.96]} size={[ROOM.w + 0.2, 0.07, 0.1]} color={C.trim} />

      <Box position={[-6.1, 2.5, ROOM.cz]} size={[0.2, 5, ROOM.d + 0.4]} color={C.wall} />
      <Box position={[-5.98, 0.55, ROOM.cz]} size={[0.06, 1.1, ROOM.d + 0.2]} color={C.wainscot} />
      <Box position={[-5.96, 1.12, ROOM.cz]} size={[0.1, 0.07, ROOM.d + 0.2]} color={C.trim} />

      {/* floor trim */}
      <Box position={[ROOM.cx, 0.06, -5.92]} size={[ROOM.w + 0.2, 0.12, 0.08]} color={C.trim} />
      <Box position={[-5.92, 0.06, ROOM.cz]} size={[0.08, 0.12, ROOM.d + 0.2]} color={C.trim} />

      {/* rug: pulled up toward the desk and the shelf, clear of the lounge rug on its right */}
      <Box position={[-1.0, 0.02, -0.35]} size={[4.4, 0.04, 3.8]} color={C.rug} />
      <Box position={[-1.0, 0.045, -0.35]} size={[3.9, 0.01, 3.3]} color={C.rugTrim} />
      <Box position={[-1.0, 0.052, -0.35]} size={[3.5, 0.01, 2.9]} color={C.rug} />
    </group>
  )
})

/** The live terminal: a fixed script that types itself out, so the screen is never a still image. */
const TERM = { w: 640, h: 400 }

const TERM_COLS = 56
const TERM_ROWS = 13

/** The terminal's history plus the line being typed, hard-wrapped to the screen and cut to the last rows. */
const paintTerminal = (ctx: CanvasRenderingContext2D, time: number) => {
  ctx.fillStyle = '#0b111c'
  ctx.fillRect(0, 0, TERM.w, TERM.h)
  ctx.font = '600 17px ui-monospace, monospace'
  const rows: TermLine[] = []
  for (const [text, color] of [
    ...terminalLog.lines,
    [PROMPT + terminalLog.input, TERM_COLORS.prompt] as TermLine,
  ]) {
    for (let i = 0; i === 0 || i < text.length; i += TERM_COLS)
      rows.push([text.slice(i, i + TERM_COLS), color])
  }
  const shown = rows.slice(-TERM_ROWS)
  shown.forEach(([text, color], i) => {
    ctx.fillStyle = color
    ctx.fillText(text, 26, 40 + i * 26)
  })
  if (Math.floor(time * 2) % 2 === 0) {
    const last = shown[shown.length - 1][0]
    ctx.fillStyle = TERM_COLORS.prompt
    ctx.fillRect(26 + ctx.measureText(last).width + 2, 40 + (shown.length - 1) * 26 - 15, 10, 19)
  }
}

let terminalCanvas: { ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture } | null = null
const terminalScreen = () => {
  if (!terminalCanvas) {
    const canvas = document.createElement('canvas')
    canvas.width = TERM.w
    canvas.height = TERM.h
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 16
    terminalCanvas = { ctx: canvas.getContext('2d')!, texture }
  }
  return terminalCanvas
}

/** Keycap layout: four full rows, then a bottom row with a long space bar. Width is in key units. */
const KEYS = (() => {
  const keys: { x: number; z: number; w: number; color: string }[] = []
  const pitch = 0.058
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 15; col++) {
      const accent = (row === 0 && col === 0) || (row === 2 && col === 14)
      keys.push({
        x: -0.406 + col * pitch,
        z: -0.1 + row * 0.052,
        w: 1,
        color: accent ? '#3fb0b7' : '#2a313b',
      })
    }
  }
  const bottom = [1, 1, 1, 6.4, 1, 1, 1]
  let x = -0.435
  bottom.forEach((w) => {
    const width = w * 0.05 + (w - 1) * 0.008
    keys.push({ x: x + width / 2, z: 0.108, w, color: '#2a313b' })
    x += width + 0.008
  })
  return keys
})()

/** Mechanical keyboard: one instanced mesh for all 67 keycaps, so it costs a single draw call. */
const Keyboard = memo(function Keyboard({ position }: { position: Vec3 }) {
  const caps = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    const mesh = caps.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const color = new THREE.Color()
    KEYS.forEach((key, i) => {
      m.makeScale(key.w + (key.w - 1) * 0.16, 1, 1).setPosition(key.x, 0, key.z)
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, color.set(key.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])
  return (
    <group position={position}>
      <Box position={[0, 0.014, 0]} size={[0.94, 0.028, 0.3]} color="#14181f" />
      <instancedMesh
        ref={caps}
        args={[undefined, undefined, KEYS.length]}
        position={[0, 0.038, 0]}
        castShadow
      >
        <boxGeometry args={[0.05, 0.02, 0.046]} />
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
      {/* a soft underglow along the front edge */}
      <mesh position={[0, 0.006, 0.152]}>
        <boxGeometry args={[0.9, 0.006, 0.004]} />
        <meshStandardMaterial
          color={C.accent}
          emissive={C.accent}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
})

/** Mouse on a desk mat: a domed body with a lit scroll wheel. */
const Mouse = memo(function Mouse({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <Box position={[0, 0.003, 0]} size={[0.38, 0.006, 0.32]} color="#1b2330" />
      <mesh position={[0, 0.022, 0]} scale={[0.62, 0.36, 1]} castShadow>
        <sphereGeometry args={[0.055, 32, 24]} />
        <meshStandardMaterial color="#20262f" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.042, -0.022]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.012, 16]} />
        <meshStandardMaterial
          color={C.accent}
          emissive={C.accent}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
})

/** Game pad: two grips, a d-pad, four face buttons, two sticks, a touch pad and a light bar. */
const Gamepad = memo(function Gamepad() {
  return (
    <group>
      <Box position={[0, 0.025, 0]} size={[0.2, 0.05, 0.12]} color="#1d2430" />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.1, 0.022, 0.045]}
          rotation={[Math.PI / 2 - 0.25, 0, side * 0.4]}
          castShadow
        >
          <capsuleGeometry args={[0.038, 0.07, 8, 16]} />
          <meshStandardMaterial color="#1d2430" roughness={0.6} />
        </mesh>
      ))}
      <Box position={[0, 0.052, -0.012]} size={[0.09, 0.006, 0.055]} color="#2a3442" />
      <Box position={[-0.07, 0.053, 0]} size={[0.042, 0.008, 0.013]} color="#0f141b" />
      <Box position={[-0.07, 0.053, 0]} size={[0.013, 0.008, 0.042]} color="#0f141b" />
      {[
        [0.07, -0.016],
        [0.07, 0.016],
        [0.054, 0],
        [0.086, 0],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.054, z]}>
          <sphereGeometry args={[0.008, 16, 12]} />
          <meshStandardMaterial color="#c9d1d9" roughness={0.4} />
        </mesh>
      ))}
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 0.06, 0.036]}>
          <cylinderGeometry args={[0.015, 0.013, 0.022, 24]} />
          <meshStandardMaterial color="#0f141b" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.042, -0.062]}>
        <boxGeometry args={[0.08, 0.008, 0.004]} />
        <meshStandardMaterial
          color={C.accent}
          emissive={C.accent}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
})

/** Gaming desk: two screens on low arms, an RGB tower, a headset — the projects station. */
/* --- terminal easter eggs: green rain on the monitors, confetti over the desk ---------------- */

let matrix: { ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture; drops: number[]; last: number } | null = null
const matrixScreen = () => {
  if (!matrix) {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 180
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    matrix = { ctx: canvas.getContext('2d')!, texture, drops: Array.from({ length: 32 }, () => Math.random() * -20), last: 0 }
  }
  return matrix
}
const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ADRIEL'

/** Sits over a monitor's screen; shown only while `matrix` runs. Both monitors share one canvas. */
const MatrixScreen = ({ position, size }: { position: Vec3; size: [number, number] }) => {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const m = matrixScreen()
    const on = fxLevel('matrix') > 0
    if (mesh.current) mesh.current.visible = on
    const now = performance.now()
    if (!on || now - m.last < 50) return
    m.last = now
    const { ctx } = m
    ctx.fillStyle = 'rgba(2, 10, 6, 0.25)'
    ctx.fillRect(0, 0, 320, 180)
    ctx.font = '700 11px "JetBrains Mono", monospace'
    m.drops.forEach((y, i) => {
      ctx.fillStyle = i % 5 ? '#3fdc7f' : '#c8ffd9'
      ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], i * 10, y * 11)
      m.drops[i] = y * 11 > 180 && Math.random() > 0.93 ? 0 : y + 1
    })
    m.texture.needsUpdate = true
  })
  return (
    <mesh ref={mesh} position={position} visible={false}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={matrixScreen().texture} toneMapped={false} />
    </mesh>
  )
}

const CONFETTI = 70
const CONFETTI_COLORS = ['#3fb0b7', '#e8c66a', '#b4693a', '#f3efe4', '#8fcfc9']
const CONFETTI_BITS = Array.from({ length: CONFETTI }, () => ({
  x: 0.2 + Math.random() * 2.4,
  z: -4.9 + Math.random() * 1.4,
  speed: 0.6 + Math.random() * 0.6,
  spin: Math.random() * 6,
}))
/** A burst of paper squares falling over the desk while `sudo hire adriel` plays. */
const Confetti = memo(function Confetti() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    CONFETTI_BITS.forEach((_, i) => mesh.current?.setColorAt(i, new THREE.Color(CONFETTI_COLORS[i % CONFETTI_COLORS.length])))
  }, [])
  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const on = fxLevel('hire') > 0
    m.visible = on
    if (!on) return
    const t = (performance.now() - roomFx.at) / 1000
    CONFETTI_BITS.forEach((b, i) => {
      dummy.position.set(b.x + Math.sin(t * 2 + i) * 0.08, 3.6 - ((t * b.speed + i * 0.037) % 1) * 2.6, b.z)
      dummy.rotation.set(t * b.spin, t * b.spin * 0.7, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CONFETTI]} visible={false}>
      <planeGeometry args={[0.05, 0.05]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
})

// the PC's lighting: one colour per click, after the default rainbow
const PC_COLORS = ['#3fb0b7', '#ffb35a', '#e58aa5', '#a794f0', '#7fd6a0', '#ffffff'].map((c) => new THREE.Color(c))
// the case has glass on both sides with the motherboard down the middle: the main parts (cooler, RAM, graphics
// card) on the +x side and a radiator, drives and cables on the -x side. Only their lights and fans glow, in the
// PC's colour; everything else is dark metal.
type PcPart = { at: Vec3; size?: Vec3; ring?: number; color?: string; glow?: boolean }
const PC_PARTS: PcPart[] = [
  { at: [-0.02, 0.46, -0.04], size: [0.008, 0.66, 0.6], color: '#14221f' }, // motherboard
  { at: [-0.0, 0.46, -0.33], size: [0.04, 0.66, 0.05], color: '#2c343f' }, // rear I/O shield
  // +x side
  { at: [0.04, 0.64, -0.14], size: [0.09, 0.12, 0.11], color: '#4a5461' }, // CPU cooler
  { at: [0.088, 0.64, -0.14], ring: 0.045, glow: true }, // its fan
  ...[0, 1, 2, 3].flatMap((k): PcPart[] => [
    { at: [0.0, 0.66, 0.0 + k * 0.028], size: [0.03, 0.15, 0.009], color: '#2d3540' }, // RAM stick
    { at: [0.015, 0.742, 0.0 + k * 0.028], size: [0.012, 0.02, 0.012], glow: true }, // its light bar
  ]),
  { at: [0.05, 0.32, 0.03], size: [0.1, 0.1, 0.5], color: '#323b47' }, // graphics card
  { at: [0.102, 0.32, -0.1], ring: 0.037, glow: true },
  { at: [0.102, 0.32, 0.15], ring: 0.037, glow: true },
  { at: [0.1, 0.372, 0.03], size: [0.008, 0.008, 0.46], glow: true }, // its light strip
  // -x side
  { at: [-0.12, 0.6, 0.22], size: [0.03, 0.34, 0.14], color: '#2d3540' }, // radiator
  { at: [-0.142, 0.69, 0.22], ring: 0.05, glow: true }, // its two fans
  { at: [-0.142, 0.52, 0.22], ring: 0.05, glow: true },
  { at: [-0.07, 0.3, -0.12], size: [0.012, 0.1, 0.08], color: '#252c36' }, // two drives
  { at: [-0.07, 0.3, 0.0], size: [0.012, 0.1, 0.08], color: '#252c36' },
  { at: [-0.078, 0.3, -0.12], size: [0.004, 0.016, 0.05], glow: true },
  { at: [-0.078, 0.3, 0.0], size: [0.004, 0.016, 0.05], glow: true },
  { at: [-0.05, 0.5, -0.27], size: [0.012, 0.3, 0.012], color: '#05070a' }, // cables
  { at: [-0.05, 0.4, -0.2], size: [0.012, 0.012, 0.16], color: '#05070a' },
  // across the bottom
  { at: [0, 0.095, 0], size: [0.4, 0.14, 0.64], color: '#1a2029' }, // power supply shroud
  { at: [0.19, 0.168, 0], size: [0.006, 0.006, 0.58], glow: true }, // shroud edge lights
  { at: [-0.19, 0.168, 0], size: [0.006, 0.006, 0.58], glow: true },
]
const PC_GLOW_COUNT = PC_PARTS.filter((p) => p.glow).length
// light strips down the two front corners of the case
const PC_EDGES: { at: Vec3; size: Vec3 }[] = [
  { at: [-0.226, 0.42, 0.376], size: [0.007, 0.76, 0.007] },
  { at: [0.226, 0.42, 0.376], size: [0.007, 0.76, 0.007] },
]

const Desk = memo(function Desk({
  onPick,
  onHover,
  onLook,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
  onLook: (view: 'terminal' | 'sideboard' | 'billiards') => void
}) {
  const screen = deskScreen()
  const glass = useRef<THREE.Mesh>(null)
  const painted = useRef(-1)
  const steam = useRef<THREE.Group>(null)
  const tower = useRef<THREE.Mesh[]>([])
  const strips = useRef<THREE.Mesh[]>([])
  const pcMode = useRef(0)
  const pcLeave = useRef<number | undefined>(undefined)
  // black covers in front of both screens while AdrielOS is shut down
  const blanks = useRef<THREE.Mesh[]>([])
  const live = terminalScreen()
  const termPaint = useRef(0)
  const phone = useMemo(() => phoneTexture(), [])

  useFrame(({ clock, camera, size }, delta) => {
    const t = clock.elapsedTime
    blanks.current.forEach((m) => {
      if (m) m.visible = !screenPower.on
    })
    const minute = Math.floor(Date.now() / 60_000)
    if (painted.current !== minute) {
      painted.current = minute
      paintDesk(deskScreen().ctx)
      deskScreen().texture.needsUpdate = true
    }
    if (deskOverlay.el && glass.current)
      pinToScreen(deskOverlay.el, glass.current, 0.695, 0.385, camera, size)
    if (steam.current) {
      steam.current.children.forEach((child, i) => {
        const p = (t * 0.35 + i / 3) % 1
        child.position.y = 1.22 + p * 0.45
        child.position.x = 2.75 + Math.sin(p * 6 + i) * 0.05
        child.scale.setScalar(0.05 + p * 0.06)
        const puff = child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
        puff.material.opacity = 0.32 * (1 - p)
      })
    }
    // the terminal keeps logging, so the second screen is never a frozen picture
    termPaint.current += Math.min(delta, 0.05)
    if (termPaint.current > 0.12) {
      termPaint.current = 0
      paintTerminal(terminalScreen().ctx, t)
      terminalScreen().texture.needsUpdate = true
    }
    // RGB: the hue drifts once every 20 s, and each kick of the music flashes it brighter
    const beat = musicPulse()
    const hue = (t / 20) % 1
    const solid = pcMode.current > 0 ? PC_COLORS[pcMode.current - 1] : null
    ;[...tower.current, ...strips.current].forEach((mesh, i) => {
      if (!mesh) return
      const m = mesh.material as THREE.MeshStandardMaterial
      // a click on the PC picks one colour for all of it; the default is the drifting rainbow
      if (solid) m.color.copy(solid)
      else m.color.setHSL((hue + i * (i < 3 ? 0.12 : 0.05)) % 1, 0.7, 0.55)
      m.emissive.copy(m.color)
      // the parts inside the case glow more quietly than the fans on the front
      m.emissiveIntensity = (i < 3 ? 1.2 : 1.3) + Math.sin(t * 2 + i * 1.7) * 0.25 + beat * (i < 3 ? 2 : 1.2)
    })
  })

  return (
    <Hotspot station="projects" label="Projects — the screens" onPick={onPick} onHover={onHover}>
      <group>
        {/* desk: narrower than the old workbench, angled like a gaming setup */}
        <Box position={[1.4, 1.0, -4.62]} size={[3.3, 0.08, 1.12]} color={C.wood} />
        <Box position={[1.4, 0.98, -4.62]} size={[3.24, 0.02, 1.06]} color="#1d2733" />
        {/* LED strips under the front lip and along the back edge */}
        {([
          [1.4, 0.952, -4.07],
          [1.4, 1.048, -5.16],
        ] as Vec3[]).map((at, i) => (
          <mesh
            key={i}
            position={at}
            ref={(m) => {
              if (m) strips.current[i] = m
            }}
          >
            <boxGeometry args={[3.2, 0.012, 0.014]} />
            <meshStandardMaterial color="#3fb0b7" emissive="#3fb0b7" emissiveIntensity={1.2} toneMapped={false} />
          </mesh>
        ))}
        <Box position={[-0.14, 0.48, -4.62]} size={[0.1, 0.96, 1.02]} color={C.woodDark} />
        <Box position={[2.94, 0.48, -4.62]} size={[0.1, 0.96, 1.02]} color={C.woodDark} />
        <Box position={[1.4, 0.6, -5.1]} size={[3.06, 0.72, 0.06]} color={C.woodDark} />

        {/* main monitor: short arm, so the panel sits just above the desk */}
        <Box position={[1.95, 1.06, -4.92]} size={[0.42, 0.04, 0.28]} color={C.metal} />
        <Box position={[1.95, 1.2, -4.96]} size={[0.07, 0.24, 0.07]} color={C.metal} />
        <Box position={[1.95, 1.68, -4.94]} size={[1.5, 0.86, 0.06]} color={C.dark} />
        <mesh ref={glass} position={[1.95, 1.68, -4.905]}>
          <planeGeometry args={[1.39, 0.77]} />
          <meshStandardMaterial
            map={screen.texture}
            emissive="#ffffff"
            emissiveMap={screen.texture}
            emissiveIntensity={0.55}
            toneMapped={false}
          />
        </mesh>
        <MatrixScreen position={[1.95, 1.68, -4.9]} size={[1.39, 0.77]} />
        <mesh position={[1.95, 1.68, -4.898]} visible={false} ref={(m) => { if (m) blanks.current[0] = m }}>
          <planeGeometry args={[1.39, 0.77]} />
          <meshBasicMaterial color="#030508" />
        </mesh>

        {/* second screen: the live terminal, turned toward him; clicking it turns the camera to it */}
        <group
          position={[0.42, 0, -4.9]}
          rotation={[0, 0.24, 0]}
          onClick={(e) => {
            e.stopPropagation()
            if (pointerDrag.moved > 6) return
            onLook('terminal')
          }}
        >
          <Box position={[0, 1.05, 0]} size={[0.34, 0.035, 0.24]} color={C.metal} />
          <Box position={[0, 1.16, -0.02]} size={[0.06, 0.19, 0.06]} color={C.metal} />
          <Box position={[0, 1.55, 0]} size={[1.12, 0.68, 0.05]} color={C.dark} />
          <mesh position={[0, 1.55, 0.03]}>
            <planeGeometry args={[1.03, 0.6]} />
            <meshStandardMaterial
              map={live.texture}
              emissive="#ffffff"
              emissiveMap={live.texture}
              emissiveIntensity={0.7}
              toneMapped={false}
            />
          </mesh>
          <MatrixScreen position={[0, 1.55, 0.034]} size={[1.03, 0.6]} />
          <mesh position={[0, 1.55, 0.036]} visible={false} ref={(m) => { if (m) blanks.current[1] = m }}>
            <planeGeometry args={[1.03, 0.6]} />
            <meshBasicMaterial color="#030508" />
          </mesh>
        </group>

        {/* keyboard and mouse, pulled to the desk edge where his hands land; the notebook */}
        <Keyboard position={[1.3, 1.04, -4.22]} />
        <Mouse position={[1.98, 1.04, -4.22]} />
        <Box
          position={[0.08, 1.05, -4.36]}
          size={[0.42, 0.03, 0.32]}
          color={C.cream}
          rotation={[0, -0.2, 0]}
        />

        {/* phone face up beside the mouse, its lock screen lit */}
        <group position={[2.36, 1.035, -4.3]} rotation={[0, 0.35, 0]}>
          <Box position={[0, 0.006, 0]} size={[0.08, 0.012, 0.16]} color="#151a21" metalness={0.4} roughness={0.35} />
          <mesh position={[0, 0.0125, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.072, 0.144]} />
            <meshStandardMaterial
              map={phone}
              emissive="#ffffff"
              emissiveMap={phone}
              emissiveIntensity={0.55}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* mug + steam */}
        <mesh position={[2.72, 1.13, -4.3]} castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.17, 32]} />
          <meshStandardMaterial color={C.cream} roughness={0.7} />
        </mesh>
        <group ref={steam}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[2.75, 1.22, -4.3]}>
              <sphereGeometry args={[1, 32, 24]} />
              <meshStandardMaterial color="#dfe9ec" transparent opacity={0.28} depthWrite={false} />
            </mesh>
          ))}
        </group>

        {/* VR headset resting on the desk */}
        <group position={[2.9, 1.1, -4.86]} rotation={[0, -0.5, 0]}>
          <Box position={[0, 0.05, 0]} size={[0.26, 0.1, 0.12]} color="#11161f" />
          <Box position={[0, 0.05, 0.075]} size={[0.2, 0.075, 0.02]} color="#26313d" />
          <Box position={[0, 0.05, -0.075]} size={[0.22, 0.085, 0.02]} color="#26313d" />
          <mesh position={[0, 0.05, 0.08]}>
            <boxGeometry args={[0.14, 0.014, 0.01]} />
            <meshStandardMaterial
              color={ACCENT_LIGHT}
              emissive={ACCENT_LIGHT}
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>
          {/* head strap looping back, and the two ring controllers beside it */}
          <mesh position={[0, 0.06, -0.14]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.8, 1]}>
            <torusGeometry args={[0.11, 0.014, 12, 48]} />
            <meshStandardMaterial color="#2a313b" roughness={0.8} />
          </mesh>
          {[-0.22, 0.24].map((x, i) => (
            <group key={x} position={[x, 0.02, 0.06]} rotation={[Math.PI / 2, 0, i * 0.6]}>
              <mesh>
                <torusGeometry args={[0.04, 0.008, 12, 32]} />
                <meshStandardMaterial color="#20262f" roughness={0.5} />
              </mesh>
              <mesh position={[0, -0.05, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.014, 0.016, 0.07, 16]} />
                <meshStandardMaterial color="#20262f" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>

        {/* RGB tower, standing at the right end of the desk, fans facing the room */}
        <group
          position={[3.24, 0, -4.5]}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation()
            window.clearTimeout(pcLeave.current)
            onHover('PC — change the lighting', e.nativeEvent.clientX, e.nativeEvent.clientY)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            pcLeave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (pointerDrag.moved > 6) return
            pcMode.current = (pcMode.current + 1) % (PC_COLORS.length + 1)
          }}
        >
          {/* the case: closed panels top, bottom, back and front; glass on both sides */}
          <Box position={[0, 0.834, 0]} size={[0.46, 0.012, 0.74]} color="#12181f" />
          <Box position={[0, 0.012, 0]} size={[0.46, 0.024, 0.74]} color="#12181f" />
          <Box position={[0, 0.42, -0.364]} size={[0.46, 0.84, 0.012]} color="#12181f" />
          <Box position={[0, 0.42, 0.364]} size={[0.46, 0.84, 0.012]} color="#12181f" />
          <Box position={[0, 0.42, 0.372]} size={[0.38, 0.72, 0.014]} color="#0a0e13" />
          {/* what is inside */}
          {PC_PARTS.map((part, k) => {
            const glowIndex = PC_PARTS.slice(0, k).filter((p) => p.glow).length
            const glowing = part.glow
            const material = glowing ? (
              <meshStandardMaterial color="#3fb0b7" emissive="#3fb0b7" emissiveIntensity={1} toneMapped={false} />
            ) : (
              <meshStandardMaterial color={part.color} roughness={0.55} metalness={0.5} />
            )
            return (
              <mesh
                key={k}
                position={part.at}
                rotation={part.ring ? [0, Math.PI / 2, 0] : undefined}
                ref={
                  glowing
                    ? (m) => {
                        if (m) tower.current[3 + glowIndex] = m
                      }
                    : undefined
                }
              >
                {part.ring ? <torusGeometry args={[part.ring, 0.0065, 10, 40]} /> : <boxGeometry args={part.size} />}
                {material}
              </mesh>
            )
          })}
          {/* the glass sides: a faint tint and sheen over the parts */}
          {[1, -1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.229, 0.42, 0]} rotation={[0, (side * Math.PI) / 2, 0]}>
                <planeGeometry args={[0.72, 0.82]} />
                <meshStandardMaterial color="#9db8c6" transparent opacity={0.1} roughness={0.08} metalness={0.4} depthWrite={false} />
              </mesh>
              <Box position={[side * 0.229, 0.84, 0]} size={[0.006, 0.01, 0.74]} color="#222a33" />
              <Box position={[side * 0.229, 0.004, 0]} size={[0.006, 0.01, 0.74]} color="#222a33" />
            </group>
          ))}
          {/* light strips down the two front corners */}
          {PC_EDGES.map((edge, k) => (
            <mesh
              key={k}
              ref={(m) => {
                if (m) tower.current[3 + PC_GLOW_COUNT + k] = m
              }}
              position={edge.at}
            >
              <boxGeometry args={edge.size} />
              <meshStandardMaterial color="#3fb0b7" emissive="#3fb0b7" emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
          ))}
          {[0.66, 0.46, 0.26].map((y, i) => (
            <mesh
              key={y}
              ref={(m) => {
                if (m) tower.current[i] = m
              }}
              position={[0, y, 0.382]}
            >
              <torusGeometry args={[0.12, 0.015, 12, 48]} />
              <meshStandardMaterial
                color={i === 0 ? '#3fb0b7' : i === 1 ? '#7f5bd6' : '#c07a3e'}
                emissive={i === 0 ? '#3fb0b7' : i === 1 ? '#7f5bd6' : '#c07a3e'}
                emissiveIntensity={1.6}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>

        {/* gaming chair: high back behind him, wings, five-star base */}
        <group position={[1.3, 0, -3.56]}>
          <Box position={[0, 0.66, 0.04]} size={[0.7, 0.12, 0.72]} color="#191f2a" />
          <Box
            position={[0, 0.98, 0.38]}
            size={[0.62, 0.64, 0.11]}
            color="#191f2a"
            rotation={[-0.16, 0, 0]}
          />
          <Box
            position={[0, 0.98, 0.36]}
            size={[0.28, 0.56, 0.1]}
            color="#26313d"
            rotation={[-0.16, 0, 0]}
          />
          {[-0.3, 0.3].map((x) => (
            <Box
              key={x}
              position={[x, 0.95, 0.3]}
              size={[0.11, 0.36, 0.15]}
              color="#26313d"
              rotation={[-0.1, 0, 0]}
            />
          ))}
          <Box position={[0, 0.72, 0.42]} size={[0.46, 0.26, 0.09]} color={C.accent} />
          <Box position={[0, 0.3, 0]} size={[0.09, 0.56, 0.09]} color={C.metal} />
          {/* five-star base on casters (chair-local, like the rest of the chair) */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i / 5) * Math.PI * 2
            return (
              <group key={i} rotation={[0, angle, 0]}>
                <Box position={[0.16, 0.07, 0]} size={[0.32, 0.04, 0.05]} color={C.metal} />
                <mesh position={[0.3, 0.035, 0]} castShadow>
                  <sphereGeometry args={[0.035, 16, 12]} />
                  <meshStandardMaterial color="#0f141b" roughness={0.5} />
                </mesh>
              </group>
            )
          })}
        </group>
      </group>
    </Hotspot>
  )
})

/** Bookshelf against the left wall — the skills station. */
// real books a developer's shelf might hold, set dressing only: a title on the spine, the author on hover
const SHELF_BOOKS = [
  ['Clean Code', 'Robert C. Martin'],
  ['The Pragmatic Programmer', 'Andrew Hunt, David Thomas'],
  ['Designing Data-Intensive Applications', 'Martin Kleppmann'],
  ['Refactoring', 'Martin Fowler'],
  ['Eloquent JavaScript', 'Marijn Haverbeke'],
  ["You Don't Know JS", 'Kyle Simpson'],
  ["Don't Make Me Think", 'Steve Krug'],
  ['The Design of Everyday Things', 'Don Norman'],
  ['Atomic Habits', 'James Clear'],
  ['Code Complete', 'Steve McConnell'],
  ['Clean Architecture', 'Robert C. Martin'],
  ['Laravel: Up & Running', 'Matt Stauffer'],
  ['Python Crash Course', 'Eric Matthes'],
  ['Introduction to Algorithms', 'Cormen, Leiserson, Rivest, Stein'],
  ['The Mythical Man-Month', 'Frederick P. Brooks Jr.'],
  ['Cracking the Coding Interview', 'Gayle Laakmann McDowell'],
  ['Learning React', 'Alex Banks, Eve Porcello'],
  ['Head First Design Patterns', 'Freeman, Robson'],
] as const

const Shelf = memo(function Shelf({
  onPick,
  onHover,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const books = useMemo(() => {
    const random = seeded(7)
    const rows: { position: Vec3; size: Vec3; color: string; title?: readonly [string, string] }[] = []
    for (let shelf = 0; shelf < 5; shelf++) {
      let z = -4.35
      while (z < -1.35) {
        const thickness = 0.07 + random() * 0.08
        const height = 0.32 + random() * 0.16
        if (random() > 0.12) {
          rows.push({
            position: [-5.62, 0.42 + shelf * 0.62 + height / 2, z + thickness / 2],
            size: [0.34, height, thickness],
            color: BOOK_COLORS[Math.floor(random() * BOOK_COLORS.length)],
          })
        }
        z += thickness + 0.012
      }
    }
    // about every ninth book gets a real title, spread over the shelves
    let named = 0
    rows.forEach((row, i) => {
      if (i % 9 === 4 && named < SHELF_BOOKS.length) row.title = SHELF_BOOKS[named++]
    })
    return rows
  }, [])
  const leave = useRef<number | undefined>(undefined)

  return (
    <Hotspot station="skills" label="Skills — the shelf" onPick={onPick} onHover={onHover}>
      <group>
        {/* carcass */}
        <Box position={[-5.62, 1.72, -4.4]} size={[0.5, 3.44, 0.09]} color={C.woodDark} />
        <Box position={[-5.62, 1.72, -1.3]} size={[0.5, 3.44, 0.09]} color={C.woodDark} />
        <Box position={[-5.84, 1.72, -2.85]} size={[0.05, 3.44, 3.2]} color={C.woodDark} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Box
            key={i}
            position={[-5.62, 0.34 + i * 0.62, -2.85]}
            size={[0.46, 0.06, 3.1]}
            color={C.wood}
          />
        ))}
        {books.map((b, i) => (
          <group key={i}>
            <Box position={b.position} size={b.size} color={b.color} />
            {b.title && (
              <mesh
                position={[b.position[0] + b.size[0] / 2 + 0.002, b.position[1], b.position[2]]}
                rotation={[0, Math.PI / 2, 0]}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                  e.stopPropagation()
                  window.clearTimeout(leave.current)
                  onHover(`${b.title![0]} — ${b.title![1]}`, e.nativeEvent.clientX, e.nativeEvent.clientY)
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
                }}
              >
                <planeGeometry args={[b.size[2], b.size[1]]} />
                <meshStandardMaterial map={spineTexture(b.title[0], b.color)} roughness={0.8} />
              </mesh>
            )}
          </group>
        ))}
        {/* a few horizontal stacks, like the reference shelf */}
        <Box position={[-5.62, 1.68, -4.05]} size={[0.3, 0.09, 0.5]} color="#c8a25a" />
        <Box
          position={[-5.62, 1.78, -4.02]}
          size={[0.28, 0.08, 0.46]}
          color="#a24b3a"
          rotation={[0, 0.1, 0]}
        />
      </group>
    </Hotspot>
  )
})

/** Whiteboard on the back wall — the experience station. */
const Board = memo(function Board({
  onPick,
  onHover,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const board = useMemo(() => boardTexture(), [])
  return (
    <Hotspot station="experience" label="Experience — the board" onPick={onPick} onHover={onHover}>
      <group>
        <Box position={[-1.9, 2.62, -5.94]} size={[3.5, 2.14, 0.06]} color={C.trim} />
        <mesh position={[-1.9, 2.62, -5.9]}>
          <planeGeometry args={[3.32, 1.96]} />
          <meshStandardMaterial map={board} roughness={0.95} />
        </mesh>
        {/* marker tray */}
        <Box position={[-1.9, 1.5, -5.84]} size={[3.2, 0.06, 0.14]} color={C.trim} />
        <Box position={[-2.4, 1.55, -5.84]} size={[0.2, 0.04, 0.04]} color="#1f6f6b" />
        <Box position={[-2.1, 1.55, -5.84]} size={[0.2, 0.04, 0.04]} color="#b4693a" />
        <PinBoard />
      </group>
    </Hotspot>
  )
})

/** One straight length of thread between two pins. */
function Thread({ from, to }: { from: Vec3; to: Vec3 }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = b.clone().sub(a)
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
      length: dir.length(),
    }
  }, [from, to])
  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.0035, 0.0035, length, 6]} />
      <meshStandardMaterial color="#b03a2e" roughness={0.8} />
    </mesh>
  )
}

// pinned to the empty top-right of the board and one corner hanging off its frame; z is the board's face
const BOARD_Z = -5.885
const NOTES: { at: [number, number]; size: [number, number]; tilt: number; paper: string; ink: string; lines: string[]; pin: string }[] = [
  { at: [-1.05, 3.28], size: [0.3, 0.3], tilt: 0.07, paper: '#e8c66a', ink: '#5a4520', lines: ['ship it', 'small'], pin: '#c0392b' },
  { at: [-0.5, 3.3], size: [0.28, 0.28], tilt: -0.09, paper: '#8fcfc9', ink: '#1d4f4b', lines: ['test', 'first'], pin: '#c0392b' },
  { at: [-0.8, 2.72], size: [0.42, 0.28], tilt: 0.03, paper: '#fbfaf5', ink: '#4c5560', lines: ['why > how', 'read the', 'error'], pin: '#1f6f6b' },
  { at: [-3.43, 3.52], size: [0.28, 0.28], tilt: -0.14, paper: '#e9a77f', ink: '#5a2c18', lines: ['todo', 'sleep'], pin: '#1f6f6b' },
]
const PHOTO = { at: [-0.4, 2.55] as [number, number], size: [0.24, 0.28] as [number, number], tilt: -0.1 }
// the pins sit near each paper's top edge; one more marks the latest entry of the timeline
const pinOf = (at: [number, number], size: [number, number]): Vec3 => [at[0], at[1] + size[1] / 2 - 0.035, BOARD_Z + 0.02]
const ENTRY_PIN: Vec3 = [-1.32, 3.1, BOARD_Z + 0.02]

/** Cork-board corner of the whiteboard: notes, an index card and a photo, pinned and strung together. */
const PinBoard = memo(function PinBoard() {
  const faces = useMemo(() => NOTES.map((n) => noteTexture(n.paper, n.ink, n.lines)), [])
  const photo = useMemo(() => polaroidTexture(), [])
  useEffect(() => () => [...faces, photo].forEach((t) => t.dispose()), [faces, photo])
  const pins = [...NOTES.map((n) => pinOf(n.at, n.size)), pinOf(PHOTO.at, PHOTO.size), ENTRY_PIN]
  // note, note, card, photo, then down to the sketch: the red string a planning board always has
  const strings: [number, number][] = [
    [0, 2],
    [2, 1],
    [1, 4],
    [2, 5],
    [4, 5],
  ]
  return (
    <group>
      {NOTES.map((n, i) => (
        <mesh key={i} position={[n.at[0], n.at[1], BOARD_Z + 0.004 + i * 0.001]} rotation={[0, 0, n.tilt]} castShadow>
          <planeGeometry args={n.size} />
          <meshStandardMaterial map={faces[i]} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[PHOTO.at[0], PHOTO.at[1], BOARD_Z + 0.009]} rotation={[0, 0, PHOTO.tilt]} castShadow>
        <planeGeometry args={PHOTO.size} />
        <meshStandardMaterial map={photo} roughness={0.6} />
      </mesh>
      {pins.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.018, 16, 12]} />
          <meshStandardMaterial
            color={i < NOTES.length ? NOTES[i].pin : '#c0392b'}
            roughness={0.35}
            metalness={0.1}
          />
        </mesh>
      ))}
      {strings.map(([a, b]) => (
        <Thread key={`${a}-${b}`} from={pins[a]} to={pins[b]} />
      ))}
    </group>
  )
})

// the guest book: a cork board on the left wall between the bookshelf and the certificates
const GUEST_AT: Vec3 = [-5.9, 2.6, -0.5]
const GUEST_PAPER = ['#e8c66a', '#8fcfc9', '#e9a77f', '#fbfaf5']
const GUEST_INK = ['#5a4520', '#1d4f4b', '#5a2c18', '#4c5560']
const GUEST_SLOTS: [number, number, number][] = [-0.42, -0.14, 0.14, 0.42].flatMap((x, col) =>
  [0.1, -0.22].map((y, row): [number, number, number] => [x, y, ((col * 2 + row) % 3) * 0.05 - 0.05])
)

/** Visitors' notes, pinned to cork. A click opens the form; the page fetches and posts the notes. */
const GuestBoard = memo(function GuestBoard({
  notes,
  onSign,
  onHover,
}: {
  notes: Note[]
  onSign: () => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const leave = useRef<number | undefined>(undefined)
  const cork = useMemo(() => corkTexture(), [])
  const title = useMemo(() => guestTitleTexture(), [])
  const faces = useMemo(
    () =>
      notes.length
        ? notes.slice(0, GUEST_SLOTS.length).map((n, i) =>
            guestNoteTexture(GUEST_PAPER[i % GUEST_PAPER.length], GUEST_INK[i % GUEST_INK.length], n.message, n.name)
          )
        : [guestNoteTexture('#fbfaf5', '#4c5560', 'Be the first to sign the guest book.', 'Adriel')],
    [notes]
  )
  useEffect(() => () => faces.forEach((t) => t.dispose()), [faces])
  useEffect(() => () => [cork, title].forEach((t) => t.dispose()), [cork, title])
  return (
    <group
      position={GUEST_AT}
      rotation={[0, Math.PI / 2, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leave.current)
        onHover('Guest book — sign it', e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        onSign()
      }}
    >
      <Box position={[0, 0, 0]} size={[1.28, 0.98, 0.05]} color={C.woodDark} />
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial map={cork} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.355, 0.031]}>
        <planeGeometry args={[0.5, 0.094]} />
        <meshStandardMaterial map={title} roughness={0.9} />
      </mesh>
      {faces.map((face, i) => {
        const [x, y, tilt] = GUEST_SLOTS[i]
        return (
          <group key={i} position={[x, y, 0.032 + i * 0.001]} rotation={[0, 0, tilt]}>
            <mesh castShadow>
              <planeGeometry args={[0.24, 0.24]} />
              <meshStandardMaterial map={face} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.095, 0.012]}>
              <sphereGeometry args={[0.015, 16, 12]} />
              <meshStandardMaterial color={i % 2 ? '#1f6f6b' : '#c0392b'} roughness={0.35} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
})

// A small salon hang of real certificates above the sideboard: two stacked on the left, the award in the
// middle, the portrait one on the right. Each slot is a box the scan is fitted into, so a landscape scan
// gets a landscape frame and a portrait one a portrait frame. The rest stay in the Awards panel.
const WALL_CERTS = [
  { id: 'cert-anthropic-ai-fluency', z: 0.72, y: 3.27, w: 0.82, h: 0.66 },
  { id: 'cert-dicoding-aws-cloud-genai', z: 0.72, y: 2.43, w: 0.82, h: 0.66 },
  { id: 'cert-proxo-appreciation', z: 2.35, y: 2.85, w: 1.34, h: 1.08, plaque: true },
  { id: 'cert-ibm-granite-code-gen', z: 3.97, y: 2.85, w: 0.96, h: 0.74 },
]

/** Frames on the left wall — the awards station, showing real certificates. */
const Frames = memo(function Frames({
  onPick,
  onHover,
  onCert,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
  onCert: (id: string) => void
}) {
  const leave = useRef<number | undefined>(undefined)
  // loaded by hand like the poster: a slow scan never holds the room back, and its frame appears with it
  const [scans, setScans] = useState<(THREE.Texture | null)[]>(() => WALL_CERTS.map(() => null))
  useEffect(() => {
    let live = true
    const loader = new THREE.TextureLoader()
    const loaded = WALL_CERTS.map((slot, i) => {
      const image = CERTIFICATES_DATA.find((c) => c.id === slot.id)?.image
      if (!image) return null
      return loader.load(image, (t) => {
        if (!live) return
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 16
        setScans((prev) => prev.map((s, j) => (j === i ? t : s)))
      })
    })
    return () => {
      live = false
      loaded.forEach((t) => t?.dispose())
    }
  }, [])

  return (
    <Hotspot station="certificates" label="Awards — the wall" onPick={onPick} onHover={onHover}>
      <group>
        {WALL_CERTS.map((slot, i) => {
          const scan = scans[i]
          const image = scan?.image as { width: number; height: number } | undefined
          if (!scan || !image) return null
          // fit the scan inside its slot without cropping, then hug it with mat and frame
          const aspect = image.width / image.height
          const w = aspect > slot.w / slot.h ? slot.w : slot.h * aspect
          const h = w / aspect
          return (
            <group
              key={slot.id}
              position={[-5.9, slot.y, slot.z]}
              rotation={[0, Math.PI / 2, 0]}
              // a frame opens its own certificate; the wall around them still opens the list
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation()
                window.clearTimeout(leave.current)
                const title = CERTIFICATES_DATA.find((c) => c.id === slot.id)?.title ?? 'Certificate'
                onHover(title, e.nativeEvent.clientX, e.nativeEvent.clientY)
              }}
              onPointerOut={(e) => {
                e.stopPropagation()
                leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (pointerDrag.moved > 6) return
                onCert(slot.id)
              }}
            >
              <Box position={[0, 0, 0]} size={[w + 0.16, h + 0.16, 0.05]} color="#2a1d16" roughness={0.6} />
              <Box position={[0, 0, 0.012]} size={[w + 0.11, h + 0.11, 0.035]} color="#b58a4a" roughness={0.4} metalness={0.5} />
              <mesh position={[0, 0, 0.031]}>
                <planeGeometry args={[w + 0.08, h + 0.08]} />
                <meshStandardMaterial color="#f4f1e8" roughness={0.95} />
              </mesh>
              <mesh position={[0, 0, 0.033]}>
                <planeGeometry args={[w, h]} />
                <meshStandardMaterial map={scan} roughness={1} metalness={0} envMapIntensity={0.2} />
              </mesh>
              {slot.plaque && (
                <Box position={[0, -h / 2 - 0.17, 0.01]} size={[0.34, 0.07, 0.015]} color="#b58a4a" roughness={0.35} metalness={0.6} />
              )}
            </group>
          )
        })}
      </group>
    </Hotspot>
  )
})

/** Wall poster: the portrait Adriel already has, framed. Clicking it flies the camera in. */
const Poster = memo(function Poster({
  onPick,
  onHover,
}: {
  onPick: () => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const leave = useRef<number | undefined>(undefined)
  // loaded by hand rather than suspended on: a slow poster must never hold the whole room hostage
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    let live = true
    const loader = new THREE.TextureLoader()
    const loaded = loader.load('/images/studio-poster.webp', (t) => {
      if (!live) {
        t.dispose()
        return
      }
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 16
      setTexture(t)
    })
    return () => {
      live = false
      loaded.dispose()
    }
  }, [])
  return (
    <group
      position={[1.9, 3.55, -5.92]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leave.current)
        onHover('Portrait — take a closer look', e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        onPick()
      }}
    >
      <Box position={[0, 0, 0]} size={[1.5, 1.5, 0.06]} color={C.woodDark} />
      {texture && (
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.34, 1.34]} />
          <meshStandardMaterial map={texture} roughness={0.8} />
        </mesh>
      )}
    </group>
  )
})

// rain streaks on the glass: one tall canvas that scrolls down while it rains
let rainSheet: THREE.CanvasTexture | null = null
const rainTexture = () => {
  if (!rainSheet) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = 'rgba(200, 225, 240, 0.55)'
    ctx.lineWidth = 1.4
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 512
      const len = 10 + Math.random() * 22
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - len * 0.15, y + len)
      ctx.stroke()
    }
    rainSheet = new THREE.CanvasTexture(canvas)
    rainSheet.wrapS = rainSheet.wrapT = THREE.RepeatWrapping
  }
  return rainSheet
}

/** Window onto Manado at the real time of day; on some visits (or after `rain`) it rains outside. */
const Window = memo(function Window({ onHover }: { onHover: (label: string | null, x: number, y: number) => void }) {
  const leave = useRef<number | undefined>(undefined)
  const phase = usePhase()
  const sky = useMemo(() => windowTexture(phase), [phase])
  useEffect(() => () => sky.dispose(), [sky])
  const rain = useRef<THREE.Mesh>(null)
  useEffect(() => {
    roomFx.rain = Math.random() < 1 / 3
  }, [])
  useFrame((_, delta) => {
    if (!rain.current) return
    rain.current.visible = roomFx.rain
    if (roomFx.rain) rainTexture().offset.y += Math.min(delta, 0.05) * 1.5
  })
  return (
    <group
      position={[4.0, 3.0, -5.94]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leave.current)
        onHover(phase === 'night' || phase === 'dawn' ? 'Window — switch to day' : 'Window — switch to night', e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        const next = togglePhase()
        onHover(next === 'day' ? 'Window — switch to night' : 'Window — switch to day', e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
    >
      <mesh ref={rain} position={[0, 0, 0.055]} visible={false}>
        <planeGeometry args={[1.66, 2.26]} />
        <meshBasicMaterial map={rainTexture()} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      </mesh>
      <Box position={[0, 0, 0]} size={[1.9, 2.5, 0.08]} color={C.trim} />
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[1.66, 2.26]} />
        <meshStandardMaterial
          map={sky}
          emissive="#ffffff"
          emissiveMap={sky}
          emissiveIntensity={0.35}
          toneMapped={false}
        />
      </mesh>
      <Box position={[0, 0.02, 0.07]} size={[0.06, 2.3, 0.02]} color={C.trim} />
      <Box position={[0, 0.12, 0.07]} size={[1.7, 0.06, 0.02]} color={C.trim} />
      <Box position={[0, -1.32, 0.12]} size={[2.02, 0.1, 0.3]} color={C.trim} />
    </group>
  )
})

/** Small server rack with blinking LEDs, for the hum of the place. */
// the rack's status screen: real numbers from this page, redrawn twice a second
let rackCanvas: { ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture } | null = null
const rackScreen = () => {
  if (!rackCanvas) {
    const canvas = document.createElement('canvas')
    canvas.width = 384
    canvas.height = 128
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    rackCanvas = { ctx: canvas.getContext('2d')!, texture }
  }
  return rackCanvas
}
const clockText = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Makassar', hour12: false })
const uptimeText = () => {
  const s = Math.floor(performance.now() / 1000)
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')
}

const paintRack = (ctx: CanvasRenderingContext2D, lines: string[], page: string) => {
  ctx.fillStyle = '#06100d'
  ctx.fillRect(0, 0, 384, 128)
  ctx.font = '600 20px "JetBrains Mono", ui-monospace, monospace'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#7fd6b8'
  ctx.fillText('SERVER-01', 12, 8)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#4f8f7a'
  ctx.fillText(page, 372, 8)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#b6f0dc'
  lines.forEach((line, i) => ctx.fillText(line, 12, 38 + i * 26))
}

/** Server rack: blinking drives, and a status screen with live numbers; a click switches it to a ping test. */
const Rack = memo(function Rack({ onHover }: { onHover: (label: string | null, x: number, y: number) => void }) {
  const leds = useRef<THREE.Mesh[]>([])
  const leave = useRef<number | undefined>(undefined)
  const page = useRef<'stats' | 'ping'>('stats')
  const ping = useRef<{ ms: number | null; busy: boolean }>({ ms: null, busy: false })
  const stat = useRef({ frames: 0, since: 0, fps: 0, drawn: 0 })
  const busyUntil = useRef(0)

  // time the round trip to this site itself: three tiny requests, the fastest wins
  const runPing = async () => {
    if (ping.current.busy) return
    ping.current = { ms: null, busy: true }
    let best = Infinity
    for (let i = 0; i < 3; i++) {
      const start = performance.now()
      try {
        await fetch(`/robots.txt?ping=${Date.now()}${i}`, { cache: 'no-store' })
        best = Math.min(best, performance.now() - start)
      } catch {
        /* offline: no number */
      }
    }
    ping.current = { ms: Number.isFinite(best) ? Math.round(best) : null, busy: false }
  }

  useFrame(({ clock, gl }) => {
    const t = clock.elapsedTime
    // drives flicker harder for a moment after a click
    const hot = performance.now() < busyUntil.current
    leds.current.forEach((led, i) => {
      if (!led) return
      const mat = led.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = Math.sin(t * (hot ? 14 + i : 2 + i * 0.6) + i) > 0.2 ? 2.4 : 0.25
    })
    const s = stat.current
    s.frames += 1
    if (t - s.since < 0.5) return
    s.fps = Math.round(s.frames / (t - s.since))
    s.frames = 0
    s.since = t
    s.drawn = gl.info.render.calls
    const lines =
      page.current === 'stats'
        ? [
            `UP    ${uptimeText()}`,
            `TIME  ${clockText()} WITA`,
            `FPS   ${s.fps}   DRAW ${s.drawn}`,
            `TRI   ${gl.info.render.triangles.toLocaleString('en-US')}`,
          ]
        : [
            'PING  /robots.txt',
            ping.current.busy ? 'measuring...' : ping.current.ms === null ? 'no answer' : `${ping.current.ms} ms`,
            'click: back to stats',
          ]
    const screen = rackScreen()
    paintRack(screen.ctx, lines, page.current === 'stats' ? 'STATS' : 'PING')
    screen.texture.needsUpdate = true
  })
  return (
    <group
      position={[4.9, 0, -4.9]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leave.current)
        onHover('Server — click to switch stats and ping', e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        busyUntil.current = performance.now() + 1500
        if (page.current === 'stats') {
          page.current = 'ping'
          void runPing()
        } else page.current = 'stats'
      }}
    >
      <mesh position={[0, 1.4, 0.427]}>
        <planeGeometry args={[0.74, 0.246]} />
        <meshBasicMaterial map={rackScreen().texture} toneMapped={false} />
      </mesh>
      <Box position={[0, 0.78, 0]} size={[0.86, 1.56, 0.8]} color={C.dark} />
      {[0.35, 0.62, 0.89, 1.16].map((y, i) => (
        <group key={y}>
          <Box position={[0, y, 0.42]} size={[0.74, 0.2, 0.05]} color={C.metal} />
          {[0, 1, 2].map((k) => (
            <mesh
              key={k}
              ref={(m) => {
                if (m) leds.current[i * 3 + k] = m
              }}
              position={[-0.24 + k * 0.12, y, 0.46]}
            >
              <boxGeometry args={[0.05, 0.05, 0.02]} />
              <meshStandardMaterial
                color={k === 2 ? '#7fd6b8' : C.accent}
                emissive={k === 2 ? '#7fd6b8' : C.accent}
                emissiveIntensity={1.5}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
})

const LEAF_COLORS = ['#3f7a55', '#2f6b4b', '#4b8a5f', '#2a5c42']

/** Potted plant: a woven pot, arched stems and rounded leaves instead of cones. */
const Plant = memo(function Plant({ position, tall = false }: { position: Vec3; tall?: boolean }) {
  const leaves = useMemo(() => {
    const random = seeded(tall ? 31 : 13)
    const count = tall ? 12 : 9
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + random() * 0.8,
      tilt: 0.35 + random() * 0.55,
      reach: (tall ? 0.85 : 0.42) + random() * (tall ? 0.5 : 0.26),
      size: (tall ? 0.2 : 0.15) + random() * 0.06,
      color: LEAF_COLORS[i % LEAF_COLORS.length],
    }))
  }, [tall])

  const potH = tall ? 0.8 : 0.46
  const potR = tall ? 0.3 : 0.25

  return (
    <group position={position}>
      {/* pot + soil */}
      <mesh position={[0, potH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[potR, potR * 0.76, potH, 32]} />
        <meshStandardMaterial color={tall ? '#b5895f' : '#a86f4b'} roughness={0.92} />
      </mesh>
      <mesh position={[0, potH + 0.005, 0]} receiveShadow>
        <cylinderGeometry args={[potR * 0.93, potR * 0.93, 0.05, 32]} />
        <meshStandardMaterial color="#2b1e15" roughness={1} />
      </mesh>
      <mesh position={[0, potH - 0.02, 0]}>
        <torusGeometry args={[potR * 0.99, 0.022, 12, 48]} />
        <meshStandardMaterial color={tall ? '#9c7149' : '#8e5b3d'} roughness={0.9} />
      </mesh>

      {leaves.map((leaf, i) => (
        <group key={i} position={[0, potH, 0]} rotation={[0, leaf.angle, 0]}>
          <group rotation={[0, 0, leaf.tilt]}>
            <mesh position={[0, leaf.reach / 2, 0]} castShadow>
              <cylinderGeometry args={[0.013, 0.019, leaf.reach, 32]} />
              <meshStandardMaterial color="#2f5c3c" roughness={0.9} />
            </mesh>
            <mesh
              position={[0, leaf.reach, 0.03]}
              rotation={[0.3, 0, 0]}
              scale={[1.15, 0.16, 0.66]}
              castShadow
            >
              <sphereGeometry args={[leaf.size, 32, 24]} />
              <meshStandardMaterial color={leaf.color} roughness={0.7} />
            </mesh>
            {leaf.size > 0.18 && (
              <mesh
                position={[0, leaf.reach * 0.62, 0.03]}
                rotation={[0.55, 0, 0]}
                scale={[0.85, 0.12, 0.5]}
                castShadow
              >
                <sphereGeometry args={[leaf.size * 0.72, 32, 24]} />
                <meshStandardMaterial
                  color={LEAF_COLORS[(i + 1) % LEAF_COLORS.length]}
                  roughness={0.72}
                />
              </mesh>
            )}
          </group>
        </group>
      ))}
    </group>
  )
})

const DUST_GALLERY = { center: [-4.9, 2.9, 2.4] as Vec3, size: [1.6, 1.8, 3.4] as Vec3 }
const DUST_DESK = { center: [1.4, 2.6, -4.4] as Vec3, size: [1.0, 2.0, 1.0] as Vec3 }

// random points inside a box, made outside render so the component stays pure
const scatter = (count: number, size: Vec3) =>
  Float32Array.from({ length: count * 3 }, (_, i) => (Math.random() - 0.5) * size[i % 3])

/** Dust drifting up through a cone of light. */
const Dust = memo(function Dust({ count, center, size }: { count: number; center: Vec3; size: Vec3 }) {
  const points = useRef<THREE.Points>(null)
  const start = useMemo(() => scatter(count, size), [count, size])
  useFrame(({ clock }) => {
    const p = points.current
    if (!p) return
    const t = clock.elapsedTime
    const pos = p.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      const y = ((start[i * 3 + 1] / size[1] + 0.5 + t * 0.012 + (i % 7) * 0.01) % 1) - 0.5
      pos.setXYZ(
        i,
        start[i * 3] + Math.sin(t * 0.4 + i) * 0.05,
        y * size[1],
        start[i * 3 + 2] + Math.cos(t * 0.3 + i * 1.3) * 0.05
      )
    }
    pos.needsUpdate = true
  })
  return (
    <points ref={points} position={center}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[start.slice(), 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.014}
        color="#ffe2b8"
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})

/* --- string lights, curtains and a neon sign: emissive only, they glow through bloom and add no lights ---- */
const BULBS = 28
const BULB_X = [-5.6, 5.2]
const BULB_COLORS = ['#ffd9a0', '#8fcfc9']

/** Little bulbs strung in swags along the top of the back wall; they twinkle a little. */
const FairyLights = memo(function FairyLights({ animate }: { animate: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const base = useMemo(() => BULB_COLORS.map((c) => new THREE.Color(c)), [])
  const tint = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }) => {
    const m = mesh.current
    if (!m) return
    const t = animate ? clock.elapsedTime : 0
    for (let i = 0; i < BULBS; i++) {
      const f = i / (BULBS - 1)
      // three swags: the wire sags between its hooks
      const swag = (f * 3) % 1
      dummy.position.set(BULB_X[0] + (BULB_X[1] - BULB_X[0]) * f, 4.78 - 0.2 * 4 * swag * (1 - swag) + Math.sin(t * 0.8 + i) * 0.006, -5.9)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      // above 1 so the HD bloom picks them up
      tint.copy(base[i % 2]).multiplyScalar(1.2 + 0.9 * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 2.3)))
      m.setColorAt(i, tint)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, BULBS]}>
      <sphereGeometry args={[0.035, 12, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
})

/** Two curtains either side of the window, swaying very slightly. */
const Curtains = memo(function Curtains({ animate }: { animate: boolean }) {
  const panels = useRef<THREE.Group[]>([])
  useFrame(({ clock }) => {
    const t = animate ? clock.elapsedTime : 0
    panels.current.forEach((g, i) => {
      if (g) g.rotation.z = Math.sin(t * 0.5 + i * 1.7) * 0.02
    })
  })
  return (
    <group>
      <Box position={[4.0, 4.5, -5.84]} size={[3.1, 0.04, 0.04]} color="#2a1f18" />
      {[2.9, 5.1].map((x, i) => (
        <group
          key={x}
          position={[x, 4.46, -5.84]}
          ref={(g) => {
            if (g) panels.current[i] = g
          }}
        >
          <mesh position={[0, -1.4, 0]} castShadow>
            <boxGeometry args={[0.46, 2.8, 0.05]} />
            <meshStandardMaterial color="#4b3b33" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
})

// muted colours a click cycles through; the last click starts the "broken sign" flicker, then it starts over
const NEON_COLORS = ['#5fb7bd', '#ffb35a', '#e58aa5', '#a794f0', '#7fd6a0'].map((c) => new THREE.Color(c).multiplyScalar(2.4))
const NEON_ERROR = new THREE.Color('#ff6a5a').multiplyScalar(2.4)

/** A neon name sign on the left wall above the bookshelf. Click: next colour; after the last, it flickers like a fault. */
const NeonSign = memo(function NeonSign({
  animate,
  onHover,
}: {
  animate: boolean
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const map = useMemo(() => neonTexture(), [])
  useEffect(() => () => map.dispose(), [map])
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const mode = useRef(0)
  const leave = useRef<number | undefined>(undefined)
  useFrame(({ clock }) => {
    const m = mat.current
    if (!m) return
    const t = clock.elapsedTime
    if (mode.current < NEON_COLORS.length) {
      m.color.copy(NEON_COLORS[mode.current])
      return
    }
    // a failing tube: irregular stutter, now and then dark for a moment
    const stutter = Math.sin(t * 37) + Math.sin(t * 23.7) * 0.8 > 0.2
    const dead = animate && t % 2.6 > 2.25
    m.color.copy(NEON_ERROR).multiplyScalar(animate ? (stutter && !dead ? 1 : 0.08) : 1)
  })
  const label = (next: number) => (next < NEON_COLORS.length ? 'Neon — change colour' : 'Neon — do not touch')
  return (
    <group
      position={[-5.92, 4.3, -2.85]}
      rotation={[0, Math.PI / 2, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leave.current)
        onHover(label((mode.current + 1) % (NEON_COLORS.length + 1)), e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        mode.current = (mode.current + 1) % (NEON_COLORS.length + 1)
        onHover(label((mode.current + 1) % (NEON_COLORS.length + 1)), e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
    >
      <Box position={[0, 0, -0.015]} size={[2.0, 0.62, 0.03]} color="#0b0e11" />
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[1.94, 0.56]} />
        <meshBasicMaterial ref={mat} map={map} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
})

/* --- digital wall clock above the whiteboard: the real time in Manado, to the second ------------- */
let wallClock: { ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture; second: number } | null = null
const clockScreen = () => {
  if (!wallClock) {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 144
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    wallClock = { ctx: canvas.getContext('2d')!, texture, second: -1 }
  }
  return wallClock
}
const witaParts = () =>
  new Date()
    .toLocaleTimeString('en-GB', { timeZone: 'Asia/Makassar', hour12: false })
    .split(':')

const paintClock = (ctx: CanvasRenderingContext2D, [h, m, s]: string[]) => {
  ctx.fillStyle = '#07090c'
  ctx.fillRect(0, 0, 512, 144)
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#ffa94d'
  ctx.shadowBlur = 16
  ctx.fillStyle = '#ffbe6b'
  ctx.font = '700 104px "JetBrains Mono", ui-monospace, monospace'
  ctx.textAlign = 'left'
  // the colon blinks once a second, like a real digital clock
  const colon = Number(s) % 2 === 0 ? ':' : ' '
  ctx.fillText(`${h}${colon}${m}`, 26, 74)
  ctx.font = '700 52px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText(s, 372, 54)
  ctx.shadowBlur = 0
  ctx.fillStyle = '#8a6a3a'
  ctx.font = '600 22px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText('WITA', 376, 108)
}

/** A wall clock with a digital face, hung above the whiteboard. */
const WallClock = memo(function WallClock() {
  useFrame(() => {
    const c = clockScreen()
    const parts = witaParts()
    const second = Number(parts[2])
    if (c.second === second) return
    c.second = second
    paintClock(c.ctx, parts)
    c.texture.needsUpdate = true
  })
  return (
    <group position={[-1.9, 4.22, -5.92]}>
      <Box position={[0, 0, 0]} size={[1.34, 0.4, 0.06]} color="#1b1410" />
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[1.24, 0.3]} />
        <meshBasicMaterial map={clockScreen().texture} toneMapped={false} />
      </mesh>
    </group>
  )
})

/** Gallery bar above the certificate frames: the awards wall gets the same warmth as the desk. */
const GalleryLight = memo(function GalleryLight() {
  // one soft strip as long as the bar, aimed down at the frame wall: an even wash with no hot spot
  const wash = useRef<THREE.RectAreaLight>(null)
  useEffect(() => {
    wash.current?.lookAt(-5.9, 2.7, 2.4)
  }, [])
  return (
    <group position={[-5.78, 3.92, 2.4]}>
      <rectAreaLight
        ref={wash}
        position={[0.55, -0.05, 0]}
        width={4.1}
        height={0.1}
        intensity={5.5}
        color="#ffe9cf"
      />
      <Box
        position={[0, 0.06, 0]}
        size={[0.12, 0.08, 4.4]}
        color={C.metal}
        metalness={0.3}
        roughness={0.5}
      />
      <Box position={[0, 0.0, 0]} size={[0.1, 0.05, 4.2]} color="#ffd9a0" />
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.08, 0.02, 4.1]} />
        <meshStandardMaterial
          color="#ffe2b8"
          emissive="#ffc98a"
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>
      {[-1.9, 1.9].map((z) => (
        <Box key={z} position={[0.05, 0.1, z]} size={[0.2, 0.05, 0.05]} color={C.metal} />
      ))}
    </group>
  )
})

/** Floor lamp by the sofa: a click switches it, and its warm light, on and off. */
const FloorLamp = memo(function FloorLamp({
  position,
  onHover,
}: {
  position: Vec3
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const [on, setOn] = useState(true)
  const leave = useRef<number | undefined>(undefined)
  return (
    <group
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leave.current)
        onHover(
          on ? 'Lamp — switch it off' : 'Lamp — switch it on',
          e.nativeEvent.clientX,
          e.nativeEvent.clientY
        )
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        setOn((v) => !v)
        onHover(null, 0, 0)
      }}
    >
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.21, 0.06, 32]} />
        <meshStandardMaterial color={C.metal} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 1.84, 32]} />
        <meshStandardMaterial color={C.metal} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.94, 0]} castShadow>
        <coneGeometry args={[0.3, 0.32, 32, 1, true]} />
        <meshStandardMaterial
          color="#d9d2c2"
          side={THREE.DoubleSide}
          roughness={0.8}
          emissive="#ffcf8f"
          emissiveIntensity={on ? 0.75 : 0}
        />
      </mesh>
      <mesh position={[0, 1.87, 0]}>
        <sphereGeometry args={[0.09, 32, 24]} />
        <meshStandardMaterial
          color="#ffe7bf"
          emissive="#ffc98a"
          emissiveIntensity={on ? 2.6 : 0}
          toneMapped={false}
        />
      </mesh>
      {/* intensity, not mounting, toggles the light: the scene's light count stays put, so no shader rebuild */}
      <pointLight
        position={[0, 1.8, 0]}
        intensity={on ? 9 : 0}
        distance={7}
        decay={2}
        color="#ffc48f"
      />
    </group>
  )
})

/**
 * Fabric for the bean bag: a fine woven grain, six vertical panel seams and the seam round the base.
 * Used as both colour and bump, so the seams read as stitched dips. Lathe u runs round, v runs up.
 */
let beanFabric: THREE.CanvasTexture | null = null
const beanFabricTexture = () => {
  if (beanFabric) return beanFabric
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(size, size)
  const random = seeded(11)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // a two-pixel basket weave plus grain
      const weave = ((x >> 1) + (y >> 1)) % 2 === 0 ? 4 : -4
      const v = 222 + weave + (random() - 0.5) * 10
      const i = (y * size + x) * 4
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  ctx.strokeStyle = 'rgba(70,70,70,0.85)'
  ctx.lineWidth = 3
  // panel seams sit half a panel off the lathe's start (the back), so a panel, not a seam, faces front
  for (let k = 0; k < 6; k++) {
    ctx.beginPath()
    ctx.moveTo(((k + 0.5) * size) / 6, 0)
    ctx.lineTo(((k + 0.5) * size) / 6, size)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(0, size * 0.9)
  ctx.lineTo(size, size * 0.9)
  ctx.stroke()
  beanFabric = new THREE.CanvasTexture(canvas)
  beanFabric.colorSpace = THREE.SRGBColorSpace
  beanFabric.anisotropy = 16
  return beanFabric
}

/** Side profile of the bean bag (radius, height): a wide soft bottom tapering to a rounded top. */
const BEAN_PROFILE = new THREE.SplineCurve(
  [
    [0, 0],
    [0.46, 0.012],
    [0.55, 0.09],
    [0.55, 0.22],
    [0.47, 0.4],
    [0.34, 0.58],
    [0.23, 0.73],
    [0.14, 0.85],
    [0.06, 0.93],
    [0, 0.955],
  ].map(([r, y]) => new THREE.Vector2(r, y))
).getPoints(64)

const SEAM = Math.PI / 3

/**
 * Bean bag by the bookshelf: a lathed teardrop sewn from six panels, then pushed in where you sit,
 * slumped back at the top, puckered along the seams and creased like a filled sack. Faces +z.
 */
const BeanBag = memo(function BeanBag({ position, yaw }: { position: Vec3; yaw: number }) {
  const geometry = useMemo(() => {
    // start the sweep at the back so the lathe's own join hides behind it, on a seam
    const lathe = new THREE.LatheGeometry(BEAN_PROFILE, 96, Math.PI)
    const p = lathe.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const z = p.getZ(i)
      const h = y / 0.955
      const r = Math.hypot(x, z)
      if (r < 1e-4) continue
      const a = Math.atan2(x, z) // 0 is straight ahead
      // creases, deeper low down where the filling settles; the seams pull in a little
      const creases =
        (0.014 * Math.sin(5 * a + 9 * h) * Math.sin(14 * h) + 0.008 * Math.sin(11 * a - 6 * h)) *
        (1.3 - h)
      const offSeam = Math.abs(((((a + SEAM / 2) % SEAM) + SEAM) % SEAM) - SEAM / 2) - SEAM / 2
      const pucker = h > 0.04 ? -0.012 * Math.exp(-((offSeam / 0.05) ** 2)) : 0
      const spread = 1 + 0.07 * Math.max(0, 1 - h / 0.3)
      const radius = (r + creases + pucker) * spread
      const front = Math.max(0, Math.cos(a))
      // a chair in a sack: the seat swells forward low down, then a sharp crease where the back rises
      const seat = Math.exp(-(((h - 0.2) / 0.16) ** 2)) * front ** 1.5 * 0.16
      const dent = Math.exp(-(((h - 0.5) / (h < 0.5 ? 0.17 : 0.07)) ** 2)) * front ** 1.5 * 0.36
      const roll = Math.exp(-(((h - 0.66) / 0.08) ** 2)) * front ** 2 * 0.06
      p.setX(i, Math.sin(a) * radius)
      p.setZ(i, Math.cos(a) * radius + seat - dent + roll - 0.42 * h ** 2.4)
      p.setY(i, y - dent * 0.5 - 0.14 * Math.max(0, (h - 0.65) / 0.35) ** 2)
    }
    lathe.computeVertexNormals()
    return lathe
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const fabric = beanFabricTexture()

  return (
    <mesh
      position={position}
      rotation={[0, yaw, 0]}
      scale={1.25}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color="#34363d"
        map={fabric}
        bumpMap={fabric}
        bumpScale={1.2}
        roughness={0.92}
        sheen={0.5}
        sheenRoughness={0.7}
        sheenColor="#7a808b"
      />
    </mesh>
  )
})

/** The TV's little pong match: the ball, both paddles and the score, in 0..1 screen space. */
const PONG = { w: 480, h: 300 }

const paintPong = (ctx: CanvasRenderingContext2D, s: PongState, active: boolean) => {
  const { w, h } = PONG
  ctx.fillStyle = '#071019'
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7)
  glow.addColorStop(0, 'rgba(63,176,183,0.16)')
  glow.addColorStop(1, 'rgba(7,16,25,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(63,176,183,0.3)'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 16])
  ctx.beginPath()
  ctx.moveTo(w / 2, 0)
  ctx.lineTo(w / 2, h)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.textAlign = 'center'
  ctx.fillStyle = '#e8f1f2'
  ctx.font = '700 44px ui-monospace, monospace'
  ctx.fillText(String(s.cs), w / 2 - 62, 66)
  ctx.fillText(String(s.ps), w / 2 + 62, 66)

  ctx.fillStyle = '#ffd08a'
  ctx.fillRect(s.cpu * w - 34, 18, 68, 9)
  ctx.fillStyle = '#3fb0b7'
  ctx.fillRect(s.player * w - 34, h - 27, 68, 9)

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(s.bx * w, s.by * h, 7, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(232,241,242,0.5)'
  ctx.font = '600 14px ui-monospace, monospace'
  ctx.fillText(active ? 'MOVE OR DRAG TO STEER' : 'NIGHT CIRCUIT · ATTRACT MODE', w / 2, h - 44)
}

// layout of the TV menus in canvas pixels, shared by the painters and the tap hit-test
const MENU_CARDS = [24, 172, 320].map((x) => ({ x, y: 116, w: 136, h: 140 }))
const MENU_ITEMS = [
  { label: 'PONG', note: 'play the match', color: '#3fb0b7' },
  { label: 'BREAKOUT', note: 'clear the wall', color: '#8fcfc9' },
  { label: 'YOUTUBE', note: 'watch a video', color: '#ffd08a' },
]
const VIDEO_ROWS = TV_PICKS.map((_, i) => ({ x: 40, y: 96 + i * 50, w: 400, h: 40 }))

const tvBackdrop = (ctx: CanvasRenderingContext2D) => {
  const { w, h } = PONG
  ctx.fillStyle = '#071019'
  ctx.fillRect(0, 0, w, h)
  const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.75)
  glow.addColorStop(0, 'rgba(63,176,183,0.2)')
  glow.addColorStop(1, 'rgba(7,16,25,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)
  ctx.textAlign = 'center'
}

/** YouTube's mark: the red rounded play button. */
const youtubeLogo = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) => {
  ctx.fillStyle = '#ff0033'
  ctx.beginPath()
  ctx.roundRect(cx - 32 * s, cy - 22 * s, 64 * s, 44 * s, 13 * s)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(cx - 8 * s, cy - 12 * s)
  ctx.lineTo(cx + 13 * s, cy)
  ctx.lineTo(cx - 8 * s, cy + 12 * s)
  ctx.closePath()
  ctx.fill()
}

/** A game pad: body, d-pad on the left, two buttons on the right. */
const padLogo = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
  ctx.fillStyle = '#3fb0b7'
  ctx.beginPath()
  ctx.roundRect(cx - 40, cy - 20, 80, 40, 20)
  ctx.fill()
  ctx.fillStyle = '#071019'
  ctx.fillRect(cx - 27, cy - 3, 18, 6)
  ctx.fillRect(cx - 21, cy - 9, 6, 18)
  for (const [dx, dy] of [
    [16, 4],
    [25, -5],
  ]) {
    ctx.beginPath()
    ctx.arc(cx + dx, cy + dy, 4.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Three rows of bricks over a paddle and ball. */
const bricksLogo = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
  BRICK_COLORS.slice(0, 3).forEach((color, row) => {
    ctx.fillStyle = color
    for (let col = 0; col < 4; col++) ctx.fillRect(cx - 38 + col * 19.5, cy - 24 + row * 10, 17, 7)
  })
  ctx.fillStyle = '#e8f1f2'
  ctx.beginPath()
  ctx.arc(cx + 6, cy + 10, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3fb0b7'
  ctx.fillRect(cx - 16, cy + 20, 32, 5)
}

const BRICK_COLORS = ['#c0392b', '#b4693a', '#e8c66a', '#3fb0b7', '#1f6f6b']

const paintBreakout = (ctx: CanvasRenderingContext2D, s: BreakoutState, best: number) => {
  const { w, h } = PONG
  tvBackdrop(ctx)
  s.bricks.forEach((alive, i) => {
    if (!alive) return
    const row = Math.floor(i / BREAKOUT_COLS)
    const b = brickAt(row, i % BREAKOUT_COLS)
    ctx.fillStyle = BRICK_COLORS[row % BRICK_COLORS.length]
    ctx.beginPath()
    ctx.roundRect(b.x * w, b.y * h, b.w * w, b.h * h, 3)
    ctx.fill()
  })
  ctx.fillStyle = '#3fb0b7'
  ctx.beginPath()
  ctx.roundRect((s.paddle - PADDLE_HALF) * w, PADDLE_Y * h, PADDLE_HALF * 2 * w, 8, 4)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(s.bx * w, s.by * h, BALL_R * w, 0, Math.PI * 2)
  ctx.fill()

  ctx.font = '700 15px ui-monospace, monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#e8f1f2'
  ctx.fillText(`SCORE ${s.score}`, 16, 24)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffd08a'
  ctx.fillText(`BEST ${Math.max(best, s.score)}`, w / 2, 24)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#e08a7a'
  ctx.fillText('♥'.repeat(Math.max(0, s.lives)), w - 16, 24)
  ctx.textAlign = 'center'
  if (s.over) {
    ctx.fillStyle = 'rgba(7,16,25,0.75)'
    ctx.fillRect(0, h / 2 - 40, w, 80)
    ctx.fillStyle = '#e8f1f2'
    ctx.font = '700 26px ui-monospace, monospace'
    ctx.fillText('GAME OVER', w / 2, h / 2 - 4)
    ctx.fillStyle = 'rgba(232,241,242,0.6)'
    ctx.font = '600 13px ui-monospace, monospace'
    ctx.fillText('click the screen to play again', w / 2, h / 2 + 24)
  }
}

// a visitor's best Breakout score; storage can be blocked, so every access is guarded
const BEST_KEY = 'studio-breakout-best'
const readBest = () => {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}
const saveBest = (score: number) => {
  try {
    localStorage.setItem(BEST_KEY, String(score))
  } catch {
    /* private mode: the best lives for this visit only */
  }
}

const paintMenu = (ctx: CanvasRenderingContext2D, sel: number) => {
  const { w } = PONG
  tvBackdrop(ctx)
  ctx.fillStyle = '#e8f1f2'
  ctx.font = '700 26px ui-monospace, monospace'
  ctx.fillText('NIGHT CIRCUIT', w / 2, 62)
  ctx.fillStyle = 'rgba(232,241,242,0.45)'
  ctx.font = '600 13px ui-monospace, monospace'
  ctx.fillText('arrows + enter, or tap a card', w / 2, 88)

  MENU_CARDS.forEach((card, i) => {
    const on = i === sel
    const { color, label, note } = MENU_ITEMS[i]
    ctx.fillStyle = on ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'
    ctx.beginPath()
    ctx.roundRect(card.x, card.y, card.w, card.h, 12)
    ctx.fill()
    ctx.strokeStyle = on ? color : 'rgba(232,241,242,0.14)'
    ctx.lineWidth = on ? 3 : 1.5
    ctx.stroke()
    const cx = card.x + card.w / 2
    if (i === 0) padLogo(ctx, cx, card.y + 48)
    else if (i === 1) bricksLogo(ctx, cx, card.y + 48)
    else youtubeLogo(ctx, cx, card.y + 48, 0.9)
    ctx.fillStyle = on ? color : 'rgba(232,241,242,0.6)'
    ctx.font = '700 17px ui-monospace, monospace'
    ctx.fillText(label, cx, card.y + 104)
    ctx.fillStyle = 'rgba(232,241,242,0.45)'
    ctx.font = '600 11px ui-monospace, monospace'
    ctx.fillText(note, cx, card.y + 124)
  })
}

const paintVideos = (ctx: CanvasRenderingContext2D, sel: number) => {
  const { w, h } = PONG
  tvBackdrop(ctx)
  youtubeLogo(ctx, w / 2 - 70, 52, 0.55)
  ctx.fillStyle = '#e8f1f2'
  ctx.font = '700 22px ui-monospace, monospace'
  ctx.fillText('YOUTUBE', w / 2 + 20, 60)

  VIDEO_ROWS.forEach((row, i) => {
    const on = i === sel
    ctx.fillStyle = on ? 'rgba(255,208,138,0.14)' : 'rgba(255,255,255,0.03)'
    ctx.beginPath()
    ctx.roundRect(row.x, row.y, row.w, row.h, 8)
    ctx.fill()
    ctx.strokeStyle = on ? '#ffd08a' : 'rgba(232,241,242,0.12)'
    ctx.lineWidth = on ? 2.5 : 1.2
    ctx.stroke()
    ctx.textAlign = 'left'
    ctx.fillStyle = on ? '#ffd08a' : 'rgba(232,241,242,0.75)'
    ctx.font = '600 16px ui-monospace, monospace'
    ctx.fillText(`${on ? '▶' : ' '} ${TV_PICKS[i].label}`, row.x + 16, row.y + 26)
  })
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(232,241,242,0.4)'
  ctx.font = '600 12px ui-monospace, monospace'
  ctx.fillText('enter to play · esc to go back', w / 2, h - 22)
}

// the real player is an HTML box laid over this screen; black underneath while it loads
const paintVideo = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, PONG.w, PONG.h)
}

/** Which menu item a tap at uv (0..1, origin bottom-left) lands on, or -1. */
const tvHit = (mode: TvMode, u: number, v: number) => {
  const x = u * PONG.w
  const y = (1 - v) * PONG.h
  const items = mode === 'menu' ? MENU_CARDS : mode === 'videos' ? VIDEO_ROWS : []
  return items.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)
}

type PongState = {
  bx: number
  by: number
  vx: number
  vy: number
  player: number
  cpu: number
  ps: number
  cs: number
}

// one canvas for the TV, created on first use: it is painted every frame, so it can't live in useMemo
let pong: { ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture } | null = null
const pongScreen = () => {
  if (!pong) {
    const canvas = document.createElement('canvas')
    canvas.width = PONG.w
    canvas.height = PONG.h
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 16
    pong = { ctx: canvas.getContext('2d')!, texture }
  }
  return pong
}

/** Sofa, coffee table and the console — the empty half of the room becomes a lounge. */
const Lounge = memo(function Lounge({
  onTv,
  onTvPick,
  onHover,
  active,
  mode,
  sel,
}: {
  onTv: () => void
  onTvPick: (index: number) => void
  onHover: (label: string | null, x: number, y: number) => void
  active: boolean
  mode: TvMode
  sel: number
}) {
  const leave = useRef<number | undefined>(undefined)
  const screen = pongScreen()
  const glass = useRef<THREE.Mesh>(null)

  const match = useRef<PongState>({
    bx: 0.5,
    by: 0.5,
    vx: 0.62,
    vy: 0.5,
    player: 0.5,
    cpu: 0.5,
    ps: 0,
    cs: 0,
  })
  const paint = useRef(0)
  const lastFrame = useRef('')
  const brk = useRef<BreakoutState>(newGame())
  const best = useRef(0)
  useEffect(() => {
    // every visit to Breakout starts a fresh game
    if (mode !== 'breakout') return
    brk.current = newGame()
    best.current = readBest()
    const game = brk
    // leaving mid-game still keeps a new best
    return () => {
      if (game.current.score > readBest()) saveBest(game.current.score)
    }
  }, [mode])

  useFrame(({ pointer, camera, size }, delta) => {
    if (tvOverlay.el && glass.current)
      pinToScreen(tvOverlay.el, glass.current, 0.83, 0.46, camera, size)

    const dt = Math.min(delta, 0.05)
    const s = match.current

    if (mode === 'breakout') {
      const b = brk.current
      const wasOver = b.over
      stepBreakout(b, dt, active ? 0.5 + pointer.x * 0.6 : b.bx)
      if (b.over && !wasOver && b.score > best.current) {
        best.current = b.score
        saveBest(b.score)
      }
    }

    if (mode === 'game') {
      const move = (from: number, to: number, rate: number) =>
        from + Math.max(-rate * dt, Math.min(rate * dt, to - from))

      // in the TV view the pointer is the paddle; otherwise he plays against himself
      s.player = move(s.player, active ? 0.5 + pointer.x * 0.45 : s.bx, 1.8)
      s.cpu = move(s.cpu, s.bx, 0.72)
      s.bx += s.vx * dt
      s.by += s.vy * dt

      if (s.bx < 0.035) {
        s.bx = 0.035
        s.vx = Math.abs(s.vx)
      } else if (s.bx > 0.965) {
        s.bx = 0.965
        s.vx = -Math.abs(s.vx)
      }
      if (s.vy > 0 && s.by > 0.9 && Math.abs(s.bx - s.player) < 0.14) {
        s.by = 0.9
        s.vy = -Math.min(Math.abs(s.vy) * 1.02, 0.9)
      } else if (s.vy < 0 && s.by < 0.1 && Math.abs(s.bx - s.cpu) < 0.14) {
        s.by = 0.1
        s.vy = Math.min(Math.abs(s.vy) * 1.02, 0.9)
      }
      if (s.by > 1.05 || s.by < -0.05) {
        const playerMissed = s.by > 1.05
        if (playerMissed) s.cs += 1
        else s.ps += 1
        s.bx = 0.5
        s.by = 0.5
        s.vx = playerMissed ? -0.62 : 0.62
        s.vy = playerMissed ? 0.5 : -0.5
      }
    }

    // the screen repaints at 20 fps for the match and much slower for the menus, which barely move
    paint.current += dt
    const frame = `${mode}:${sel}`
    const playing = mode === 'game' || mode === 'breakout'
    const redraw = lastFrame.current !== frame || paint.current > (playing ? 0.05 : 0.4)
    if (!redraw) return
    paint.current = 0
    lastFrame.current = frame

    const screen = pongScreen()
    if (mode === 'menu') paintMenu(screen.ctx, sel)
    else if (mode === 'videos') paintVideos(screen.ctx, sel)
    else if (mode === 'youtube') paintVideo(screen.ctx)
    else if (mode === 'breakout') paintBreakout(screen.ctx, brk.current, best.current)
    else paintPong(screen.ctx, s, active)
    screen.texture.needsUpdate = true
  })

  return (
    <group>
      {/* rug for the seating */}
      <Box position={[4.25, 0.025, 1.55]} size={[3.1, 0.05, 3.5]} color="#213843" />
      <Box position={[4.25, 0.055, 1.55]} size={[2.76, 0.012, 3.16]} color="#2e4c57" />

      {/* media console facing the sofa; clicking it flies the camera to the screen */}
      <group
        position={[4.45, 0, 0.05]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          window.clearTimeout(leave.current)
          onHover('TV — take a seat and play', e.nativeEvent.clientX, e.nativeEvent.clientY)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (pointerDrag.moved > 6) return
          onTv()
        }}
      >
        <Box position={[0, 0.3, 0]} size={[2.3, 0.1, 0.62]} color={C.wood} />
        <Box position={[0, 0.16, 0]} size={[2.16, 0.2, 0.56]} color={C.woodDark} />
        <Box position={[0, 0.03, 0]} size={[2.22, 0.06, 0.6]} color={C.woodDark} />
        {[-0.55, 0.55].map((x) => (
          <group key={x}>
            <Box position={[x, 0.16, 0.29]} size={[1.0, 0.16, 0.02]} color={C.wood} />
            <Box position={[x, 0.16, 0.31]} size={[0.1, 0.02, 0.02]} color={C.trim} />
          </group>
        ))}
        {/* the console itself, with two pads on the shelf */}
        <Box position={[-0.78, 0.4, 0.05]} size={[0.46, 0.1, 0.34]} color="#15191f" />
        <Box position={[-0.78, 0.455, 0.05]} size={[0.44, 0.012, 0.32]} color="#e9e7e2" />
        <mesh position={[-0.78, 0.42, 0.225]}>
          <boxGeometry args={[0.2, 0.012, 0.01]} />
          <meshStandardMaterial
            color={ACCENT_LIGHT}
            emissive={ACCENT_LIGHT}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
        {[-0.28, 0.28].map((x, i) => (
          <group key={x} position={[x, 0.42, 0.06]} rotation={[0, 0.4 + i * 0.35, 0]}>
            <Gamepad />
          </group>
        ))}

        {/* TV on its stand */}
        <Box position={[0, 0.335, -0.06]} size={[0.54, 0.04, 0.3]} color={C.metal} />
        <Box position={[0, 0.46, -0.1]} size={[0.1, 0.26, 0.08]} color={C.metal} />
        <Box position={[0, 1.02, -0.09]} size={[1.78, 1.02, 0.08]} color="#0d141d" />
        <mesh
          ref={glass}
          position={[0, 1.02, -0.045]}
          onClick={(e) => {
            // outside the TV view a click flies the camera here (the group's handler); inside, it picks a menu item
            if (!active || !e.uv) return
            e.stopPropagation()
            if (pointerDrag.moved > 6) return
            if (mode === 'breakout') {
              if (brk.current.over) brk.current = newGame()
              return
            }
            const index = tvHit(mode, e.uv.x, e.uv.y)
            if (index >= 0) onTvPick(index)
          }}
        >
          <planeGeometry args={[1.66, 0.92]} />
          <meshStandardMaterial
            map={screen.texture}
            emissive="#ffffff"
            emissiveMap={screen.texture}
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* sofa, back to the camera so the screen stays in view */}
      <group position={[4.35, 0, 2.9]} rotation={[0, Math.PI, 0]}>
        {[-1.03, 1.03].map((x) => (
          <group key={x}>
            <Box position={[x, 0.5, 0]} size={[0.2, 0.5, 0.92]} color={C.sofa} />
            <mesh position={[x, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.92, 32]} />
              <meshStandardMaterial color={C.sofa} roughness={0.92} />
            </mesh>
          </group>
        ))}
        <Box position={[0, 0.3, 0]} size={[2.06, 0.24, 0.9]} color={C.sofa} />
        {[-0.5, 0.5].map((x) => (
          <Box key={x} position={[x, 0.47, 0.03]} size={[1.0, 0.16, 0.84]} color={C.sofaLight} />
        ))}
        <Box position={[0, 0.72, -0.38]} size={[2.06, 0.7, 0.2]} color={C.sofa} />
        {[-0.5, 0.5].map((x) => (
          <Box
            key={x}
            position={[x, 0.68, -0.25]}
            size={[0.98, 0.5, 0.18]}
            color={C.sofaLight}
            rotation={[-0.12, 0, 0]}
          />
        ))}
        {[
          [-0.66, '#b4693a'],
          [0.7, '#c8a25a'],
        ].map(([x, color]) => (
          <Box
            key={x}
            position={[Number(x), 0.68, -0.08]}
            size={[0.34, 0.34, 0.14]}
            color={String(color)}
            rotation={[0.2, Number(x) * 0.4, 0.1]}
          />
        ))}
        {[-0.84, 0.84].map((x) => (
          <Box key={x} position={[x, 0.1, 0]} size={[0.1, 0.2, 0.1]} color={C.woodDark} />
        ))}
      </group>

      {/* coffee table: sized like the desk, so the lounge doesn't look empty */}
      <group position={[4.35, 0, 1.5]}>
        <Box position={[0, 0.44, 0]} size={[3.0, 0.08, 1.05]} color={C.wood} />
        <Box position={[0, 0.32, 0]} size={[2.84, 0.06, 0.92]} color={C.woodDark} />
        {[
          [-1.36, -0.4],
          [1.36, -0.4],
          [-1.36, 0.4],
          [1.36, 0.4],
        ].map(([x, z]) => (
          <Box
            key={`${x}${z}`}
            position={[x, 0.2, z]}
            size={[0.07, 0.4, 0.07]}
            color={C.woodDark}
          />
        ))}
        {/* a book and a mug; the pads live on the TV console */}
        <Box
          position={[0.62, 0.49, -0.18]}
          size={[0.4, 0.04, 0.28]}
          color={C.cream}
          rotation={[0, -0.2, 0]}
        />
        <mesh position={[0.85, 0.52, 0.22]} castShadow>
          <cylinderGeometry args={[0.06, 0.055, 0.1, 32]} />
          <meshStandardMaterial color="#2f4d56" roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
})

/**
 * Maker's sideboard under the awards wall: teal cabinet doors, a raised back step, and the small
 * things a developer keeps around — a toy robot, a glowing flask, a router, a cube, a macro pad.
 * Built facing +x against the left wall; local x runs along the wall.
 */
const Sideboard = memo(function Sideboard({
  onLook,
  onHover,
}: {
  onLook: (view: 'sideboard') => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const leave = useRef<number | undefined>(undefined)
  const leds = useRef<THREE.Mesh[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    leds.current.forEach((led, i) => {
      if (led)
        (led.material as THREE.MeshStandardMaterial).emissiveIntensity =
          Math.sin(t * 3 + i * 1.3) > -0.3 ? 2.2 : 0.3
    })
  })

  return (
    <group
      position={[-5.7, 0, 2.3]}
      rotation={[0, Math.PI / 2, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leave.current)
        onHover('Sideboard — take a closer look', e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        onLook('sideboard')
      }}
    >
      {/* cabinet: plinth, body, four doors with brass pulls, worktop and the raised back step */}
      <Box position={[0, 0.05, 0.02]} size={[3.1, 0.1, 0.54]} color="#14262a" />
      <Box position={[0, 0.47, 0]} size={[3.2, 0.78, 0.6]} color="#1d3a3e" />
      {[-1.17, -0.39, 0.39, 1.17].map((x, i) => (
        <group key={x}>
          <Box position={[x, 0.47, 0.305]} size={[0.74, 0.68, 0.03]} color="#24494d" />
          <Box
            position={[x + (i % 2 === 0 ? 0.3 : -0.3), 0.52, 0.33]}
            size={[0.02, 0.16, 0.02]}
            color="#b58a4a"
            metalness={0.6}
            roughness={0.35}
          />
        </group>
      ))}
      <Box position={[0, 0.89, 0.02]} size={[3.32, 0.06, 0.68]} color={C.wood} />
      <Box position={[0, 1.08, -0.19]} size={[3.12, 0.32, 0.26]} color={C.wood} />

      {/* on the step: toy robot, glowing flask, a stack of notes, the router */}
      <group position={[-1.2, 1.24, -0.19]}>
        <Box position={[0, 0.09, 0]} size={[0.16, 0.18, 0.11]} color={C.cream} />
        <Box position={[0, 0.25, 0]} size={[0.2, 0.13, 0.13]} color="#c9c1ae" />
        {[-0.05, 0.05].map((x) => (
          <mesh key={x} position={[x, 0.26, 0.068]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.01, 32]} />
            <meshStandardMaterial color="#2a3340" roughness={0.4} />
          </mesh>
        ))}
        <Box position={[0, 0.34, 0]} size={[0.012, 0.06, 0.012]} color="#b5793f" metalness={0.5} />
        <mesh position={[0, 0.375, 0]}>
          <sphereGeometry args={[0.018, 32, 24]} />
          <meshStandardMaterial color="#e0784a" emissive="#e0784a" emissiveIntensity={0.8} />
        </mesh>
      </group>
      <group position={[-0.2, 1.24, -0.19]}>
        <mesh position={[0, 0.09, 0]}>
          <coneGeometry args={[0.11, 0.18, 32, 1, true]} />
          <meshStandardMaterial
            color="#fff1d6"
            emissive="#ffd59a"
            emissiveIntensity={0.6}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.03, 0.035, 0.09, 32]} />
          <meshStandardMaterial
            color="#fff1d6"
            emissive="#ffd59a"
            emissiveIntensity={0.45}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
        <pointLight
          position={[0, 0.15, 0.15]}
          intensity={0.6}
          distance={2.4}
          decay={2}
          color="#ffcf8a"
        />
      </group>
      <Box
        position={[0.55, 1.27, -0.19]}
        size={[0.3, 0.05, 0.2]}
        color="#e9e4d6"
        rotation={[0, 0.08, 0]}
      />
      <Box
        position={[0.56, 1.31, -0.19]}
        size={[0.28, 0.04, 0.19]}
        color="#d8cfb9"
        rotation={[0, -0.05, 0]}
      />
      <group position={[1.2, 1.24, -0.19]}>
        <Box position={[0, 0.045, 0]} size={[0.34, 0.09, 0.18]} color="#1b2a24" />
        {[0, 1, 2, 3].map((k) => (
          <mesh
            key={k}
            ref={(m) => {
              if (m) leds.current[k] = m
            }}
            position={[-0.09 + k * 0.06, 0.05, 0.092]}
          >
            <sphereGeometry args={[0.012, 32, 24]} />
            <meshStandardMaterial
              color="#7fe08a"
              emissive={k === 3 ? '#e0b04a' : '#7fe08a'}
              emissiveIntensity={2}
            />
          </mesh>
        ))}
        {[-0.13, 0.13].map((x) => (
          <Box key={x} position={[x, 0.17, -0.06]} size={[0.018, 0.2, 0.018]} color="#141b24" />
        ))}
      </group>

      {/* on the worktop: macro pad, a pocket screen, a cube, a scroll and a magnifier on notes */}
      <group position={[-1.25, 0.93, 0.12]}>
        <Box position={[0, 0.02, 0]} size={[0.42, 0.04, 0.16]} color="#141b24" />
        {['#c04a3a', '#d9a44a', '#3f6fb0'].map((color, k) => (
          <Box
            key={color}
            position={[-0.12 + k * 0.12, 0.065, 0]}
            size={[0.09, 0.06, 0.09]}
            color={color}
          />
        ))}
      </group>
      <group position={[-0.75, 0.93, 0.08]} rotation={[0, 0.15, 0]}>
        <Box position={[0, 0.11, 0]} size={[0.16, 0.22, 0.12]} color="#14231b" />
        <mesh position={[0, 0.12, 0.062]}>
          <planeGeometry args={[0.12, 0.13]} />
          <meshStandardMaterial
            color="#9ff2a8"
            emissive="#6fe08a"
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group position={[0.85, 0.92, 0.1]} rotation={[0, 0.3, 0]}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <Box
            key={k}
            position={[k & 1 ? 0.045 : -0.045, 0.045 + (k & 2 ? 0.09 : 0), k & 4 ? 0.045 : -0.045]}
            size={[0.085, 0.085, 0.085]}
            color={['#c04a3a', '#d9a44a', '#3f6fb0', '#3f9b6a'][(k * 3) % 4]}
          />
        ))}
      </group>
      <mesh position={[0.1, 0.95, 0.14]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.26, 32]} />
        <meshStandardMaterial color="#efe6d2" roughness={0.8} />
      </mesh>
      <group position={[1.35, 0.92, 0.12]} rotation={[0, -0.3, 0]}>
        <Box position={[0, 0.005, 0]} size={[0.26, 0.01, 0.2]} color="#f1ece0" />
        <mesh position={[0, 0.02, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.055, 0.008, 12, 48]} />
          <meshStandardMaterial color="#c49a4a" metalness={0.6} roughness={0.3} />
        </mesh>
        <Box
          position={[0.08, 0.02, 0.06]}
          size={[0.012, 0.012, 0.11]}
          color="#3a2a20"
          rotation={[0, -0.7, 0]}
        />
      </group>
    </group>
  )
})

const lastHit = { ball: 0, cushion: 0, pocket: 0 }
/** Table hits to sounds; a burst of contacts within 35 ms plays once, at its loudest. */
const onHit: Hit = (kind, speed) => {
  const now = performance.now()
  if (kind !== 'pocket' && speed < 0.08) return
  if (now - lastHit[kind] < 35) return
  lastHit[kind] = now
  if (kind === 'pocket') poolSound.pocket()
  else poolSound[kind](speed)
}

const BALL_COLORS = [
  '#f4f1e8',
  '#e3b83c',
  '#2f5fb0',
  '#c0392b',
  '#6b3fa0',
  '#e07a2e',
  '#2f8a4a',
  '#7a2c2c',
  '#141414',
  '#e3b83c',
  '#2f5fb0',
]
const TABLE_AT: Vec3 = [-2.0, 0, 3.85]
const FELT_Y = 0.8
const POCKET_SPOTS = [-1, 0, 1].flatMap((i) =>
  [-1, 1].map((j): [number, number] => [(i * POOL.w) / 2, (j * POOL.d) / 2])
)

/**
 * Pool table in the open floor between the sideboard and the rug. Outside its view a click flies the
 * camera over it; in the view the pointer aims the cue and a click on the felt takes the shot.
 */
const Billiards = memo(function Billiards({
  active,
  onLook,
  onHover,
}: {
  active: boolean
  onLook: (view: 'billiards') => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const leave = useRef<number | undefined>(undefined)
  const balls = useRef<THREE.Mesh[]>([])
  const cue = useRef<THREE.Group>(null)
  const stick = useRef<THREE.Mesh>(null)
  const line = useRef<THREE.Mesh>(null)
  const aim = useRef({ x: POOL.w / 4, z: 0 })

  useFrame((_, delta) => {
    if (moving(table)) step(table, Math.min(delta, 0.05), onHit)
    table.balls.forEach((b, i) => {
      const mesh = balls.current[i]
      if (!mesh) return
      mesh.visible = !b.in
      mesh.position.set(b.x, FELT_Y + POOL.r, b.z)
    })

    // the cue sits behind the white ball, pointing at the aim; it steps back further for a harder shot
    const white = table.balls[0]
    const rolling = moving(table)
    if (cue.current) {
      cue.current.visible = !rolling && !white.in
      const dx = aim.current.x - white.x
      const dz = aim.current.z - white.z
      const dist = Math.hypot(dx, dz) || 1
      cue.current.position.set(white.x, FELT_Y + POOL.r + 0.01, white.z)
      cue.current.rotation.y = Math.atan2(-dz, dx)
      if (stick.current)
        stick.current.position.x = -(
          POOL.r +
          0.04 +
          (active ? Math.min(dist, 1.75) * 0.12 : 0) +
          0.75
        )
      if (line.current) {
        line.current.visible = active
        const length = Math.min(dist, 1.2)
        line.current.scale.x = length
        line.current.position.x = length / 2
      }
    }
  })

  const toTable = (point: THREE.Vector3) => ({ x: point.x - TABLE_AT[0], z: point.z - TABLE_AT[2] })

  return (
    <group
      position={TABLE_AT}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leave.current)
        if (!active)
          onHover('Pool table — play a game', e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        if (!active) return onLook('billiards')
        const spot = toTable(e.point)
        aim.current = spot
        unlock()
        if (shoot(table, spot.x, spot.z))
          poolSound.cue(Math.hypot(table.balls[0].vx, table.balls[0].vz))
      }}
    >
      {[-1.3, 1.3].flatMap((x) =>
        [-0.62, 0.62].map((z) => (
          <Box
            key={`${x}${z}`}
            position={[x, 0.31, z]}
            size={[0.18, 0.62, 0.18]}
            color={C.woodDark}
          />
        ))
      )}
      <Box position={[0, 0.68, 0]} size={[POOL.w + 0.3, 0.2, POOL.d + 0.3]} color={C.woodDark} />
      <Box position={[0, 0.78, 0]} size={[POOL.w, 0.04, POOL.d]} color="#1f6b4f" roughness={0.95} />
      {[-1, 1].map((s) => (
        <Box
          key={`z${s}`}
          position={[0, 0.82, s * (POOL.d / 2 + 0.075)]}
          size={[POOL.w + 0.3, 0.08, 0.15]}
          color={C.wood}
        />
      ))}
      {[-1, 1].map((s) => (
        <Box
          key={`x${s}`}
          position={[s * (POOL.w / 2 + 0.075), 0.82, 0]}
          size={[0.15, 0.08, POOL.d]}
          color={C.wood}
        />
      ))}
      {/* diamonds along the rails, then the six pockets */}
      {[-0.5, 0.5].flatMap((f) =>
        [-1, 1].map((s) => (
          <Box
            key={`d${f}${s}`}
            position={[f * POOL.w * 0.5, 0.862, s * (POOL.d / 2 + 0.075)]}
            size={[0.03, 0.004, 0.03]}
            color={C.cream}
          />
        ))
      )}
      {POCKET_SPOTS.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.803, z]}>
          <cylinderGeometry args={[POOL.pocket, POOL.pocket, 0.012, 32]} />
          <meshStandardMaterial color="#0b0d10" roughness={0.9} />
        </mesh>
      ))}

      {/* the hit area for aiming: the felt's surface, invisible */}
      <mesh
        position={[0, FELT_Y + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(e) => {
          if (active) aim.current = toTable(e.point)
        }}
      >
        <planeGeometry args={[POOL.w, POOL.d]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {table.balls.map((_, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            if (mesh) balls.current[i] = mesh
          }}
          castShadow
        >
          <sphereGeometry args={[POOL.r, 24, 16]} />
          <meshStandardMaterial color={BALL_COLORS[i]} roughness={0.22} />
        </mesh>
      ))}

      <group ref={cue}>
        <mesh ref={stick} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.012, 0.007, 1.5, 16]} />
          <meshStandardMaterial color="#d9b77e" roughness={0.6} />
        </mesh>
        <mesh ref={line} position={[0, -POOL.r + 0.004, 0]}>
          <boxGeometry args={[1, 0.002, 0.006]} />
          <meshBasicMaterial color={ACCENT_LIGHT} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
})

/**
 * The studio dog: a shiba-ish pup that roams the main rug, stopping to stand or lie down for a
 * while. It breathes, wags, follows the pointer with its head, and a click makes it perk up, wag
 * hard and bark. Built facing +z.
 */
// the main rug's inner area, kept clear of its edges (see RoomShell)
const DOG_AREA = { x0: -2.7, x1: 0.7, z0: -1.8, z1: 1.1 }
const DOG_SPEED = 0.4
const DOG_SCALE = 1.4
// body height when standing: the leg pivot sits 0.03 under it and a paw's sole 0.227 under the pivot
const DOG_STAND_Y = 0.257
// trotting after him: he walks at ~1.15 m/s, so the dog keeps up from a little way behind
const DOG_TROT = 1.0
const DOG_BEHIND = 0.8
// hip and shoulder pivots: front left, front right, back left, back right
const DOG_LEGS: Vec3[] = [
  [-0.065, -0.03, 0.15],
  [0.065, -0.03, 0.15],
  [-0.075, -0.03, -0.15],
  [0.075, -0.03, -0.15],
]

const Dog = memo(function Dog({
  onHover,
}: {
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const legs = useRef<(THREE.Group | null)[]>([])
  const s = useRef({
    x: -1.2,
    z: 0.3,
    yaw: 0.5,
    tx: -1.2,
    tz: 0.3,
    walking: false,
    lying: true,
    until: 6,
    lie: 1,
    phase: 0,
    following: false,
    returning: false,
    followUntil: 0,
    nextFollow: 70,
    nextPet: 25,
    asking: false,
    askedAt: 0,
    // a click: he turns to face the camera, then barks twice
    facingUntil: 0,
    barkAt: 0,
    barked: true,
  })
  const excited = useRef(-10)
  // set by a click, turned into a timestamp on the next frame (the clock lives in useFrame)
  const poke = useRef(false)
  const heard = useRef(0)
  const leave = useRef<number | undefined>(undefined)
  const coat = '#c98a4b'
  const cream = '#f1e3c8'

  useFrame(({ clock, pointer, camera }, delta) => {
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    const d = s.current
    // a click, or the terminal's `bark`, makes him perk up
    if (poke.current) {
      poke.current = false
      d.facingUntil = t + 3.2
      d.barkAt = t + 0.9
      d.barked = false
    }
    if (roomFx.bark > heard.current) {
      excited.current = t
      heard.current = roomFx.bark
    }
    const facing = t < d.facingUntil
    const since = t - excited.current
    const happy = since < 1.6 ? 1 - since / 1.6 : 0

    let speed = 0
    // now and then, resting on the rug, he stands and waits for a pat
    if (!d.following && !d.asking && !d.walking && t > d.nextPet) {
      d.asking = true
      d.askedAt = t
      dogPet.want = true
      dogPet.active = false
      dogPet.x = d.x
      dogPet.z = d.z
      dogPet.yaw = d.yaw
    }
    if (d.asking) {
      d.walking = false
      d.lying = false
      // nobody came (he was at the desk), or the pat is over: back to the usual wandering
      if (!dogPet.want || (!dogPet.active && t - d.askedAt > 25)) {
        d.asking = false
        dogPet.want = false
        d.nextPet = t + 60 + Math.random() * 30
        d.until = t + 2
      }
    }
    const petted = dogPet.active ? 1 : 0
    // now and then he gets up and trails the character for a while, then goes back to the rug
    if (!d.following && !d.asking && t > d.nextFollow) {
      d.following = true
      d.followUntil = t + 15 + Math.random() * 10
    }
    if (d.following) {
      if (t > d.followUntil) {
        d.following = false
        d.returning = true
        d.nextFollow = t + 40 + Math.random() * 30
        d.walking = false
        d.until = 0
      } else {
        d.tx = charPos.x - Math.sin(charPos.yaw) * DOG_BEHIND
        d.tz = charPos.z - Math.cos(charPos.yaw) * DOG_BEHIND
        const near =
          Math.hypot(d.tx - d.x, d.tz - d.z) < 0.25 ||
          (charPos.busy && Math.hypot(charPos.x - d.x, charPos.z - d.z) < 0.9)
        d.walking = !near
        d.lying = near && charPos.busy
      }
    }
    if (!d.following && !d.asking && !d.walking && t > d.until) {
      // next spot somewhere on the rug, far enough away to be worth the walk
      do {
        d.tx = DOG_AREA.x0 + Math.random() * (DOG_AREA.x1 - DOG_AREA.x0)
        d.tz = DOG_AREA.z0 + Math.random() * (DOG_AREA.z1 - DOG_AREA.z0)
      } while (Math.hypot(d.tx - d.x, d.tz - d.z) < 0.8)
      d.walking = true
    }
    if (facing) {
      // stop whatever he was doing, stand, and turn square to the camera
      d.walking = false
      d.lying = false
      const dx = camera.position.x - d.x
      const dz = camera.position.z - d.z
      let turn = Math.atan2(dx, dz) - d.yaw
      turn = Math.atan2(Math.sin(turn), Math.cos(turn))
      d.yaw += THREE.MathUtils.clamp(turn, -5 * dt, 5 * dt)
      // once he is looking (or after a moment), the woofs go out with the sound
      if (!d.barked && (Math.abs(turn) < 0.12 || t > d.barkAt)) {
        d.barked = true
        d.barkAt = t
        excited.current = t
        bark()
      }
    }
    if (d.walking && d.lie < 0.15) {
      const dx = d.tx - d.x
      const dz = d.tz - d.z
      const dist = Math.hypot(dx, dz)
      let turn = Math.atan2(dx, dz) - d.yaw
      turn = Math.atan2(Math.sin(turn), Math.cos(turn))
      d.yaw += THREE.MathUtils.clamp(turn, -2.6 * dt, 2.6 * dt)
      // slow down while turning so it never strafes
      speed = (d.following ? DOG_TROT : DOG_SPEED) * Math.max(0, Math.cos(turn)) * Math.min(1, dist / 0.25 + 0.3)
      d.x += Math.sin(d.yaw) * speed * dt
      d.z += Math.cos(d.yaw) * speed * dt
      if (!d.following && dist < 0.06) {
        d.walking = false
        d.lying = d.returning || Math.random() < 0.6
        d.returning = false
        d.until = t + (d.lying ? 8 + Math.random() * 8 : 2 + Math.random() * 3)
      }
    }
    const lieTo = d.walking ? 0 : d.lying ? 1 : 0
    d.lie += (lieTo - d.lie) * Math.min(1, dt * 2.5)
    d.phase += dt * 22 * speed
    const stride = Math.min(1.3, speed / DOG_SPEED) * (1 - d.lie)

    if (root.current) {
      // the rug is 5.7 cm thick; off it (trailing him) he walks on the floor
      const onRug = d.x > -3.2 && d.x < 1.2 && d.z > -2.25 && d.z < 1.55
      root.current.position.set(d.x, onRug ? 0.057 : 0, d.z)
      root.current.rotation.y = d.yaw
    }
    if (body.current) {
      body.current.position.y =
        THREE.MathUtils.lerp(DOG_STAND_Y, 0.12, d.lie) + Math.abs(Math.sin(d.phase)) * 0.012 * stride
      body.current.scale.y = 1 + Math.sin(t * 2.2) * 0.02
    }
    // front legs stretch forward and back legs tuck when lying; diagonal pairs swing when walking
    legs.current.forEach((leg, i) => {
      if (!leg) return
      const front = i < 2
      const swing = Math.sin(d.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55 * stride
      leg.rotation.x = swing - d.lie * (front ? 1.45 : 1.3)
    })
    // mouth: open on each of the two woofs (0 and 0.22 s after the bark starts)
    const sinceBark = t - d.barkAt
    const woof = (from: number) => (sinceBark > from && sinceBark < from + 0.16 ? Math.sin(((sinceBark - from) / 0.16) * Math.PI) : 0)
    const open = d.barked && facing ? Math.max(woof(0), woof(0.22)) : 0
    if (mouth.current) mouth.current.scale.set(1, 0.05 + open * 0.9, 1.1)
    if (head.current && open > 0) head.current.rotation.x -= open * 0.25
    const joy = Math.max(happy, petted * 0.8)
    if (tail.current) tail.current.rotation.y = Math.sin(t * (4 + joy * 14)) * (0.25 + joy * 0.35)
    if (head.current) {
      // rests its chin low when lying, perks up when clicked, keeps half an eye on the pointer
      head.current.rotation.x = THREE.MathUtils.lerp(
        head.current.rotation.x,
        0.22 * d.lie - happy * 0.5 - petted * 0.35,
        0.12
      )
      head.current.rotation.y = THREE.MathUtils.lerp(
        head.current.rotation.y,
        d.walking || petted ? 0 : pointer.x * 0.5,
        0.05
      )
    }
  })

  return (
    <group
      ref={root}
      scale={DOG_SCALE}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        window.clearTimeout(leave.current)
        onHover('Dog — say hi', e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        leave.current = window.setTimeout(() => onHover(null, 0, 0), 90)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        unlock()
        poke.current = true
      }}
    >
      <group ref={body} position={[0, DOG_STAND_Y, 0]}>
        {/* body along z, with a cream belly and chest */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.3, 10, 24]} />
          <meshStandardMaterial color={coat} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.05, 0.12]} scale={[0.85, 0.6, 1]}>
          <sphereGeometry args={[0.11, 24, 16]} />
          <meshStandardMaterial color={cream} roughness={0.85} />
        </mesh>
        {/* haunches */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.08, -0.01, -0.13]} scale={[0.6, 0.85, 1]} castShadow>
            <sphereGeometry args={[0.1, 20, 16]} />
            <meshStandardMaterial color={coat} roughness={0.85} />
          </mesh>
        ))}
        {/* legs pivot at the hip and shoulder; a cream paw at each foot */}
        {DOG_LEGS.map((at, i) => (
          <group
            key={i}
            position={at}
            ref={(g) => {
              legs.current[i] = g
            }}
          >
            <mesh position={[0, -0.1, 0]} castShadow>
              <capsuleGeometry args={[0.032, 0.15, 8, 16]} />
              <meshStandardMaterial color={coat} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.2, 0.015]} scale={[1, 0.7, 1.25]}>
              <sphereGeometry args={[0.038, 16, 12]} />
              <meshStandardMaterial color={cream} roughness={0.85} />
            </mesh>
          </group>
        ))}
        {/* curled tail over the back */}
        <group ref={tail} position={[0, 0.09, -0.2]}>
          <mesh position={[0, 0.03, -0.02]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.055, 0.03, 12, 24, Math.PI * 1.4]} />
            <meshStandardMaterial color={coat} roughness={0.85} />
          </mesh>
        </group>

        {/* head: skull, cream muzzle, nose, eyes, pointed ears, a collar */}
        <group ref={head} position={[0, 0.12, 0.24]}>
          <mesh castShadow>
            <sphereGeometry args={[0.11, 32, 24]} />
            <meshStandardMaterial color={coat} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.035, 0.08]} scale={[0.75, 0.6, 0.9]}>
            <sphereGeometry args={[0.08, 24, 16]} />
            <meshStandardMaterial color={cream} roughness={0.85} />
          </mesh>
          <mesh ref={mouth} position={[0, -0.062, 0.118]} scale={[1, 0.05, 1.1]}>
            <sphereGeometry args={[0.04, 16, 12]} />
            <meshStandardMaterial color="#4a1818" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.01, 0.155]}>
            <sphereGeometry args={[0.018, 16, 12]} />
            <meshStandardMaterial color="#1a1513" roughness={0.3} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.045, 0.025, 0.095]}>
                <sphereGeometry args={[0.013, 12, 10]} />
                <meshStandardMaterial color="#1a1513" roughness={0.25} />
              </mesh>
              <mesh position={[side * 0.065, 0.11, -0.01]} rotation={[-0.15, 0, side * -0.25]} castShadow>
                <coneGeometry args={[0.04, 0.09, 4]} />
                <meshStandardMaterial color={coat} roughness={0.85} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.075, -0.02]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
            <torusGeometry args={[0.075, 0.012, 10, 32]} />
            <meshStandardMaterial color="#b4693a" roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  )
})

/** Pendant lamp over the desk — the room's warm key light. */
const Pendant = memo(function Pendant() {
  return (
    <group position={[1.4, 0, -4.4]}>
      <mesh position={[0, 4.55, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 32]} />
        <meshStandardMaterial color={C.dark} />
      </mesh>
      <mesh position={[0, 3.88, 0]} castShadow>
        <coneGeometry args={[0.52, 0.42, 32, 1, true]} />
        <meshStandardMaterial color="#1f3a3a" side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.74, 0]}>
        <sphereGeometry args={[0.11, 32, 24]} />
        <meshStandardMaterial
          color="#ffd9a0"
          emissive="#ffc275"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
})

/** Contact sheet on the rug: character lives in Character.tsx, this is the room's furniture. */
export const Room = memo(function Room({
  onPick,
  onHover,
  onPoster,
  onTv,
  onTvPick,
  tvActive,
  tvMode,
  tvSel,
  onLook,
  billiardsActive,
  onCert,
  particles,
  reduced,
  guestNotes,
  onSign,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
  onPoster: () => void
  onTv: () => void
  onTvPick: (index: number) => void
  tvActive: boolean
  tvMode: TvMode
  tvSel: number
  onLook: (view: 'terminal' | 'sideboard' | 'billiards') => void
  billiardsActive: boolean
  onCert: (id: string) => void
  particles: number
  reduced: boolean
  guestNotes: Note[]
  onSign: () => void
}) {
  return (
    <group>
      <RoomShell />
      <Desk
        onPick={onPick}
        onHover={onHover}
        onLook={onLook}
      />
      <Shelf onPick={onPick} onHover={onHover} />
      <Board onPick={onPick} onHover={onHover} />
      <WallClock />
      <FairyLights animate={!reduced} />
      <Curtains animate={!reduced} />
      <NeonSign animate={!reduced} onHover={onHover} />
      <Frames onPick={onPick} onHover={onHover} onCert={onCert} />
      <GuestBoard notes={guestNotes} onSign={onSign} onHover={onHover} />
      <Poster onPick={onPoster} onHover={onHover} />
      <Window onHover={onHover} />
      <Rack onHover={onHover} />

      <group position={LOUNGE_AT} scale={LOUNGE_SCALE}>
        <Lounge
          onTv={onTv}
          onTvPick={onTvPick}
          onHover={onHover}
          active={tvActive}
          mode={tvMode}
          sel={tvSel}
        />
      </group>
      <FloorLamp position={[5.2, 0, 4.5]} onHover={onHover} />
      <Plant position={[0.85, 0, 4.3]} />
      <BeanBag position={[-3.0, 0, -4.4]} yaw={0.6} />
      <Dog onHover={onHover} />
      <Billiards active={billiardsActive} onLook={onLook} onHover={onHover} />
      <Sideboard onLook={onLook} onHover={onHover} />
      <GalleryLight />
      <Pendant />
      <Confetti />
      {particles > 0 && (
        <>
          <Dust count={particles} center={DUST_GALLERY.center} size={DUST_GALLERY.size} />
          <Dust count={particles} center={DUST_DESK.center} size={DUST_DESK.size} />
        </>
      )}

      <Plant position={[-5.45, 0, 4.45]} />
      <Plant position={[-5.0, 0, -5.1]} tall />
    </group>
  )
})
