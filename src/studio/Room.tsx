import { memo, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, useLoader, type ThreeEvent } from '@react-three/fiber'
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
} as const

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
      <Box position={[0.4, 0.02, 1.4]} size={[5.4, 0.04, 3.8]} color={C.rug} />
      <Box position={[0.4, 0.045, 1.4]} size={[4.9, 0.01, 3.3]} color={C.rugTrim} />
      <Box position={[0.4, 0.052, 1.4]} size={[4.5, 0.01, 2.9]} color={C.rug} />
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
      child.position.y = 1.16 + p * 0.5
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

        {/* main monitor */}
        <Box position={[2.25, 1.35, -5.12]} size={[0.5, 0.06, 0.34]} color={C.metal} />
        <Box position={[2.25, 1.62, -5.15]} size={[0.09, 0.5, 0.09]} color={C.metal} />
        <Box position={[2.25, 2.12, -5.12]} size={[1.62, 0.98, 0.07]} color={C.dark} />
        <mesh position={[2.25, 2.12, -5.075]} rotation={[0, 0, 0]}>
          <planeGeometry args={[1.5, 0.87]} />
          <meshStandardMaterial map={projects} emissive="#ffffff" emissiveMap={projects} emissiveIntensity={0.55} toneMapped={false} />
        </mesh>

        {/* terminal monitor, slightly turned */}
        <group position={[0.55, 0, -5.1]} rotation={[0, 0.22, 0]}>
          <Box position={[0, 1.32, 0]} size={[0.42, 0.05, 0.3]} color={C.metal} />
          <Box position={[0, 1.55, -0.02]} size={[0.08, 0.44, 0.08]} color={C.metal} />
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
        <mesh position={[3.05, 1.12, -4.22]} castShadow>
          <cylinderGeometry args={[0.1, 0.09, 0.19, 12]} />
          <meshStandardMaterial color={C.cream} roughness={0.7} />
        </mesh>
        <group ref={steam}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[3.05, 1.2, -4.22]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#dfe9ec" transparent opacity={0.28} depthWrite={false} />
            </mesh>
          ))}
        </group>

        {/* chair */}
        <Box position={[1.3, 0.62, -3.05]} size={[0.86, 0.12, 0.8]} color={C.dark} />
        <Box position={[1.3, 1.12, -2.7]} size={[0.8, 0.72, 0.1]} color={C.dark} rotation={[0.12, 0, 0]} />
        <Box position={[1.3, 0.3, -3.05]} size={[0.1, 0.6, 0.1]} color={C.metal} />
        <Box position={[1.3, 0.04, -3.05]} size={[0.62, 0.06, 0.62]} color={C.metal} />
        {[
          [0.98, -3.35],
          [1.62, -3.35],
          [0.98, -2.75],
          [1.62, -2.75],
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

/** Wall poster: the portrait Adriel already has, framed rather than faked in 3D. */
const Poster = memo(function Poster() {
  const source = useLoader(THREE.TextureLoader, '/images/studio-poster.webp')
  const texture = useMemo(() => {
    const copy = source.clone()
    copy.colorSpace = THREE.SRGBColorSpace
    copy.needsUpdate = true
    return copy
  }, [source])
  return (
    <group position={[1.9, 3.55, -5.92]}>
      <Box position={[0, 0, 0]} size={[1.5, 1.5, 0.06]} color={C.woodDark} />
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[1.34, 1.34]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
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

/** Plant by the rug. */
const Plant = memo(function Plant({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.2, 0.56, 10]} />
        <meshStandardMaterial color="#8a5a3b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.04, 10]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.9} />
      </mesh>
      {[
        [0, 1.0, 0, 0.42, 0.9],
        [0.22, 0.92, 0.12, 0.3, 0.7],
        [-0.2, 0.95, -0.1, 0.28, 0.65],
        [0.08, 1.2, -0.2, 0.26, 0.6],
        [-0.12, 1.18, 0.2, 0.24, 0.55],
      ].map(([x, y, z, r, h], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[i * 0.2, i, i * 0.35]} castShadow>
          <coneGeometry args={[r, h, 5]} />
          <meshStandardMaterial color={i % 2 ? '#3f7a55' : '#2f6b4b'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
})

/** Contact sheet on the rug: character lives in Character.tsx, this is the room's furniture. */
export const Room = memo(function Room({
  onPick,
  onHover,
}: {
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
}) {
  return (
    <group>
      <RoomShell />
      <Desk onPick={onPick} onHover={onHover} />
      <Shelf onPick={onPick} onHover={onHover} />
      <Board onPick={onPick} onHover={onHover} />
      <Frames onPick={onPick} onHover={onHover} />
      <Poster />
      <Window />
      <Rack />
      <Plant position={[4.7, 0, 2.0]} />
      <Plant position={[-4.6, 0, 4.4]} />

      {/* pendant lamp over the desk — the room's warm key light */}
      <mesh position={[1.4, 4.55, -4.4]}>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 6]} />
        <meshStandardMaterial color={C.dark} />
      </mesh>
      <mesh position={[1.4, 3.88, -4.4]} castShadow>
        <coneGeometry args={[0.52, 0.42, 16, 1, true]} />
        <meshStandardMaterial color="#1f3a3a" side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      <mesh position={[1.4, 3.74, -4.4]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffc275" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
    </group>
  )
})
