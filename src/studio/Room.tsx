import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { pointerDrag, type StationId, type TvMode } from './data'
import {
  boardTexture,
  certificateTexture,
  floorTexture,
  projectsTexture,
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
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

/** Deterministic pseudo-random so the shelf looks the same on every visit. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const BOOK_COLORS = ['#a24b3a', '#3f6d6a', '#c8a25a', '#5a5f8a', '#7d8c5a', '#8a5a3b', '#a9b0a2', '#6b4a63']

/** Ceiling-free room: two walls, so the isometric camera can look straight in. */
const RoomShell = memo(function RoomShell() {
  const floor = useMemo(() => floorTexture(), [])
  return (
    <group>
      {/* the whole room stands on a thick diorama base, so the floor reads as a slab */}
      <Box position={[0, -0.55, 0]} size={[12.4, 0.8, 12.4]} color="#241811" />
      <Box position={[0, -0.15, 0]} size={[12.58, 0.14, 12.58]} color="#3a2719" />
      <Box position={[0, -0.026, 0]} size={[12.7, 0.05, 12.7]} color="#b8a48a" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={floor} roughness={0.9} />
      </mesh>

      {/* back and left walls, with a darker wainscot band like the reference room */}
      <Box position={[0, 2.5, -6.1]} size={[12.4, 5, 0.2]} color={C.wall} />
      <Box position={[0, 0.55, -5.98]} size={[12.2, 1.1, 0.06]} color={C.wainscot} />
      <Box position={[0, 1.12, -5.96]} size={[12.2, 0.07, 0.1]} color={C.trim} />

      <Box position={[-6.1, 2.5, 0]} size={[0.2, 5, 12.4]} color={C.wall} />
      <Box position={[-5.98, 0.55, 0]} size={[0.06, 1.1, 12.2]} color={C.wainscot} />
      <Box position={[-5.96, 1.12, 0]} size={[0.1, 0.07, 12.2]} color={C.trim} />

      {/* floor trim */}
      <Box position={[0, 0.06, -5.92]} size={[12.2, 0.12, 0.08]} color={C.trim} />
      <Box position={[-5.92, 0.06, 0]} size={[0.08, 0.12, 12.2]} color={C.trim} />

      {/* rug */}
      {/* rug: pulled up toward the desk and the shelf, clear of the lounge */}
      <Box position={[-0.1, 0.02, 0.4]} size={[5.4, 0.04, 3.8]} color={C.rug} />
      <Box position={[-0.1, 0.045, 0.4]} size={[4.9, 0.01, 3.3]} color={C.rugTrim} />
      <Box position={[-0.1, 0.052, 0.4]} size={[4.5, 0.01, 2.9]} color={C.rug} />
    </group>
  )
})

/** The live terminal: a fixed script that types itself out, so the screen is never a still image. */
const TERM = { w: 640, h: 400 }

const TERM_LINES: [string, string][] = [
  ['adriel@studio:~$ npm run dev', '#3fb0b7'],
  ['  vite v8  ready in 214 ms', '#9fb2bb'],
  ['adriel@studio:~$ git log --oneline -3', '#3fb0b7'],
  ['  a0f0f19 studio: open the portrait', '#cdd9dd'],
  ['  d54d84f studio: animate the host', '#cdd9dd'],
  ['  85a9848 studio: lounge and tv', '#cdd9dd'],
  ['adriel@studio:~$ npm test', '#3fb0b7'],
  ['  pass 2  fail 0', '#7fd6b8'],
  ['adriel@studio:~$ npm run build', '#3fb0b7'],
  ['  built in 1.56s', '#7fd6b8'],
  ['adriel@studio:~$ ls projects', '#3fb0b7'],
  ['  dailyboost   sakip   carta', '#cdd9dd'],
  ['adriel@studio:~$ _', '#3fb0b7'],
]

const paintTerminal = (ctx: CanvasRenderingContext2D, time: number) => {
  const w = TERM.w
  ctx.fillStyle = '#0b111c'
  ctx.fillRect(0, 0, w, TERM.h)
  ctx.font = '600 17px ui-monospace, monospace'
  // one line every 0.55s, then a beat on the last line before starting over
  const shown = Math.floor((time * 1.8) % (TERM_LINES.length + 3))
  TERM_LINES.slice(0, shown).forEach(([text, color], i) => {
    ctx.fillStyle = color
    ctx.fillText(text, 26, 48 + i * 26)
  })
  const caret = Math.floor(time * 2) % 2 === 0
  if (caret) {
    const y = 48 + Math.min(shown, TERM_LINES.length) * 26
    ctx.fillStyle = '#3fb0b7'
    ctx.fillRect(26, y - 15, 10, 19)
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
    texture.anisotropy = 4
    terminalCanvas = { ctx: canvas.getContext('2d')!, texture }
  }
  return terminalCanvas
}

/** Gaming desk: two screens on low arms, an RGB tower, a headset — the projects station. */
const Desk = memo(function Desk({
  onPick,
  onHover,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const projects = useMemo(() => projectsTexture(), [])
  const steam = useRef<THREE.Group>(null)
  const tower = useRef<THREE.Mesh[]>([])
  const live = terminalScreen()
  const termPaint = useRef(0)

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
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
      if (fan) (fan.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4 + Math.sin(t * 2 + i * 1.7) * 0.7
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
        <mesh position={[1.95, 1.68, -4.905]}>
          <planeGeometry args={[1.39, 0.77]} />
          <meshStandardMaterial map={projects} emissive="#ffffff" emissiveMap={projects} emissiveIntensity={0.55} toneMapped={false} />
        </mesh>

        {/* second screen: the live terminal, turned toward him */}
        <group position={[0.42, 0, -4.9]} rotation={[0, 0.24, 0]}>
          <Box position={[0, 1.05, 0]} size={[0.34, 0.035, 0.24]} color={C.metal} />
          <Box position={[0, 1.16, -0.02]} size={[0.06, 0.19, 0.06]} color={C.metal} />
          <Box position={[0, 1.55, 0]} size={[1.12, 0.68, 0.05]} color={C.dark} />
          <mesh position={[0, 1.55, 0.03]}>
            <planeGeometry args={[1.03, 0.6]} />
            <meshStandardMaterial map={live.texture} emissive="#ffffff" emissiveMap={live.texture} emissiveIntensity={0.7} toneMapped={false} />
          </mesh>
        </group>

        {/* keyboard, mouse, notebook */}
        <Box position={[1.15, 1.06, -4.32]} size={[0.94, 0.035, 0.3]} color={C.metal} />
        <Box position={[1.88, 1.06, -4.3]} size={[0.14, 0.03, 0.2]} color={C.metal} />
        <Box position={[0.08, 1.05, -4.36]} size={[0.42, 0.03, 0.32]} color={C.cream} rotation={[0, -0.2, 0]} />

        {/* mug + steam */}
        <mesh position={[2.72, 1.13, -4.3]} castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.17, 12]} />
          <meshStandardMaterial color={C.cream} roughness={0.7} />
        </mesh>
        <group ref={steam}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[2.75, 1.22, -4.3]}>
              <sphereGeometry args={[1, 8, 8]} />
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
            <meshStandardMaterial color={ACCENT_LIGHT} emissive={ACCENT_LIGHT} emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
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
              <torusGeometry args={[0.12, 0.015, 6, 18]} />
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
        <group position={[1.3, 0, -3.16]}>
          <Box position={[0, 0.66, 0.04]} size={[0.7, 0.12, 0.72]} color="#191f2a" />
          <Box position={[0, 0.98, 0.38]} size={[0.62, 0.64, 0.11]} color="#191f2a" rotation={[-0.16, 0, 0]} />
          <Box position={[0, 0.98, 0.36]} size={[0.28, 0.56, 0.1]} color="#26313d" rotation={[-0.16, 0, 0]} />
          {[-0.3, 0.3].map((x) => (
            <Box key={x} position={[x, 0.95, 0.3]} size={[0.11, 0.36, 0.15]} color="#26313d" rotation={[-0.1, 0, 0]} />
          ))}
          <Box position={[0, 0.72, 0.42]} size={[0.46, 0.26, 0.09]} color={C.accent} />
          <Box position={[0, 0.3, 0]} size={[0.09, 0.56, 0.09]} color={C.metal} />
          <Box position={[0, 0.04, 0]} size={[0.56, 0.06, 0.56]} color={C.metal} />
          {[
            [0.98, -3.6],
            [1.62, -3.6],
            [0.98, -3.0],
            [1.62, -3.0],
          ].map(([x, z]) => (
            <Box key={`${x}${z}`} position={[x, 0.12, z]} size={[0.06, 0.24, 0.06]} color={C.metal} />
          ))}
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
          <Box key={i} position={[-5.62, 0.34 + i * 0.62, -2.85]} size={[0.46, 0.06, 3.1]} color={C.wood} />
        ))}
        {books.map((b, i) => (
          <Box key={i} position={b.position} size={b.size} color={b.color} />
        ))}
        {/* a few horizontal stacks, like the reference shelf */}
        <Box position={[-5.62, 1.68, -4.05]} size={[0.3, 0.09, 0.5]} color="#c8a25a" />
        <Box position={[-5.62, 1.78, -4.02]} size={[0.28, 0.08, 0.46]} color="#a24b3a" rotation={[0, 0.1, 0]} />
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
        {[0.7, 2.0, 3.3, 4.6].map((z, i) => (
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
      t.anisotropy = 4
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
        <meshStandardMaterial map={sky} emissive="#ffffff" emissiveMap={sky} emissiveIntensity={0.35} toneMapped={false} />
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
    <group position={[5.4, 0, -4.9]}>
      <Box position={[0, 0.98, 0]} size={[0.86, 1.96, 0.8]} color={C.dark} />
      {[0.35, 0.62, 0.89, 1.16, 1.43].map((y, i) => (
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
        <cylinderGeometry args={[potR, potR * 0.76, potH, 18]} />
        <meshStandardMaterial color={tall ? '#b5895f' : '#a86f4b'} roughness={0.92} />
      </mesh>
      <mesh position={[0, potH + 0.005, 0]} receiveShadow>
        <cylinderGeometry args={[potR * 0.93, potR * 0.93, 0.05, 18]} />
        <meshStandardMaterial color="#2b1e15" roughness={1} />
      </mesh>
      <mesh position={[0, potH - 0.02, 0]}>
        <torusGeometry args={[potR * 0.99, 0.022, 6, 20]} />
        <meshStandardMaterial color={tall ? '#9c7149' : '#8e5b3d'} roughness={0.9} />
      </mesh>

      {leaves.map((leaf, i) => (
        <group key={i} position={[0, potH, 0]} rotation={[0, leaf.angle, 0]}>
          <group rotation={[0, 0, leaf.tilt]}>
            <mesh position={[0, leaf.reach / 2, 0]} castShadow>
              <cylinderGeometry args={[0.013, 0.019, leaf.reach, 6]} />
              <meshStandardMaterial color="#2f5c3c" roughness={0.9} />
            </mesh>
            <mesh position={[0, leaf.reach, 0.03]} rotation={[0.3, 0, 0]} scale={[1.15, 0.16, 0.66]} castShadow>
              <sphereGeometry args={[leaf.size, 16, 10]} />
              <meshStandardMaterial color={leaf.color} roughness={0.7} />
            </mesh>
            {leaf.size > 0.18 && (
              <mesh position={[0, leaf.reach * 0.62, 0.03]} rotation={[0.55, 0, 0]} scale={[0.85, 0.12, 0.5]} castShadow>
                <sphereGeometry args={[leaf.size * 0.72, 14, 10]} />
                <meshStandardMaterial color={LEAF_COLORS[(i + 1) % LEAF_COLORS.length]} roughness={0.72} />
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
    <group position={[-5.78, 3.92, 2.65]}>
      <Box position={[0, 0.06, 0]} size={[0.12, 0.08, 4.4]} color={C.metal} metalness={0.3} roughness={0.5} />
      <Box position={[0, 0.0, 0]} size={[0.1, 0.05, 4.2]} color="#ffd9a0" />
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.08, 0.02, 4.1]} />
        <meshStandardMaterial color="#ffe2b8" emissive="#ffc98a" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {[-1.9, 1.9].map((z) => (
        <Box key={z} position={[0.05, 0.1, z]} size={[0.2, 0.05, 0.05]} color={C.metal} />
      ))}
    </group>
  )
})

/** Floor lamp by the sofa. */
const FloorLamp = memo(function FloorLamp({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.21, 0.06, 16]} />
        <meshStandardMaterial color={C.metal} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 1.84, 8]} />
        <meshStandardMaterial color={C.metal} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.94, 0]} castShadow>
        <coneGeometry args={[0.3, 0.32, 20, 1, true]} />
        <meshStandardMaterial color="#d9d2c2" side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.87, 0]}>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color="#ffe7bf" emissive="#ffc98a" emissiveIntensity={2.6} toneMapped={false} />
      </mesh>
    </group>
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
  ctx.fillText(active ? 'MOVE THE POINTER TO PLAY' : 'NIGHT CIRCUIT · ATTRACT MODE', w / 2, h - 44)
}

const paintMenu = (ctx: CanvasRenderingContext2D) => {
  const { w, h } = PONG
  ctx.fillStyle = '#071019'
  ctx.fillRect(0, 0, w, h)
  const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.75)
  glow.addColorStop(0, 'rgba(63,176,183,0.2)')
  glow.addColorStop(1, 'rgba(7,16,25,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#e8f1f2'
  ctx.font = '700 26px ui-monospace, monospace'
  ctx.fillText('NIGHT CIRCUIT', w / 2, 76)
  ctx.fillStyle = 'rgba(232,241,242,0.45)'
  ctx.font = '600 13px ui-monospace, monospace'
  ctx.fillText('pick something on the right', w / 2, 102)

  const card = (x: number, label: string, sub: string, color: string) => {
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.beginPath()
    ctx.roundRect(x, 140, 190, 108, 12)
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x, 140, 190, 108, 12)
    ctx.stroke()
    ctx.fillStyle = color
    ctx.font = '700 20px ui-monospace, monospace'
    ctx.fillText(label, x + 95, 186)
    ctx.fillStyle = 'rgba(232,241,242,0.5)'
    ctx.font = '600 12px ui-monospace, monospace'
    ctx.fillText(sub, x + 95, 214)
  }
  card(34, 'PONG', 'play the match', '#3fb0b7')
  card(256, 'YOUTUBE', 'watch a video', '#ffd08a')
}

const paintVideo = (ctx: CanvasRenderingContext2D, time: number) => {
  const { w, h } = PONG
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#0a1424')
  sky.addColorStop(0.6, '#16394c')
  sky.addColorStop(1, '#2d5660')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)
  // a slow pan of soft shapes stands in for the frame while the real video plays in the panel
  for (let i = 0; i < 3; i++) {
    const x = ((time * 22 + i * 160) % (w + 200)) - 100
    ctx.fillStyle = `rgba(127,214,184,${0.06 + i * 0.03})`
    ctx.beginPath()
    ctx.arc(x, h * (0.4 + i * 0.15), 90 - i * 18, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(7,16,25,0.55)'
  ctx.fillRect(0, h - 62, w, 62)
  ctx.fillStyle = '#ffd08a'
  ctx.font = '700 18px ui-monospace, monospace'
  ctx.textAlign = 'left'
  ctx.fillText('NOW PLAYING', 24, h - 26)
  ctx.fillStyle = 'rgba(232,241,242,0.6)'
  ctx.font = '600 13px ui-monospace, monospace'
  ctx.fillText('the player is open in the panel', 168, h - 26)
  ctx.textAlign = 'center'
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
    texture.anisotropy = 4
    pong = { ctx: canvas.getContext('2d')!, texture }
  }
  return pong
}

/** Sofa, coffee table and the console — the empty half of the room becomes a lounge. */
const Lounge = memo(function Lounge({
  onTv,
  onHover,
  active,
  mode,
}: {
  onTv: () => void
  onHover: (label: string | null, x: number, y: number) => void
  active: boolean
  mode: TvMode
}) {
  const leave = useRef<number | undefined>(undefined)
  const screen = pongScreen()

  const match = useRef<PongState>({ bx: 0.5, by: 0.5, vx: 0.62, vy: 0.5, player: 0.5, cpu: 0.5, ps: 0, cs: 0 })
  const paint = useRef(0)
  const lastMode = useRef<TvMode | null>(null)

  useFrame(({ pointer, clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = match.current

    if (mode === 'game') {
      const move = (from: number, to: number, rate: number) => from + Math.max(-rate * dt, Math.min(rate * dt, to - from))

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
    const redraw = lastMode.current !== mode || paint.current > (mode === 'game' ? 0.05 : 0.4)
    if (!redraw) return
    paint.current = 0
    lastMode.current = mode

    const screen = pongScreen()
    if (mode === 'menu') paintMenu(screen.ctx)
    else if (mode === 'youtube') paintVideo(screen.ctx, clock.elapsedTime)
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
        <Box position={[-0.78, 0.4, 0.05]} size={[0.46, 0.1, 0.34]} color={C.dark} />
        <mesh position={[-0.78, 0.42, 0.225]}>
          <boxGeometry args={[0.2, 0.012, 0.01]} />
          <meshStandardMaterial color={ACCENT_LIGHT} emissive={ACCENT_LIGHT} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        {[-0.28, 0.28].map((x, i) => (
          <group key={x} position={[x, 0.42, 0.06]} rotation={[0, 0.4 + i * 0.35, 0]}>
            <Box position={[0, 0.02, 0]} size={[0.34, 0.05, 0.2]} color="#1b2330" />
            {[-0.13, 0.13].map((hx) => (
              <Box key={hx} position={[hx, 0.02, -0.03]} size={[0.12, 0.055, 0.15]} color="#232d3a" />
            ))}
            {[-0.045, 0.045].map((sx) => (
              <mesh key={sx} position={[sx, 0.052, 0.03]}>
                <cylinderGeometry args={[0.022, 0.022, 0.012, 10]} />
                <meshStandardMaterial color="#4a5a6b" roughness={0.5} />
              </mesh>
            ))}
          </group>
        ))}

        {/* TV on its stand */}
        <Box position={[0, 0.335, -0.06]} size={[0.54, 0.04, 0.3]} color={C.metal} />
        <Box position={[0, 0.46, -0.1]} size={[0.1, 0.26, 0.08]} color={C.metal} />
        <Box position={[0, 1.02, -0.09]} size={[1.78, 1.02, 0.08]} color="#0d141d" />
        <mesh position={[0, 1.02, -0.045]}>
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
              <cylinderGeometry args={[0.1, 0.1, 0.92, 12]} />
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
          <Box key={x} position={[x, 0.68, -0.25]} size={[0.98, 0.5, 0.18]} color={C.sofaLight} rotation={[-0.12, 0, 0]} />
        ))}
        {[
          [-0.66, '#b4693a'],
          [0.7, '#c8a25a'],
        ].map(([x, color]) => (
          <Box key={x} position={[Number(x), 0.68, -0.08]} size={[0.34, 0.34, 0.14]} color={String(color)} rotation={[0.2, Number(x) * 0.4, 0.1]} />
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
          <Box key={`${x}${z}`} position={[x, 0.2, z]} size={[0.07, 0.4, 0.07]} color={C.woodDark} />
        ))}
        {/* two PlayStation-style pads, a book and a mug */}
        {[-0.62, -0.16].map((x, i) => (
          <group key={x} position={[x, 0.49, 0.16]} rotation={[0, 0.18 + i * 0.14, 0]}>
            <Box position={[0, 0.02, 0]} size={[0.34, 0.05, 0.2]} color="#1b2330" />
            {[-0.13, 0.13].map((hx) => (
              <Box key={hx} position={[hx, 0.02, -0.03]} size={[0.12, 0.055, 0.15]} color="#232d3a" />
            ))}
            {[-0.045, 0.045].map((sx) => (
              <mesh key={sx} position={[sx, 0.052, 0.03]}>
                <cylinderGeometry args={[0.022, 0.022, 0.012, 10]} />
                <meshStandardMaterial color="#4a5a6b" roughness={0.5} />
              </mesh>
            ))}
            <mesh position={[0.02, 0.052, -0.04]}>
              <sphereGeometry args={[0.014, 8, 6]} />
              <meshStandardMaterial color={ACCENT_LIGHT} emissive={ACCENT_LIGHT} emissiveIntensity={1.2} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <Box position={[0.62, 0.49, -0.18]} size={[0.4, 0.04, 0.28]} color={C.cream} rotation={[0, -0.2, 0]} />
        <mesh position={[0.85, 0.52, 0.22]} castShadow>
          <cylinderGeometry args={[0.06, 0.055, 0.1, 12]} />
          <meshStandardMaterial color="#2f4d56" roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
})

/** Sideboard with a coffee setup, filling the empty floor in front of the rug. */
const CoffeeNook = memo(function CoffeeNook() {
  return (
    <group position={[-1.2, 0, 4.15]} rotation={[0, 0.12, 0]}>
      {/* desk-sized top: this is the coffee table the room was missing */}
      <Box position={[0, 0.98, 0]} size={[3.3, 0.08, 1.12]} color={C.wood} />
      <Box position={[0, 0.96, 0]} size={[3.24, 0.02, 1.06]} color="#3a2a20" />
      <Box position={[-1.56, 0.46, 0]} size={[0.1, 0.92, 1.02]} color={C.woodDark} />
      <Box position={[1.56, 0.46, 0]} size={[0.1, 0.92, 1.02]} color={C.woodDark} />
      <Box position={[0, 0.62, -0.5]} size={[3.06, 0.68, 0.06]} color={C.woodDark} />
      <Box position={[0, 0.28, 0.02]} size={[2.9, 0.06, 0.94]} color={C.woodDark} />

      {/* kettle, two cups, a jar and a book — a coffee corner, not a prop shelf */}
      <mesh position={[-1.05, 1.12, 0.1]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.2, 14]} />
        <meshStandardMaterial color="#2f4d56" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[-1.05, 1.25, 0.1]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color={C.metal} roughness={0.4} metalness={0.4} />
      </mesh>
      {[-0.62, -0.36].map((x) => (
        <mesh key={x} position={[x, 1.07, 0.2]} castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
          <meshStandardMaterial color={C.cream} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0.1, 1.08, -0.12]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.13, 12]} />
        <meshStandardMaterial color="#8a5d3b" roughness={0.85} />
      </mesh>
      <Box position={[0.08, 1.05, 0.3]} size={[0.32, 0.05, 0.22]} color="#c8a25a" rotation={[0, 0.2, 0]} />
      <Box position={[1.02, 1.05, 0.12]} size={[0.42, 0.04, 0.3]} color={C.cream} rotation={[0, -0.15, 0]} />
    </group>
  )
})

/** Pendant lamp over the desk — the room's warm key light. */
const Pendant = memo(function Pendant() {
  return (
    <group position={[1.4, 0, -4.4]}>
      <mesh position={[0, 4.55, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 6]} />
        <meshStandardMaterial color={C.dark} />
      </mesh>
      <mesh position={[0, 3.88, 0]} castShadow>
        <coneGeometry args={[0.52, 0.42, 16, 1, true]} />
        <meshStandardMaterial color="#1f3a3a" side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.74, 0]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffc275" emissiveIntensity={2.2} toneMapped={false} />
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
  tvActive,
  tvMode,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
  onPoster: () => void
  onTv: () => void
  tvActive: boolean
  tvMode: TvMode
}) {
  return (
    <group>
      <RoomShell />
      <Desk onPick={onPick} onHover={onHover} />
      <Shelf onPick={onPick} onHover={onHover} />
      <Board onPick={onPick} onHover={onHover} />
      <Frames onPick={onPick} onHover={onHover} />
      <Poster onPick={onPoster} onHover={onHover} />
      <Window />
      <Rack />

      <Lounge onTv={onTv} onHover={onHover} active={tvActive} mode={tvMode} />
      <CoffeeNook />
      <GalleryLight />
      <FloorLamp position={[5.45, 0, 3.65]} />
      <Pendant />

      <Plant position={[5.55, 0, 4.6]} />
      <Plant position={[-4.6, 0, 4.4]} />
      <Plant position={[-5.0, 0, -5.1]} tall />
    </group>
  )
})
