import { memo, useEffect, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { pointerDrag } from './data'

// dressed like the portrait on the wall: red jacket with black shoulders and white piping, black tee
const SKIN = '#d9a27a'
const HAIR = '#121318'
const JACKET = '#c2302a'
const JACKET_DARK = '#1b1d23'
const PIPING = '#ebe6dc'
const TEE = '#141519'
const STRAP = '#16171c'
const PANTS = '#262a33'
const SHOE = '#1d2027'
const SOLE = '#e8e4da'

type Vec3 = [number, number, number]

// deterministic, so the haircut is the same on every visit
const rand = (() => {
  let seed = 11
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647
})()

/** Tousled hair: tufts all round the crown, longer ones swept forward into a fringe. */
const TUFTS = [
  ...Array.from({ length: 16 }, (_, i) => {
    const yaw = (i / 16) * Math.PI * 2 + rand() * 0.25
    return { yaw, tilt: 0.7 + rand() * 0.35, lay: -0.95 - rand() * 0.3, twist: (rand() - 0.5) * 0.5, len: 0.095 + rand() * 0.04, w: 0.07 + rand() * 0.02 }
  }),
  // a few on the crown for volume, lying back
  ...Array.from({ length: 5 }, () => ({ yaw: rand() * Math.PI * 2, tilt: 0.3 + rand() * 0.2, lay: -1.1, twist: rand() - 0.5, len: 0.1, w: 0.08 })),
  ...[-0.45, -0.18, 0.08, 0.34].map((yaw) => ({ yaw, tilt: 0.84 + rand() * 0.05, lay: 1.0, twist: 0.45, len: 0.095 + rand() * 0.02, w: 0.072 })),
]
type Act = 'stand' | 'sit' | 'shelf'

/** A place the character can spend time in: where he stands, which way he faces, what he does. */
type Spot = { x: number; z: number; yaw: number; act: Act; hold: number }

/** Framing of the About view was built around this pose, so it is also his home base. */
const GREET: Spot = { x: 0.7, z: 2.05, yaw: 0.42, act: 'stand', hold: 0 }

// close enough to the desk that his hands rest on the keyboard
const SEAT: Spot = { x: 1.3, z: -3.7, yaw: Math.PI, act: 'sit', hold: 14 }
// beside the chair, before the point where he starts lowering onto it
const BESIDE_SEAT: Spot = { x: 0.48, z: -3.6, yaw: Math.PI, act: 'stand', hold: 0.3 }
// in front of the sideboard under the awards wall, well clear of its worktop
const SIDEBOARD: Spot = { x: -4.5, z: 2.3, yaw: -Math.PI / 2, act: 'stand', hold: 6 }
// the spot beside the chair (0.83 m out) is just inside this, so he already faces the desk when he gets there
const SIDESTEP = 0.85

/** A day in the room: stand by the rug, work at the desk, browse the shelf, tinker at the sideboard. */
const ROUTINE: Spot[] = [
  { x: 1.05, z: 1.75, yaw: 0.3, act: 'stand', hold: 5 },
  // into the chair from its side, never through it, and out the same way
  BESIDE_SEAT,
  SEAT,
  BESIDE_SEAT,
  { x: -4.15, z: -2.45, yaw: -Math.PI / 2, act: 'shelf', hold: 8 },
  SIDEBOARD,
]

const HIP_Y = 0.95
// shallow enough that he sits tall on the seat instead of sinking into the chair
const SEAT_DROP = 0.24

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
      <capsuleGeometry args={[r, len, 10, 32]} />
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
      <sphereGeometry args={[r, 32, 24]} />
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
  /** the sideboard close-up is open: keep out of its frame */
  away: boolean
  reduced: boolean
}

/**
 * Adriel, built from rounded primitives: he walks the room, sits down at the desk,
 * browses the shelf, turns his head toward the pointer and waves when greeted.
 */
export const Character = memo(function Character({ onPick, onHover, greetKey, focus, away, reduced }: CharacterProps) {
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
    if (away && ROUTINE[a.index] === SIDEBOARD) {
      a.index = (a.index + 1) % ROUTINE.length
      a.phase = 'walk'
      a.timer = 0
    }
    const target = focus || reduced ? GREET : ROUTINE[a.index]

    // --- walk / arrive ------------------------------------------------------
    const dx = target.x - a.x
    const dz = target.z - a.z
    const distance = Math.hypot(dx, dz)
    const moving = !reduced && distance > 0.05
    // next to the seat he faces the desk and shuffles sideways, lowering as he slides in
    const fromSeat = Math.hypot(a.x - SEAT.x, a.z - SEAT.z)
    const sidestep = moving && !focus && fromSeat < SIDESTEP

    if (moving) {
      const step = Math.min(distance, (focus ? 2 : sidestep ? 0.55 : 1.15) * real)
      a.x += (dx / distance) * step
      a.z += (dz / distance) * step
      a.step += real * (sidestep ? 4 : 7.2)
      a.walk = damp(a.walk, sidestep ? 0.3 : 1, 7, dt)
      a.yaw = turn(a.yaw, sidestep ? SEAT.yaw : Math.atan2(dx, dz), 9, dt)
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

    const sitting =
      a.act === 'sit' && !moving ? 1 : sidestep ? Math.min(1, Math.max(0, 1 - fromSeat / (SIDESTEP * 0.9))) : 0
    const sit = damp(a.sit, sitting, 7, dt)
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
    // seated, upper arms reach well forward and forearms tilt up a little, so the hands rest on the keys
    // (shoulder ~1.12 m seated, key tops ~1.09 m); fingers tap
    const tap = (phase: number) => Math.sin(t * 15 + phase) * 0.07 * sit
    if (shoulderL.current) {
      shoulderL.current.rotation.x = damp(shoulderL.current.rotation.x, -1.38 * sit - armSwing, 9, dt)
      shoulderL.current.rotation.z = damp(shoulderL.current.rotation.z, -0.16 + 0.3 * sit, 9, dt)
    }
    if (elbowL.current) {
      elbowL.current.rotation.z = damp(elbowL.current.rotation.z, 0, 9, dt)
      elbowL.current.rotation.x = damp(elbowL.current.rotation.x, (-0.6 + tap(0)) * sit, 14, dt)
    }

    const since = performance.now() / 1000 - waveAt.current
    const waving = since < 1.9
    if (shoulderR.current) {
      // +z lifts the right arm outward and up: the old -z value folded it across his chest
      const shoulderZ = waving ? 2.3 + Math.sin(since * 13) * 0.12 : 0.16 - 0.3 * sit
      shoulderR.current.rotation.z = damp(shoulderR.current.rotation.z, shoulderZ, waving ? 18 : 10, dt)
      shoulderR.current.rotation.x = damp(shoulderR.current.rotation.x, waving ? 0 : -1.38 * sit + armSwing, 10, dt)
    }
    if (elbowR.current) {
      const elbowZ = waving ? 0.72 + Math.sin(since * 14) * 0.3 : 0
      elbowR.current.rotation.z = damp(elbowR.current.rotation.z, elbowZ, waving ? 20 : 9, dt)
      elbowR.current.rotation.x = damp(elbowR.current.rotation.x, waving ? 0 : (-0.6 + tap(1.7)) * sit, 14, dt)
    }

    // --- head ---------------------------------------------------------------
    if (head.current) {
      const seated = sit > 0.5
      // at the desk he reads the screens: a small tilt, not a hunched neck
      const lookY = seated ? -0.12 : pointer.x * 0.38 + (a.act === 'shelf' ? 0.3 : 0)
      const lookX = seated ? -0.1 : -pointer.y * 0.16
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
      {/* legs: hip pivot, knee pivot, sneaker with a white sole — so he can sit and walk */}
      {([
        [-0.115, hipL, kneeL],
        [0.115, hipR, kneeR],
      ] as const).map(([x, hip, knee]) => (
        <group key={x} ref={hip} position={[x, HIP_Y, 0]}>
          <Capsule r={0.097} len={0.28} color={PANTS} position={[0, -0.23, 0]} />
          <group ref={knee} position={[0, -0.46, 0]}>
            <Capsule r={0.084} len={0.26} color={PANTS} position={[0, -0.2, 0]} />
            <Capsule r={0.08} len={0.16} color={SHOE} position={[0, -0.4, 0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[1.05, 1, 0.85]} />
            <Capsule r={0.082} len={0.17} color={SOLE} position={[0, -0.455, 0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[1.08, 1, 0.32]} />
          </group>
        </group>
      ))}

      {/* hips */}
      <mesh position={[0, 0.98, 0]} scale={[1, 0.62, 0.86]} castShadow>
        <sphereGeometry args={[0.2, 32, 24]} />
        <meshStandardMaterial color={PANTS} roughness={0.9} />
      </mesh>

      {/* jacket: red body; the shoulders, sleeves and collar are black */}
      <Capsule r={0.218} len={0.22} color={JACKET} position={[0, 1.17, 0]} scale={[1.12, 1, 0.8]} />
      {/* white piping running down from each shoulder */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.17, 1.24, 0.135]} rotation={[-0.3, side * 0.5, side * 0.25]}>
          <boxGeometry args={[0.01, 0.2, 0.008]} />
          <meshStandardMaterial color={PIPING} roughness={0.6} />
        </mesh>
      ))}
      {/* open front: the black tee between two zip edges */}
      <mesh position={[0, 1.24, 0.158]} rotation={[-0.1, 0, 0]} scale={[1, 1, 0.22]}>
        <capsuleGeometry args={[0.045, 0.16, 8, 16]} />
        <meshStandardMaterial color={TEE} roughness={0.95} />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 1.17, 0.174]} rotation={[-0.06, 0, 0]}>
          <boxGeometry args={[0.012, 0.36, 0.01]} />
          <meshStandardMaterial color={JACKET_DARK} roughness={0.5} />
        </mesh>
      ))}
      {/* hood bunched at the back of the neck: red shell, black lining */}
      <mesh position={[0, 1.38, -0.14]} scale={[1, 0.62, 0.85]} castShadow>
        <sphereGeometry args={[0.19, 32, 24]} />
        <meshStandardMaterial color={JACKET} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.42, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.05, 0.9, 1]}>
        <torusGeometry args={[0.1, 0.03, 12, 40]} />
        <meshStandardMaterial color={JACKET_DARK} roughness={0.85} />
      </mesh>
      {/* sling bag: a strap across the chest with a buckle, the pouch at his right hip */}
      <mesh position={[0.02, 1.16, 0.185]} rotation={[-0.05, 0, 0.72]}>
        <boxGeometry args={[0.05, 0.6, 0.014]} />
        <meshStandardMaterial color={STRAP} roughness={0.7} />
      </mesh>
      <mesh position={[-0.07, 1.25, 0.192]} rotation={[-0.05, 0, 0.72]}>
        <boxGeometry args={[0.064, 0.05, 0.016]} />
        <meshStandardMaterial color="#3a3d44" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0.22, 0.98, 0.09]} rotation={[0, -0.5, 0]} scale={[1, 0.75, 0.55]} castShadow>
        <capsuleGeometry args={[0.07, 0.08, 8, 16]} />
        <meshStandardMaterial color={STRAP} roughness={0.7} />
      </mesh>

      {/* arms: black shoulders, red forearms with a cuff, hands */}
      {([
        [-0.295, shoulderL, elbowL],
        [0.295, shoulderR, elbowR],
      ] as const).map(([x, shoulder, elbow]) => (
        <group key={x} ref={shoulder} position={[x, 1.36, 0]}>
          <mesh position={[0, -0.01, 0]} castShadow>
            <sphereGeometry args={[0.094, 32, 24]} />
            <meshStandardMaterial color={JACKET_DARK} roughness={0.85} />
          </mesh>
          <Capsule r={0.077} len={0.16} color={JACKET_DARK} position={[0, -0.16, 0]} />
          <group ref={elbow} position={[0, -0.32, 0]}>
            <Capsule r={0.068} len={0.1} color={JACKET} position={[0, -0.08, 0]} />
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.04, 32]} />
              <meshStandardMaterial color={JACKET_DARK} roughness={0.84} />
            </mesh>
            <mesh position={[0, -0.25, 0]} scale={[0.9, 1.1, 0.75]} castShadow>
              <sphereGeometry args={[0.058, 32, 24]} />
              <meshStandardMaterial color={SKIN} roughness={0.75} />
            </mesh>
          </group>
        </group>
      ))}

      {/* neck + head */}
      <Capsule r={0.072} len={0.08} color={SKIN} position={[0, 1.46, 0]} />
      <group ref={head} position={[0, 1.67, 0]} scale={0.93}>
        {/* skull, then a softer jaw and chin so the face is not a perfect ball */}
        <mesh scale={[0.92, 1.0, 0.95]} castShadow>
          <sphereGeometry args={[0.245, 48, 36]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.1, 0.04]} scale={[0.86, 0.72, 0.84]}>
          <sphereGeometry args={[0.2, 48, 36]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>

        {/* hair: a cap and a back mass, then tousled tufts all round and a fringe on the forehead */}
        <mesh position={[0, 0.02, -0.01]} rotation={[-0.12, 0, 0]} castShadow>
          <sphereGeometry args={[0.262, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.01, -0.02]} scale={[1.05, 1.0, 1]} castShadow>
          <sphereGeometry args={[0.252, 48, 36, Math.PI, Math.PI]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {TUFTS.map((tuft, i) => (
          <group key={i} rotation={[0, tuft.yaw, 0]}>
            <group rotation={[tuft.tilt, 0, 0]}>
              <mesh position={[0, 0.24, 0]} rotation={[tuft.lay, 0, tuft.twist]} scale={[tuft.w, tuft.len, tuft.w * 0.7]} castShadow>
                <sphereGeometry args={[1, 24, 16]} />
                <meshStandardMaterial color={HAIR} roughness={0.8} />
              </mesh>
            </group>
          </group>
        ))}
        {/* short sideburns in front of the ears */}
        {[-0.2, 0.2].map((x) => (
          <Ball key={x} r={0.05} color={HAIR} position={[x, 0.02, 0.02]} scale={[0.3, 1, 0.6]} roughness={0.8} />
        ))}

        {/* ears */}
        {[-0.226, 0.226].map((x) => (
          <Ball key={x} r={0.066} color={SKIN} position={[x, -0.02, -0.02]} scale={[0.4, 0.8, 0.66]} roughness={0.72} />
        ))}

        {/* eyes: almond whites, dark brown irises, a catch-light, and a lash line on top */}
        {[-0.082, 0.082].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.02, 0.205]} scale={[1, 0.72, 0.42]}>
              <sphereGeometry args={[0.041, 32, 24]} />
              <meshStandardMaterial color="#f4f1ec" roughness={0.3} />
            </mesh>
            <mesh position={[x + Math.sign(x) * 0.003, 0.018, 0.219]} scale={[1, 1, 0.6]}>
              <sphereGeometry args={[0.021, 24, 16]} />
              <meshStandardMaterial color="#2a1a12" roughness={0.3} />
            </mesh>
            <mesh position={[x - 0.004, 0.026, 0.229]}>
              <sphereGeometry args={[0.0048, 12, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[x, 0.047, 0.212]} rotation={[0.2, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.005, 0.058, 6, 12]} />
              <meshStandardMaterial color={HAIR} roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* thick, slightly arched brows */}
        {[-0.084, 0.084].map((x) => (
          <mesh key={x} position={[x, 0.112, 0.214]} rotation={[0.15, 0, Math.PI / 2 - Math.sign(x) * 0.12]} scale={[1, 1, 0.7]}>
            <capsuleGeometry args={[0.012, 0.06, 8, 16]} />
            <meshStandardMaterial color={HAIR} roughness={0.85} />
          </mesh>
        ))}

        {/* nose and a wide smile pressed onto the face */}
        <mesh position={[0, -0.04, 0.236]} scale={[0.75, 1.1, 0.8]} castShadow>
          <sphereGeometry args={[0.026, 24, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.112, 0.205]} rotation={[0.1, 0, -2.57]}>
          <torusGeometry args={[0.05, 0.007, 12, 32, Math.PI * 0.62]} />
          <meshStandardMaterial color="#7a3a33" roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
})
