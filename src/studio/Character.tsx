import { memo, useEffect, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { pointerDrag } from './data'

const SKIN = '#d7a97e'
const HAIR = '#151922'
const HOODIE = '#1c2a3a'
const HOODIE_LIGHT = '#2a3d51'
const HOODIE_DARK = '#16212e'
const JEANS = '#242e3f'
const SHOE = '#10141c'
const GLASS = '#0d1117'
const ACCENT = '#3fb0b7'

type Vec3 = [number, number, number]
type Act = 'stand' | 'sit' | 'shelf'

/** A place the character can spend time in: where he stands, which way he faces, what he does. */
type Spot = { x: number; z: number; yaw: number; act: Act; hold: number }

/** Framing of the About view was built around this pose, so it is also his home base. */
const GREET: Spot = { x: 0.7, z: 2.05, yaw: 0.42, act: 'stand', hold: 0 }

/** A day in the room: stand by the rug, work at the desk, browse the shelf, wander back. */
const ROUTINE: Spot[] = [
  { x: 1.05, z: 1.75, yaw: 0.3, act: 'stand', hold: 5 },
  { x: 1.3, z: -3.3, yaw: Math.PI, act: 'sit', hold: 14 },
  { x: -4.15, z: -2.45, yaw: -Math.PI / 2, act: 'shelf', hold: 8 },
  { x: 0.15, z: 3.6, yaw: 0.05, act: 'stand', hold: 5 },
]

const HIP_Y = 0.95
const SEAT_DROP = 0.3

const damp = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * Math.min(dt, 0.12)))

/** Shortest way around the circle, so he never spins the long way when turning. */
const turn = (current: number, target: number, rate: number, dt: number) =>
  current + (Math.atan2(Math.sin(target - current), Math.cos(target - current)) * (1 - Math.exp(-rate * Math.min(dt, 0.12))))

function Capsule({
  r,
  len,
  color,
  position,
  rotation,
  scale,
}: {
  r: number
  len: number
  color: string
  position: Vec3
  rotation?: Vec3
  scale?: Vec3
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      <capsuleGeometry args={[r, len, 5, 14]} />
      <meshStandardMaterial color={color} roughness={0.86} />
    </mesh>
  )
}

function Ball({
  r,
  color,
  position,
  scale,
  roughness = 0.85,
}: {
  r: number
  color: string
  position: Vec3
  scale?: Vec3
  roughness?: number
}) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[r, 20, 16]} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  )
}

interface CharacterProps {
  onPick: () => void
  onHover: (label: string | null, x: number, y: number) => void
  /** bumped by the page when the character says hi, so the arm waves once per click */
  greetKey: number
  /** About is open: stand at the greeting spot instead of wandering */
  focus: boolean
  reduced: boolean
}

/**
 * Low-poly Adriel, built from rounded primitives: he walks the room, sits down at the desk,
 * browses the shelf, turns his head toward the pointer and waves when greeted.
 */
export const Character = memo(function Character({ onPick, onHover, greetKey, focus, reduced }: CharacterProps) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const shoulderL = useRef<THREE.Group>(null)
  const shoulderR = useRef<THREE.Group>(null)
  const elbowL = useRef<THREE.Group>(null)
  const elbowR = useRef<THREE.Group>(null)
  const hipL = useRef<THREE.Group>(null)
  const hipR = useRef<THREE.Group>(null)
  const kneeL = useRef<THREE.Group>(null)
  const kneeR = useRef<THREE.Group>(null)
  const waveAt = useRef(-20)

  const anim = useRef({
    index: 0,
    phase: 'hold' as 'walk' | 'hold',
    timer: 0,
    yaw: GREET.yaw,
    x: GREET.x,
    z: GREET.z,
    act: 'stand' as Act,
    walk: 0,
    sit: 0,
    step: 0,
  })

  useEffect(() => {
    if (greetKey > 0) waveAt.current = performance.now() / 1000
  }, [greetKey])

  useFrame(({ clock, pointer }, delta) => {
    // smoothing uses a clamped step so a long frame never snaps a pose, but the routine itself
    // runs on real seconds: a slow device must not turn a five second pause into thirty
    const dt = Math.min(delta, 0.05)
    const real = Math.min(delta, 0.25)
    const t = clock.elapsedTime
    const a = anim.current
    const target = focus || reduced ? GREET : ROUTINE[a.index]

    // --- walk / arrive ------------------------------------------------------
    const dx = target.x - a.x
    const dz = target.z - a.z
    const distance = Math.hypot(dx, dz)
    const moving = !reduced && distance > 0.05

    if (moving) {
      const step = Math.min(distance, 1.15 * real)
      a.x += (dx / distance) * step
      a.z += (dz / distance) * step
      a.step += real * 7.2
      a.walk = damp(a.walk, 1, 7, dt)
      a.yaw = turn(a.yaw, Math.atan2(dx, dz), 9, dt)
      a.act = 'stand'
      a.phase = 'walk'
    } else {
      a.walk = damp(a.walk, 0, 6, dt)
      a.yaw = turn(a.yaw, target.yaw, 5, dt)
      a.act = target.act
      if (a.phase === 'walk') {
        a.phase = 'hold'
        a.timer = 0
      } else if (!focus && !reduced) {
        a.timer += real
        if (a.timer > target.hold) {
          a.index = (a.index + 1) % ROUTINE.length
          a.phase = 'walk'
          a.timer = 0
        }
      }
    }
    if (reduced) {
      a.x = GREET.x
      a.z = GREET.z
      a.yaw = GREET.yaw
    }

    const sit = damp(a.sit, a.act === 'sit' && !moving ? 1 : 0, 7, dt)
    a.sit = sit

    if (root.current) {
      const bob = Math.abs(Math.sin(a.step)) * 0.03 * a.walk + Math.sin(t * 1.5) * 0.008 * (1 - a.walk)
      root.current.position.set(a.x, -SEAT_DROP * sit + bob, a.z)
      root.current.rotation.y = a.yaw
    }

    // --- legs ---------------------------------------------------------------
    const swing = Math.sin(a.step) * 0.58 * a.walk
    const liftL = Math.max(0, -Math.sin(a.step)) * 0.85 * a.walk
    const liftR = Math.max(0, Math.sin(a.step)) * 0.85 * a.walk
    if (hipL.current) hipL.current.rotation.x = -1.5 * sit + swing
    if (hipR.current) hipR.current.rotation.x = -1.5 * sit - swing
    if (kneeL.current) kneeL.current.rotation.x = 1.55 * sit + liftL
    if (kneeR.current) kneeR.current.rotation.x = 1.55 * sit + liftR

    // --- arms ---------------------------------------------------------------
    const armSwing = Math.sin(a.step) * 0.5 * a.walk
    if (shoulderL.current) {
      shoulderL.current.rotation.x = damp(shoulderL.current.rotation.x, -0.35 * sit - armSwing, 9, dt)
      shoulderL.current.rotation.z = -0.1
    }
    if (elbowL.current) elbowL.current.rotation.z = damp(elbowL.current.rotation.z, 0.35 * sit, 9, dt)

    const since = performance.now() / 1000 - waveAt.current
    const waving = since < 1.9
    if (shoulderR.current) {
      // +z lifts the right arm outward and up: the old -z value folded it across his chest
      const shoulderZ = waving ? 2.3 + Math.sin(since * 13) * 0.12 : -0.1
      shoulderR.current.rotation.z = damp(shoulderR.current.rotation.z, shoulderZ, waving ? 18 : 10, dt)
      shoulderR.current.rotation.x = damp(shoulderR.current.rotation.x, waving ? 0 : -0.35 * sit + armSwing, 10, dt)
    }
    if (elbowR.current) {
      const elbowZ = waving ? 0.72 + Math.sin(since * 14) * 0.3 : 0.35 * sit
      elbowR.current.rotation.z = damp(elbowR.current.rotation.z, elbowZ, waving ? 20 : 9, dt)
    }

    // --- head ---------------------------------------------------------------
    if (head.current) {
      const seated = sit > 0.5
      const lookY = seated ? -0.16 : pointer.x * 0.38 + (a.act === 'shelf' ? 0.3 : 0)
      const lookX = seated ? -0.28 : -pointer.y * 0.16
      head.current.rotation.y = damp(head.current.rotation.y, lookY, 7, dt)
      head.current.rotation.x = damp(head.current.rotation.x, lookX, 7, dt)
    }
  })

  return (
    <group
      ref={root}
      position={[GREET.x, 0, GREET.z]}
      rotation={[0, GREET.yaw, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onHover('About — say hi', e.nativeEvent.clientX, e.nativeEvent.clientY)
      }}
      onPointerOut={() => onHover(null, 0, 0)}
      onClick={(e) => {
        e.stopPropagation()
        if (pointerDrag.moved > 6) return
        onPick()
      }}
    >
      {/* legs: hip pivot, knee pivot, rounded shoe — so he can sit and walk */}
      {([
        [-0.115, hipL, kneeL],
        [0.115, hipR, kneeR],
      ] as const).map(([x, hip, knee]) => (
        <group key={x} ref={hip} position={[x, HIP_Y, 0]}>
          <Capsule r={0.095} len={0.28} color={JEANS} position={[0, -0.23, 0]} />
          <group ref={knee} position={[0, -0.46, 0]}>
            <Capsule r={0.082} len={0.26} color={JEANS} position={[0, -0.2, 0]} />
            <Capsule
              r={0.078}
              len={0.16}
              color={SHOE}
              position={[0, -0.41, 0.06]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[1.05, 1, 0.9]}
            />
          </group>
        </group>
      ))}

      {/* hips under the hoodie */}
      <mesh position={[0, 0.98, 0]} scale={[1, 0.62, 0.86]} castShadow>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color={JEANS} roughness={0.9} />
      </mesh>

      {/* torso: a rounded hoodie with a collar and a bunched hood */}
      <Capsule r={0.215} len={0.24} color={HOODIE} position={[0, 1.19, 0]} scale={[1.12, 1, 0.8]} />
      <Capsule r={0.09} len={0.13} color={HOODIE_LIGHT} position={[0, 1.4, 0.02]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.85]} />
      <mesh position={[0, 1.36, -0.15]} scale={[1, 0.72, 0.9]} castShadow>
        <sphereGeometry args={[0.19, 16, 12]} />
        <meshStandardMaterial color={HOODIE_LIGHT} roughness={0.9} />
      </mesh>
      {/* zip */}
      <mesh position={[0, 1.16, 0.172]}>
        <boxGeometry args={[0.016, 0.42, 0.012]} />
        <meshStandardMaterial color={ACCENT} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* kangaroo pocket */}
      <mesh position={[0, 1.02, 0.168]} rotation={[0.06, 0, 0]}>
        <boxGeometry args={[0.26, 0.11, 0.012]} />
        <meshStandardMaterial color={HOODIE_DARK} roughness={0.9} />
      </mesh>

      {/* arms: shoulder -> elbow -> hand */}
      {([
        [-0.28, shoulderL, elbowL],
        [0.28, shoulderR, elbowR],
      ] as const).map(([x, shoulder, elbow]) => (
        <group key={x} ref={shoulder} position={[x, 1.36, 0]}>
          <mesh position={[0, -0.01, 0]} castShadow>
            <sphereGeometry args={[0.092, 14, 12]} />
            <meshStandardMaterial color={HOODIE} roughness={0.86} />
          </mesh>
          <Capsule r={0.075} len={0.16} color={HOODIE} position={[0, -0.16, 0]} />
          <group ref={elbow} position={[0, -0.32, 0]}>
            <Capsule r={0.065} len={0.1} color={HOODIE} position={[0, -0.08, 0]} />
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.068, 0.068, 0.035, 12]} />
              <meshStandardMaterial color={HOODIE_LIGHT} roughness={0.84} />
            </mesh>
            <mesh position={[0, -0.245, 0]} castShadow>
              <sphereGeometry args={[0.06, 12, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.8} />
            </mesh>
          </group>
        </group>
      ))}

      {/* neck + head */}
      <Capsule r={0.075} len={0.08} color={SKIN} position={[0, 1.46, 0]} />
      <group ref={head} position={[0, 1.67, 0]} scale={0.93}>
        <mesh scale={[0.93, 1.03, 0.95]} castShadow>
          <sphereGeometry args={[0.245, 26, 20]} />
          <meshStandardMaterial color={SKIN} roughness={0.72} />
        </mesh>

        {/* hair: a rounded cap over a soft mass at the back, then fringe lobes on the hairline */}
        <mesh position={[0, 0.005, -0.006]} rotation={[-0.08, 0, 0]} castShadow>
          <sphereGeometry args={[0.261, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.34]} />
          <meshStandardMaterial color={HAIR} roughness={0.88} />
        </mesh>
        <mesh position={[0, 0, -0.004]} scale={[1.06, 1.01, 1]} castShadow>
          <sphereGeometry args={[0.252, 24, 18, Math.PI, Math.PI]} />
          <meshStandardMaterial color={HAIR} roughness={0.88} side={THREE.DoubleSide} />
        </mesh>
        <Ball r={0.062} color={HAIR} position={[-0.215, 0.055, 0.015]} scale={[0.32, 0.95, 0.95]} roughness={0.88} />
        <Ball r={0.062} color={HAIR} position={[0.215, 0.05, 0.01]} scale={[0.32, 0.95, 0.9]} roughness={0.88} />
        <Ball r={0.082} color={HAIR} position={[-0.09, 0.182, 0.19]} scale={[1.2, 0.5, 0.6]} roughness={0.88} />
        <Ball r={0.078} color={HAIR} position={[0.02, 0.198, 0.188]} scale={[1.15, 0.45, 0.58]} roughness={0.88} />
        <Ball r={0.07} color={HAIR} position={[0.135, 0.176, 0.172]} scale={[0.85, 0.5, 0.55]} roughness={0.88} />

        {/* ears */}
        {[-0.232, 0.232].map((x) => (
          <Ball key={x} r={0.072} color={SKIN} position={[x, 0.002, -0.015]} scale={[0.5, 0.95, 0.8]} roughness={0.75} />
        ))}

        {/* eyes behind the lenses */}
        {[-0.088, 0.088].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.026, 0.205]} scale={[0.8, 0.95, 0.5]}>
              <sphereGeometry args={[0.038, 14, 12]} />
              <meshStandardMaterial color="#f2f4f2" roughness={0.25} />
            </mesh>
            <mesh position={[x + Math.sign(x) * 0.004, 0.02, 0.226]}>
              <sphereGeometry args={[0.017, 12, 10]} />
              <meshStandardMaterial color="#20293a" roughness={0.35} />
            </mesh>
            <mesh position={[x + Math.sign(x) * 0.001, 0.028, 0.24]}>
              <sphereGeometry args={[0.0055, 8, 6]} />
              <meshStandardMaterial color="#e8f1f2" roughness={0.2} emissive="#8fb8c0" emissiveIntensity={0.3} />
            </mesh>
          </group>
        ))}

        {/* glasses: clean round rims, a bridge and temples that reach the ears */}
        {[-0.085, 0.085].map((x) => (
          <mesh key={x} position={[x, 0.026, 0.232]} rotation={[0.04, 0, 0]}>
            <torusGeometry args={[0.064, 0.0075, 8, 32]} />
            <meshStandardMaterial color={GLASS} roughness={0.35} metalness={0.35} />
          </mesh>
        ))}
        <mesh position={[0, 0.042, 0.242]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0065, 0.0065, 0.042, 8]} />
          <meshStandardMaterial color={GLASS} roughness={0.35} metalness={0.35} />
        </mesh>
        {[-0.148, 0.148].map((x) => (
          <mesh key={x} position={[x, 0.03, 0.14]} rotation={[Math.PI / 2, 0, Math.sign(x) * 0.14]}>
            <cylinderGeometry args={[0.006, 0.006, 0.2, 8]} />
            <meshStandardMaterial color={GLASS} roughness={0.35} metalness={0.35} />
          </mesh>
        ))}

        {/* brows, nose, smile */}
        {[-0.084, 0.084].map((x) => (
          <mesh key={x} position={[x, 0.104, 0.226]} rotation={[0.1, 0, Math.sign(x) * 0.12]}>
            <capsuleGeometry args={[0.009, 0.05, 4, 8]} />
            <meshStandardMaterial color={HAIR} roughness={0.85} />
          </mesh>
        ))}
        <mesh position={[0, -0.072, 0.239]} scale={[0.8, 1, 0.9]} castShadow>
          <sphereGeometry args={[0.03, 12, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.148, 0.214]} rotation={[0, 0, -2.513]}>
          <torusGeometry args={[0.048, 0.0055, 6, 20, Math.PI * 0.6]} />
          <meshStandardMaterial color="#7d4239" roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
})
