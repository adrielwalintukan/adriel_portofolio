import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  DESK_COLS,
  DESK_PROJECTS,
  SCREEN_PX,
  TV_PICKS,
  deskOverlay,
  pointerDrag,
  terminalLog,
  tvOverlay,
  type StationId,
  type TvMode,
} from './data'
import { POOL, moving, shoot, step, table, type Hit } from './pool'
import { quadMatrix } from './quad'
import { poolSound, unlock } from './sound'
import { PROMPT, TERM_COLORS, type TermLine } from './terminal'
import { boardTexture, certificateTexture, floorTexture, windowTexture } from './textures'

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

/** The main monitor's desktop: a folder per project, drawn at the overlay's size. */
const DESK_TOP = 52
const DESK_CELL = { w: SCREEN_PX.w / DESK_COLS, h: 146 }

const paintDesk = (ctx: CanvasRenderingContext2D, sel: number) => {
  const { w, h } = SCREEN_PX
  const wall = ctx.createLinearGradient(0, 0, w, h)
  wall.addColorStop(0, '#0d1422')
  wall.addColorStop(1, '#16283a')
  ctx.fillStyle = wall
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  ctx.fillRect(0, 0, w, 40)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#dbe5ea'
  ctx.font = '600 16px ui-monospace, monospace'
  ctx.fillText('~/projects', 18, 26)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#5f7186'
  ctx.fillText(`${DESK_PROJECTS.length} items`, w - 18, 26)

  ctx.textAlign = 'center'
  DESK_PROJECTS.forEach((project, i) => {
    const x = (i % DESK_COLS) * DESK_CELL.w
    const y = DESK_TOP + Math.floor(i / DESK_COLS) * DESK_CELL.h
    const cx = x + DESK_CELL.w / 2
    if (i === sel) {
      ctx.fillStyle = 'rgba(63,176,183,0.16)'
      ctx.strokeStyle = '#3fb0b7'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(x + 8, y + 4, DESK_CELL.w - 16, DESK_CELL.h - 8, 10)
      ctx.fill()
      ctx.stroke()
    }
    // folder: a tab and a body, with a play mark when the project has a video
    ctx.fillStyle = '#b9853a'
    ctx.beginPath()
    ctx.roundRect(cx - 34, y + 16, 30, 12, 3)
    ctx.fill()
    ctx.fillStyle = '#d9a44a'
    ctx.beginPath()
    ctx.roundRect(cx - 34, y + 22, 68, 48, 5)
    ctx.fill()
    if (project.video || project.youtubeId) {
      ctx.fillStyle = 'rgba(11,18,32,0.75)'
      ctx.beginPath()
      ctx.moveTo(cx - 7, y + 36)
      ctx.lineTo(cx + 10, y + 46)
      ctx.lineTo(cx - 7, y + 56)
      ctx.closePath()
      ctx.fill()
    }

    // title under the icon, on up to two lines
    ctx.fillStyle = i === sel ? '#ffffff' : '#c9d4da'
    ctx.font = '600 15px system-ui, sans-serif'
    const lines: string[] = []
    for (const word of project.title.split(' ')) {
      const last = lines[lines.length - 1]
      if (last && ctx.measureText(`${last} ${word}`).width < DESK_CELL.w - 24)
        lines[lines.length - 1] = `${last} ${word}`
      else lines.push(word)
    }
    lines.slice(0, 2).forEach((line, l) => ctx.fillText(line, cx, y + 96 + l * 19))
  })

  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(0, h - 36, w, 36)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#8fa0ad'
  ctx.font = '600 13px ui-monospace, monospace'
  ctx.fillText('adriel@studio', 18, h - 13)
  ctx.textAlign = 'right'
  ctx.fillText('arrows + enter, or click a folder', w - 18, h - 13)
}

/** Which folder a click at uv (0..1, origin bottom-left) lands on, or -1. */
const deskHit = (u: number, v: number) => {
  const col = Math.floor((u * SCREEN_PX.w) / DESK_CELL.w)
  const row = Math.floor(((1 - v) * SCREEN_PX.h - DESK_TOP) / DESK_CELL.h)
  const index = row * DESK_COLS + col
  return row >= 0 && col >= 0 && col < DESK_COLS && index < DESK_PROJECTS.length ? index : -1
}

// the desktop canvas, created on first use and repainted when the selection moves
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
const Desk = memo(function Desk({
  onPick,
  onHover,
  active,
  sel,
  onOpen,
  onLook,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
  active: boolean
  sel: number
  onOpen: (index: number) => void
  onLook: (view: 'terminal' | 'sideboard' | 'billiards') => void
}) {
  const screen = deskScreen()
  const glass = useRef<THREE.Mesh>(null)
  const painted = useRef(-1)
  const steam = useRef<THREE.Group>(null)
  const tower = useRef<THREE.Mesh[]>([])
  const live = terminalScreen()
  const termPaint = useRef(0)

  useFrame(({ clock, camera, size }, delta) => {
    const t = clock.elapsedTime
    if (painted.current !== sel) {
      painted.current = sel
      paintDesk(deskScreen().ctx, sel)
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
    tower.current.forEach((fan, i) => {
      if (fan)
        (fan.material as THREE.MeshStandardMaterial).emissiveIntensity =
          1.4 + Math.sin(t * 2 + i * 1.7) * 0.7
    })
  })

  return (
    <Hotspot station="projects" label="Projects — the screens" onPick={onPick} onHover={onHover}>
      <group>
        {/* desk: narrower than the old workbench, angled like a gaming setup */}
        <Box position={[1.4, 1.0, -4.62]} size={[3.3, 0.08, 1.12]} color={C.wood} />
        <Box position={[1.4, 0.98, -4.62]} size={[3.24, 0.02, 1.06]} color="#1d2733" />
        <Box position={[-0.14, 0.48, -4.62]} size={[0.1, 0.96, 1.02]} color={C.woodDark} />
        <Box position={[2.94, 0.48, -4.62]} size={[0.1, 0.96, 1.02]} color={C.woodDark} />
        <Box position={[1.4, 0.6, -5.1]} size={[3.06, 0.72, 0.06]} color={C.woodDark} />

        {/* main monitor: short arm, so the panel sits just above the desk */}
        <Box position={[1.95, 1.06, -4.92]} size={[0.42, 0.04, 0.28]} color={C.metal} />
        <Box position={[1.95, 1.2, -4.96]} size={[0.07, 0.24, 0.07]} color={C.metal} />
        <Box position={[1.95, 1.68, -4.94]} size={[1.5, 0.86, 0.06]} color={C.dark} />
        <mesh
          ref={glass}
          position={[1.95, 1.68, -4.905]}
          onClick={(e) => {
            // at the desk a click opens the folder under it; from the room it falls through to the hotspot
            if (!active || !e.uv) return
            e.stopPropagation()
            if (pointerDrag.moved > 6) return
            const index = deskHit(e.uv.x, e.uv.y)
            if (index >= 0) onOpen(index)
          }}
        >
          <planeGeometry args={[1.39, 0.77]} />
          <meshStandardMaterial
            map={screen.texture}
            emissive="#ffffff"
            emissiveMap={screen.texture}
            emissiveIntensity={0.55}
            toneMapped={false}
          />
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
        <group position={[3.24, 0, -4.5]}>
          <Box position={[0, 0.42, 0]} size={[0.46, 0.84, 0.74]} color="#12181f" />
          <Box position={[0, 0.42, 0.372]} size={[0.38, 0.72, 0.014]} color="#0a0e13" />
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
const Shelf = memo(function Shelf({
  onPick,
  onHover,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const books = useMemo(() => {
    const random = seeded(7)
    const rows: { position: Vec3; size: Vec3; color: string }[] = []
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
    return rows
  }, [])

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
          <Box key={i} position={b.position} size={b.size} color={b.color} />
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
      </group>
    </Hotspot>
  )
})

/** Frames on the left wall — the awards station. */
const Frames = memo(function Frames({
  onPick,
  onHover,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const face = useMemo(() => certificateTexture(), [])
  return (
    <Hotspot station="certificates" label="Awards — the wall" onPick={onPick} onHover={onHover}>
      <group>
        {[0.6, 1.8, 3.0, 4.2].map((z, i) => (
          <group key={z} position={[-5.9, 2.75 + (i % 2) * 0.35, z]} rotation={[0, Math.PI / 2, 0]}>
            <Box position={[0, 0, 0]} size={[1.02, 1.3, 0.06]} color={C.woodDark} />
            <mesh position={[0, 0, 0.04]}>
              <planeGeometry args={[0.86, 1.12]} />
              <meshStandardMaterial map={face} roughness={0.9} />
            </mesh>
          </group>
        ))}
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

/** Night window with a warm sill light. */
const Window = memo(function Window() {
  const sky = useMemo(() => windowTexture(), [])
  return (
    <group position={[4.0, 3.0, -5.94]}>
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
const Rack = memo(function Rack() {
  const leds = useRef<THREE.Mesh[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    leds.current.forEach((led, i) => {
      if (!led) return
      const mat = led.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = Math.sin(t * (2 + i * 0.6) + i) > 0.2 ? 2.4 : 0.25
    })
  })
  return (
    <group position={[4.9, 0, -4.9]}>
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

/** Gallery bar above the certificate frames: the awards wall gets the same warmth as the desk. */
const GalleryLight = memo(function GalleryLight() {
  return (
    <group position={[-5.78, 3.92, 2.4]}>
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
const MENU_CARDS = [34, 256].map((x) => ({ x, y: 116, w: 190, h: 140 }))
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
    const color = i === 0 ? '#3fb0b7' : '#ffd08a'
    ctx.fillStyle = on ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'
    ctx.beginPath()
    ctx.roundRect(card.x, card.y, card.w, card.h, 12)
    ctx.fill()
    ctx.strokeStyle = on ? color : 'rgba(232,241,242,0.14)'
    ctx.lineWidth = on ? 3 : 1.5
    ctx.stroke()
    const cx = card.x + card.w / 2
    if (i === 0) padLogo(ctx, cx, card.y + 48)
    else youtubeLogo(ctx, cx, card.y + 48, 1)
    ctx.fillStyle = on ? color : 'rgba(232,241,242,0.6)'
    ctx.font = '700 18px ui-monospace, monospace'
    ctx.fillText(i === 0 ? 'PONG' : 'YOUTUBE', cx, card.y + 104)
    ctx.fillStyle = 'rgba(232,241,242,0.45)'
    ctx.font = '600 11px ui-monospace, monospace'
    ctx.fillText(i === 0 ? 'play the match' : 'watch a video', cx, card.y + 124)
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

  useFrame(({ pointer, camera, size }, delta) => {
    if (tvOverlay.el && glass.current)
      pinToScreen(tvOverlay.el, glass.current, 0.83, 0.46, camera, size)

    const dt = Math.min(delta, 0.05)
    const s = match.current

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
    const redraw = lastFrame.current !== frame || paint.current > (mode === 'game' ? 0.05 : 0.4)
    if (!redraw) return
    paint.current = 0
    lastFrame.current = frame

    const screen = pongScreen()
    if (mode === 'menu') paintMenu(screen.ctx, sel)
    else if (mode === 'videos') paintVideos(screen.ctx, sel)
    else if (mode === 'youtube') paintVideo(screen.ctx)
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
        {/* two game pads, a book and a mug */}
        {[-0.62, -0.16].map((x, i) => (
          <group key={x} position={[x, 0.49, 0.16]} rotation={[0, 0.18 + i * 0.14, 0]}>
            <Gamepad />
          </group>
        ))}
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
            emissiveIntensity={1.6}
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
            emissiveIntensity={1.2}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
        <pointLight
          position={[0, 0.15, 0.15]}
          intensity={2.2}
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
  deskActive,
  deskSel,
  onDeskOpen,
  onLook,
  billiardsActive,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
  onPoster: () => void
  onTv: () => void
  onTvPick: (index: number) => void
  tvActive: boolean
  tvMode: TvMode
  tvSel: number
  deskActive: boolean
  deskSel: number
  onDeskOpen: (index: number) => void
  onLook: (view: 'terminal' | 'sideboard' | 'billiards') => void
  billiardsActive: boolean
}) {
  return (
    <group>
      <RoomShell />
      <Desk
        onPick={onPick}
        onHover={onHover}
        active={deskActive}
        sel={deskSel}
        onOpen={onDeskOpen}
        onLook={onLook}
      />
      <Shelf onPick={onPick} onHover={onHover} />
      <Board onPick={onPick} onHover={onHover} />
      <Frames onPick={onPick} onHover={onHover} />
      <Poster onPick={onPoster} onHover={onHover} />
      <Window />
      <Rack />

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
      <Billiards active={billiardsActive} onLook={onLook} onHover={onHover} />
      <Sideboard onLook={onLook} onHover={onHover} />
      <GalleryLight />
      <Pendant />

      <Plant position={[-5.45, 0, 4.45]} />
      <Plant position={[-5.0, 0, -5.1]} tall />
    </group>
  )
})
