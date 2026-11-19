import { memo, useEffect, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { ARM, CARRY_POSE, READ_POSE } from './armpose'
import { charPos, dogPet, pointerDrag } from './data'

// dressed like the portrait on the wall: red jacket with black shoulders and white piping, black tee
const SKIN = '#d9a27a'
// a little self-light keeps the face one warm tone under the lamps
const FACE_GLOW = 0.2

/** A sphere whose lower half is narrowed and stretched into a jaw and chin: one surface, one continuous shading. */
const makeHeadGeometry = () => {
  const r = 0.245
  const g = new THREE.SphereGeometry(r, 64, 48)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y >= 0) continue
    const t = Math.min(1, -y / r) ** 1.3
    pos.setX(i, pos.getX(i) * (1 - 0.16 * t))
    pos.setZ(i, pos.getZ(i) * (1 - 0.08 * t))
    pos.setY(i, y * (1 + 0.22 * t))
  }
  g.computeVertexNormals()
  return g
}
const HEAD_GEOMETRY = makeHeadGeometry()
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
type Act = 'stand' | 'sit' | 'shelf' | 'pet' | 'read'

/** A place the character can spend time in: where he stands, which way he faces, what he does. */
/** `book`: at this spot he takes a book from the shelf, or puts it back. */
type Spot = { x: number; z: number; yaw: number; act: Act; hold: number; book?: 'take' | 'put' }

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

// the shelf: he takes a book here, and puts it back here when he is done
const SHELF: Spot = { x: -4.15, z: -2.45, yaw: -Math.PI / 2, act: 'shelf', hold: 5, book: 'take' }
const SHELF_BACK: Spot = { ...SHELF, hold: 3, book: 'put' }
// a waypoint in front of the bean bag so he never cuts across its side; then he sinks into it to read
const BEAN_APPROACH: Spot = { x: -2.3, z: -3.2, yaw: 2.6, act: 'stand', hold: 0.2 }
const BEAN: Spot = { x: -2.72, z: -3.99, yaw: 0.6, act: 'read', hold: 28 }

/** A day in the room: stand by the rug, work at the desk, read on the bean bag, tinker at the sideboard. */
const ROUTINE: Spot[] = [
  { x: 1.05, z: 1.75, yaw: 0.3, act: 'stand', hold: 5 },
  // into the chair from its side, never through it, and out the same way
  BESIDE_SEAT,
  SEAT,
  BESIDE_SEAT,
  SHELF,
  BEAN_APPROACH,
  BEAN,
  BEAN_APPROACH,
  SHELF_BACK,
  SIDEBOARD,
]

const HIP_Y = 0.95
// crouched to pet the dog: thighs forward, shins back, hips 0.62 m lower; he stands this far in front of it
const CROUCH_DROP = 0.62
const PET_GAP = 1.05
// shallow enough that he sits tall on the seat instead of sinking into the chair
const SEAT_DROP = 0.24
// the bean bag is lower than the chair: he sinks in so his feet still reach the floor
const BEAN_DROP = 0.4

const HAND_A = new THREE.Vector3()
const HAND_B = new THREE.Vector3()

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
  const handL = useRef<THREE.Group>(null)
  const handR = useRef<THREE.Group>(null)
  const closedBook = useRef<THREE.Group>(null)
  const openBook = useRef<THREE.Group>(null)

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
    crouch: 0,
    holding: false,
    hold: 0,
    reach: 0,
    read: 0,
    drop: SEAT_DROP,
  })
  const petSpot = useRef<Spot | null>(null)

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
    // the dog asked for a pat: go and crouch in front of it, unless he is at (or getting into) the chair
    const routine = ROUTINE[a.index]
    if (focus || reduced) {
      petSpot.current = null
      dogPet.active = false
      a.holding = false
    // not with a book in his hands: he puts it back on the shelf first
    } else if (!petSpot.current && dogPet.want && !a.holding && a.sit < 0.05 && routine !== SEAT && routine !== BESIDE_SEAT) {
      petSpot.current = {
        x: dogPet.x + Math.sin(dogPet.yaw) * PET_GAP,
        z: dogPet.z + Math.cos(dogPet.yaw) * PET_GAP,
        yaw: dogPet.yaw + Math.PI,
        act: 'pet',
        hold: 5,
      }
      a.phase = 'walk'
    }
    const target = focus || reduced ? GREET : (petSpot.current ?? routine)

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
        // at the shelf: reach up, and a moment later the book is in his hands (or back on the shelf)
        if (target.book === 'take' && a.timer > 1.6) a.holding = true
        if (target.book === 'put' && a.timer > 1.6) a.holding = false
        if (target === petSpot.current) dogPet.active = true
        if (a.timer > target.hold) {
          if (target === petSpot.current) {
            // done petting: back to wherever the routine was heading
            petSpot.current = null
            dogPet.want = false
            dogPet.active = false
          } else a.index = (a.index + 1) % ROUTINE.length
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
      (a.act === 'sit' || a.act === 'read') && !moving ? 1 : sidestep ? Math.min(1, Math.max(0, 1 - fromSeat / (SIDESTEP * 0.9))) : 0
    const sit = damp(a.sit, sitting, 7, dt)
    a.sit = sit
    const crouch = damp(a.crouch, a.act === 'pet' && !moving ? 1 : 0, 5, dt)
    a.crouch = crouch
    a.drop = damp(a.drop, a.act === 'read' ? BEAN_DROP : SEAT_DROP, 8, dt)
    const hold = damp(a.hold, a.holding ? 1 : 0, 6, dt)
    a.hold = hold
    const reaching = !moving && target.book !== undefined && a.timer < 1.6
    const reach = damp(a.reach, reaching ? 1 : 0, 8, dt)
    a.reach = reach
    // rb: 0 while he carries the closed book, 1 once he is settled in to read it open with both hands
    const rb = damp(a.read, a.act === 'read' && sit > 0.5 ? 1 : 0, 6, dt)
    a.read = rb
    const wl = hold * rb

    // the dog reads this to trail him; busy = settled somewhere (seat, shelf, sideboard)
    charPos.x = a.x
    charPos.z = a.z
    charPos.yaw = a.yaw
    charPos.busy = !moving && (a.act !== 'stand' || target === SIDEBOARD)
    charPos.holding = a.holding

    if (root.current) {
      const bob = Math.abs(Math.sin(a.step)) * 0.03 * a.walk + Math.sin(t * 1.5) * 0.008 * (1 - a.walk)
      root.current.position.set(a.x, -a.drop * sit - CROUCH_DROP * crouch + bob, a.z)
      root.current.rotation.y = a.yaw
    }

    // --- legs ---------------------------------------------------------------
    const swing = Math.sin(a.step) * 0.58 * a.walk
    const liftL = Math.max(0, -Math.sin(a.step)) * 0.85 * a.walk
    const liftR = Math.max(0, Math.sin(a.step)) * 0.85 * a.walk
    if (hipL.current) hipL.current.rotation.x = -1.5 * sit - 1.6 * crouch + swing
    if (hipR.current) hipR.current.rotation.x = -1.5 * sit - 1.6 * crouch - swing
    if (kneeL.current) kneeL.current.rotation.x = 1.55 * sit + 2.4 * crouch + liftL
    if (kneeR.current) kneeR.current.rotation.x = 1.55 * sit + 2.4 * crouch + liftR

    // --- arms ---------------------------------------------------------------
    const armSwing = Math.sin(a.step) * 0.5 * a.walk
    // seated, upper arms reach well forward and forearms tilt up a little, so the hands rest on the keys
    // (shoulder ~1.12 m seated, key tops ~1.09 m); fingers tap
    const tap = (phase: number) => Math.sin(t * 15 + phase) * 0.07 * sit
    if (shoulderL.current) {
      // crouched, the left hand rests forward on his knee
      shoulderL.current.rotation.x = damp(shoulderL.current.rotation.x, (-1.38 * sit - 0.7 * crouch - armSwing) * (1 - wl) + READ_POSE.L.sx * wl, 9, dt)
      shoulderL.current.rotation.z = damp(shoulderL.current.rotation.z, (-0.16 + 0.3 * sit) * (1 - wl) + READ_POSE.L.sz * wl, 9, dt)
    }
    if (elbowL.current) {
      elbowL.current.rotation.z = damp(elbowL.current.rotation.z, 0, 9, dt)
      elbowL.current.rotation.x = damp(elbowL.current.rotation.x, (-0.6 + tap(0)) * sit * (1 - wl) + READ_POSE.L.ex * wl, 14, dt)
    }

    const since = performance.now() / 1000 - waveAt.current
    const waving = since < 1.9
    if (shoulderR.current) {
      // +z lifts the right arm outward and up: the old -z value folded it across his chest
      const shoulderZ = waving ? 2.3 + Math.sin(since * 13) * 0.12 : (0.16 - 0.3 * sit) * (1 - hold) + (CARRY_POSE.sz * (1 - rb) + READ_POSE.R.sz * rb) * hold + 0.5 * reach
      shoulderR.current.rotation.z = damp(shoulderR.current.rotation.z, shoulderZ, waving ? 18 : 10, dt)
      // petting: the right arm reaches down to the dog's head and pats it
      const pat = (-1.3 + Math.sin(t * 7) * 0.12) * crouch
      shoulderR.current.rotation.x = damp(shoulderR.current.rotation.x, waving ? 0 : (-1.38 * sit + pat + armSwing) * (1 - hold) + (CARRY_POSE.sx * (1 - rb) + READ_POSE.R.sx * rb) * hold - 1.7 * reach, 10, dt)
    }
    if (elbowR.current) {
      const elbowZ = waving ? 0.72 + Math.sin(since * 14) * 0.3 : 0
      elbowR.current.rotation.z = damp(elbowR.current.rotation.z, elbowZ, waving ? 20 : 9, dt)
      elbowR.current.rotation.x = damp(elbowR.current.rotation.x, waving ? 0 : (-0.6 + tap(1.7)) * sit * (1 - hold) + (CARRY_POSE.ex * (1 - rb) + READ_POSE.R.ex * rb) * hold, 14, dt)
    }

    // the book lives in his hands: carried in the right one, held between both when he reads
    const book = rb > 0.5 ? openBook.current : closedBook.current
    if (closedBook.current) closedBook.current.visible = hold > 0.15 && rb <= 0.5
    if (openBook.current) openBook.current.visible = hold > 0.15 && rb > 0.5
    if (book && root.current && handR.current && handL.current) {
      root.current.updateWorldMatrix(true, false)
      handR.current.updateWorldMatrix(true, false)
      handR.current.getWorldPosition(HAND_A)
      if (rb > 0.5) {
        handL.current.updateWorldMatrix(true, false)
        handL.current.getWorldPosition(HAND_B)
        HAND_A.lerp(HAND_B, 0.5)
      }
      root.current.worldToLocal(HAND_A)
      book.position.copy(HAND_A)
      // closed: tucked against the palm; open: tipped back toward his face
      book.position.z += rb > 0.5 ? 0.02 : 0.03
      book.position.x += rb > 0.5 ? 0 : -0.045
    }

    // --- head ---------------------------------------------------------------
    if (head.current) {
      const seated = sit > 0.5
      // at the desk he reads the screens: a small tilt, not a hunched neck
      const reading = seated && hold > 0.5 && a.act === 'read'
      const lookY = reading ? 0 : seated ? -0.12 : pointer.x * 0.38 + (a.act === 'shelf' ? 0.3 : 0)
      const lookX = reading ? 0.42 : seated ? -0.1 : crouch > 0.5 ? 0.4 : -pointer.y * 0.16
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

      {/* the book from the shelf: closed against his chest while he carries it, open in both hands while he reads, turned half way round and tipped up so the pages face his face and not the room */}
      <group ref={closedBook} position={[0, 1.12, 0.3]} rotation={[-0.35, 0, 0]} visible={false}>
        <mesh position={[0, 0, 0]}><boxGeometry args={[0.2, 0.27, 0.04]} /><meshStandardMaterial color="#8a3b34" roughness={0.8} /></mesh>
        <mesh position={[0.012, 0, 0]}><boxGeometry args={[0.18, 0.25, 0.034]} /><meshStandardMaterial color="#efe8d6" roughness={0.8} /></mesh>
      </group>
      <group ref={openBook} position={[0, 1.0, 0.3]} rotation={[0.55, Math.PI, 0]} visible={false}>
        <mesh position={[0, 0, -0.012]}><boxGeometry args={[0.38, 0.27, 0.016]} /><meshStandardMaterial color="#8a3b34" roughness={0.8} /></mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.088, 0, 0.004]} rotation={[0, side * 0.12, 0]}>
            <boxGeometry args={[0.17, 0.25, 0.012]} />
            <meshStandardMaterial color="#efe8d6" roughness={0.9} />
          </mesh>
        ))}
      </group>

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
        [-ARM.x, shoulderL, elbowL, handL],
        [ARM.x, shoulderR, elbowR, handR],
      ] as const).map(([x, shoulder, elbow, hand]) => (
        <group key={x} ref={shoulder} position={[x, ARM.y, 0]}>
          <mesh position={[0, -0.01, 0]} castShadow>
            <sphereGeometry args={[0.094, 32, 24]} />
            <meshStandardMaterial color={JACKET_DARK} roughness={0.85} />
          </mesh>
          <Capsule r={0.077} len={0.16} color={JACKET_DARK} position={[0, -0.16, 0]} />
          <group ref={elbow} position={[0, -ARM.upper, 0]}>
            {/* where the book is held */}
            <group ref={hand} position={[0, -ARM.hand, 0]} />
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
        {/* one continuous head: a sphere whose lower half narrows into a jaw and chin, so there is no seam or tone change */}
        <mesh geometry={HEAD_GEOMETRY} scale={[0.92, 1.0, 0.95]} castShadow>
          <meshStandardMaterial color={SKIN} roughness={0.7} emissive={SKIN} emissiveIntensity={FACE_GLOW} />
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
          <meshStandardMaterial color={SKIN} roughness={0.7} emissive={SKIN} emissiveIntensity={FACE_GLOW} />
        </mesh>
        <mesh position={[0, -0.112, 0.205]} rotation={[0.1, 0, -2.57]}>
          <torusGeometry args={[0.05, 0.007, 12, 32, Math.PI * 0.62]} />
          <meshStandardMaterial color="#7a3a33" roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
})
