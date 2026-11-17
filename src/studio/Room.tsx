import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { pointerDrag, type StationId } from './data'
import {
  boardTexture,
  certificateTexture,
  floorTexture,
  projectsTexture,
  terminalTexture,
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
      <Box position={[-0.1, 0.02, 1.4]} size={[5.4, 0.04, 3.8]} color={C.rug} />
      <Box position={[-0.1, 0.045, 1.4]} size={[4.9, 0.01, 3.3]} color={C.rugTrim} />
      <Box position={[-0.1, 0.052, 1.4]} size={[4.5, 0.01, 2.9]} color={C.rug} />
    </group>
  )
})

/** Desk, two monitors, keyboard, mug and chair — the projects station. */
const Desk = memo(function Desk({
  onPick,
  onHover,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  const terminal = useMemo(() => terminalTexture(), [])
  const projects = useMemo(() => projectsTexture(), [])
  const steam = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!steam.current) return
    const t = clock.elapsedTime
    steam.current.children.forEach((child, i) => {
      const p = (t * 0.35 + i / 3) % 1
      child.position.y = 1.22 + p * 0.45
      child.position.x = 3.05 + Math.sin(p * 6 + i) * 0.05
      child.scale.setScalar(0.05 + p * 0.06)
      const puff = child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
      puff.material.opacity = 0.32 * (1 - p)
    })
  })

  return (
    <Hotspot station="projects" label="Projects — the screens" onPick={onPick} onHover={onHover}>
      <group>
        {/* desk */}
        <Box position={[1.4, 1.02, -4.6]} size={[4.6, 0.1, 1.4]} color={C.wood} />
        <Box position={[-0.68, 0.5, -4.6]} size={[0.12, 1, 1.3]} color={C.woodDark} />
        <Box position={[3.48, 0.5, -4.6]} size={[0.12, 1, 1.3]} color={C.woodDark} />
        <Box position={[1.4, 0.62, -5.22]} size={[4.3, 0.76, 0.08]} color={C.woodDark} />

        {/* main monitor, standing on the desk: base plate, neck, panel */}
        <Box position={[2.25, 1.1, -5.1]} size={[0.52, 0.06, 0.36]} color={C.metal} />
        <Box position={[2.25, 1.37, -5.16]} size={[0.09, 0.52, 0.09]} color={C.metal} />
        <Box position={[2.25, 2.12, -5.12]} size={[1.62, 0.98, 0.07]} color={C.dark} />
        <mesh position={[2.25, 2.12, -5.075]} rotation={[0, 0, 0]}>
          <planeGeometry args={[1.5, 0.87]} />
          <meshStandardMaterial map={projects} emissive="#ffffff" emissiveMap={projects} emissiveIntensity={0.55} toneMapped={false} />
        </mesh>

        {/* terminal monitor, slightly turned */}
        <group position={[0.55, 0, -5.1]} rotation={[0, 0.22, 0]}>
          <Box position={[0, 1.1, 0]} size={[0.44, 0.05, 0.32]} color={C.metal} />
          <Box position={[0, 1.36, -0.03]} size={[0.08, 0.48, 0.08]} color={C.metal} />
          <Box position={[0, 1.92, 0]} size={[1.3, 0.8, 0.06]} color={C.dark} />
          <mesh position={[0, 1.92, 0.035]}>
            <planeGeometry args={[1.2, 0.71]} />
            <meshStandardMaterial map={terminal} emissive="#ffffff" emissiveMap={terminal} emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
        </group>

        {/* keyboard, mouse, notebook */}
        <Box position={[1.25, 1.08, -4.28]} size={[1.1, 0.04, 0.34]} color={C.metal} />
        <Box position={[2.05, 1.08, -4.24]} size={[0.16, 0.03, 0.22]} color={C.metal} />
        <Box position={[0.15, 1.08, -4.3]} size={[0.55, 0.04, 0.4]} color={C.cream} rotation={[0, -0.18, 0]} />

        {/* mug + steam */}
        <mesh position={[3.05, 1.17, -4.22]} castShadow>
          <cylinderGeometry args={[0.1, 0.09, 0.19, 12]} />
          <meshStandardMaterial color={C.cream} roughness={0.7} />
        </mesh>
        <group ref={steam}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[3.05, 1.26, -4.22]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#dfe9ec" transparent opacity={0.28} depthWrite={false} />
            </mesh>
          ))}
        </group>

        {/* chair, tucked in to the desk */}
        <Box position={[1.3, 0.62, -3.35]} size={[0.86, 0.12, 0.8]} color={C.dark} />
        <Box position={[1.3, 1.12, -3.0]} size={[0.8, 0.72, 0.1]} color={C.dark} rotation={[0.12, 0, 0]} />
        <Box position={[1.3, 0.3, -3.35]} size={[0.1, 0.6, 0.1]} color={C.metal} />
        <Box position={[1.3, 0.04, -3.35]} size={[0.62, 0.06, 0.62]} color={C.metal} />
        {[
          [0.98, -3.65],
          [1.62, -3.65],
          [0.98, -3.05],
          [1.62, -3.05],
        ].map(([x, z]) => (
          <Box key={`${x}${z}`} position={[x, 0.12, z]} size={[0.06, 0.24, 0.06]} color={C.metal} />
        ))}
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
}: {
  onTv: () => void
  onHover: (label: string | null, x: number, y: number) => void
  active: boolean
}) {
  const leave = useRef<number | undefined>(undefined)
  const screen = pongScreen()

  const match = useRef<PongState>({ bx: 0.5, by: 0.5, vx: 0.62, vy: 0.5, player: 0.5, cpu: 0.5, ps: 0, cs: 0 })
  const paint = useRef(0)

  useFrame(({ pointer }, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = match.current
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

    // 20 fps is plenty for a CRT-sized screen and keeps the texture upload cheap
    paint.current += dt
    if (paint.current > 0.05) {
      paint.current = 0
      paintPong(pongScreen().ctx, s, active)
      pongScreen().texture.needsUpdate = true
    }
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
        {/* the console itself */}
        <Box position={[-0.78, 0.4, 0.05]} size={[0.46, 0.1, 0.34]} color={C.dark} />
        <mesh position={[-0.78, 0.42, 0.225]}>
          <boxGeometry args={[0.2, 0.012, 0.01]} />
          <meshStandardMaterial color={ACCENT_LIGHT} emissive={ACCENT_LIGHT} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>

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

      {/* coffee table */}
      <group position={[4.35, 0, 1.5]}>
        <Box position={[0, 0.44, 0]} size={[1.6, 0.08, 0.82]} color={C.wood} />
        <Box position={[0, 0.32, 0]} size={[1.44, 0.06, 0.7]} color={C.woodDark} />
        {[
          [-0.66, -0.3],
          [0.66, -0.3],
          [-0.66, 0.3],
          [0.66, 0.3],
        ].map(([x, z]) => (
          <Box key={`${x}${z}`} position={[x, 0.2, z]} size={[0.07, 0.4, 0.07]} color={C.woodDark} />
        ))}
        {/* controller, a book and a mug */}
        <Box position={[0.18, 0.5, 0.12]} size={[0.26, 0.05, 0.16]} color="#1b2330" rotation={[0, 0.3, 0]} />
        <Box position={[-0.42, 0.49, -0.12]} size={[0.36, 0.04, 0.26]} color={C.cream} rotation={[0, -0.2, 0]} />
        <mesh position={[-0.35, 0.52, -0.1]} castShadow>
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
    <group position={[-1.35, 0, 4.35]} rotation={[0, 0.12, 0]}>
      <Box position={[0, 0.4, 0]} size={[1.5, 0.08, 0.58]} color={C.wood} />
      <Box position={[0, 0.22, 0]} size={[1.4, 0.28, 0.52]} color={C.woodDark} />
      {[-0.35, 0.35].map((x) => (
        <group key={x}>
          <Box position={[x, 0.22, 0.27]} size={[0.6, 0.22, 0.02]} color={C.wood} />
          <Box position={[x + 0.22, 0.22, 0.29]} size={[0.06, 0.02, 0.02]} color={C.trim} />
        </group>
      ))}
      {[-0.64, 0.64].map((x) => (
        <Box key={x} position={[x, 0.08, 0]} size={[0.07, 0.16, 0.5]} color={C.woodDark} />
      ))}

      {/* kettle, two cups, a jar and a book — a coffee corner, not a prop shelf */}
      <mesh position={[-0.4, 0.54, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.2, 14]} />
        <meshStandardMaterial color="#2f4d56" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[-0.4, 0.67, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color={C.metal} roughness={0.4} metalness={0.4} />
      </mesh>
      {[0.0, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.49, 0.1]} castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
          <meshStandardMaterial color={C.cream} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0.5, 0.5, -0.02]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.13, 12]} />
        <meshStandardMaterial color="#8a5d3b" roughness={0.85} />
      </mesh>
      <Box position={[0.48, 0.47, 0.21]} size={[0.3, 0.05, 0.2]} color="#c8a25a" rotation={[0, 0.2, 0]} />
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
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
  onPoster: () => void
  onTv: () => void
  tvActive: boolean
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

      <Lounge onTv={onTv} onHover={onHover} active={tvActive} />
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
