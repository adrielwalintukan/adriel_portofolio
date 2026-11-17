import { memo, useEffect, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { pointerDrag } from './data'

const SKIN = '#d3a179'
const HAIR = '#171a22'
const HOODIE = '#1c2a3a'
const HOODIE_LIGHT = '#27394c'
const JEANS = '#232c3c'
const SHOE = '#11151d'
const GLASS = '#0e1218'

interface CharacterProps {
  onPick: () => void
  onHover: (label: string | null, x: number, y: number) => void
  /** bumped by the page when the character says hi, so the arm waves once per click */
  greetKey: number
}

/**
 * Low-poly Adriel. Everything is primitives, so he sits in the room's light and can turn his head
 * toward the pointer and wave. Swap this file for a GLB model later without touching the scene.
 */
export const Character = memo(function Character({ onPick, onHover, greetKey }: CharacterProps) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const arm = useRef<THREE.Group>(null)
  const waveAt = useRef(-10)

  useEffect(() => {
    if (greetKey > 0) waveAt.current = performance.now() / 1000
  }, [greetKey])

  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime
    if (root.current) root.current.position.y = Math.sin(t * 1.4) * 0.015
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, pointer.x * 0.45, 0.08)
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -pointer.y * 0.22, 0.08)
    }
    if (arm.current) {
      const since = performance.now() / 1000 - waveAt.current
      const target = since < 1.8 ? -2.25 + Math.sin(since * 15) * 0.32 : 0
      arm.current.rotation.z = THREE.MathUtils.lerp(arm.current.rotation.z, target, since < 1.8 ? 0.22 : 0.08)
    }
  })

  return (
    <group
      ref={root}
      position={[0.7, 0, 2.05]}
      rotation={[0, 0.42, 0]}
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
      {/* legs + shoes */}
      {[-0.16, 0.16].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.4, 0]} castShadow>
            <boxGeometry args={[0.23, 0.66, 0.26]} />
            <meshStandardMaterial color={JEANS} roughness={0.9} />
          </mesh>
          <mesh position={[x, 0.07, 0.06]} castShadow>
            <boxGeometry args={[0.27, 0.14, 0.4]} />
            <meshStandardMaterial color={SHOE} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* torso hoodie */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[0.68, 0.72, 0.42]} />
        <meshStandardMaterial color={HOODIE} roughness={0.85} />
      </mesh>
      {/* hood bunched behind the neck */}
      <mesh position={[0, 1.34, -0.16]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.2, 0.24]} />
        <meshStandardMaterial color={HOODIE_LIGHT} roughness={0.9} />
      </mesh>
      {/* zip line */}
      <mesh position={[0, 1.02, 0.215]}>
        <boxGeometry args={[0.03, 0.66, 0.02]} />
        <meshStandardMaterial color="#3fb0b7" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* arms: left hangs, right waves */}
      <group position={[-0.41, 1.31, 0]} rotation={[0, 0, 0.12]}>
        <mesh position={[0, -0.27, 0]} castShadow>
          <boxGeometry args={[0.19, 0.56, 0.21]} />
          <meshStandardMaterial color={HOODIE} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color={SKIN} roughness={0.8} />
        </mesh>
      </group>
      <group ref={arm} position={[0.41, 1.31, 0]} rotation={[0, 0, -0.12]}>
        <mesh position={[0, -0.27, 0]} castShadow>
          <boxGeometry args={[0.19, 0.56, 0.21]} />
          <meshStandardMaterial color={HOODIE} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color={SKIN} roughness={0.8} />
        </mesh>
      </group>

      {/* neck + head */}
      <mesh position={[0, 1.44, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.12, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.85} />
      </mesh>
      <group ref={head} position={[0, 1.62, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.27, 16, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.75} />
        </mesh>
        {/* hair: a soft cap, a heavier back mass and three swept wedges for the fringe */}
        <mesh position={[0, 0.06, -0.015]} rotation={[-0.08, 0, 0]} castShadow>
          <sphereGeometry args={[0.282, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.03, -0.19]} castShadow>
          <boxGeometry args={[0.42, 0.3, 0.14]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>
        <mesh position={[-0.06, 0.215, 0.14]} rotation={[0.25, 0.15, 0.28]} castShadow>
          <boxGeometry args={[0.18, 0.08, 0.2]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>
        <mesh position={[0.115, 0.23, 0.12]} rotation={[0.2, -0.1, -0.18]} castShadow>
          <boxGeometry args={[0.16, 0.08, 0.2]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>
        <mesh position={[-0.155, 0.25, 0.09]} rotation={[0.2, 0.1, 0.42]} castShadow>
          <boxGeometry args={[0.13, 0.07, 0.18]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>
        <mesh position={[0.07, 0.29, 0.1]} rotation={[0.28, 0, -0.34]} castShadow>
          <boxGeometry args={[0.12, 0.16, 0.14]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>
        <mesh position={[-0.215, 0.09, 0.03]} rotation={[0.1, 0, 0.3]} castShadow>
          <boxGeometry args={[0.1, 0.24, 0.22]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>
        <mesh position={[0.215, 0.08, 0.01]} rotation={[0, 0, -0.26]} castShadow>
          <boxGeometry args={[0.09, 0.22, 0.2]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>

        {/* ears */}
        {[-0.265, 0.265].map((x) => (
          <mesh key={x} position={[x, 0.01, -0.01]} scale={[0.45, 0.8, 0.7]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={SKIN} roughness={0.85} />
          </mesh>
        ))}

        {/* eyebrows */}
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.105, 0.238]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}>
            <boxGeometry args={[0.1, 0.022, 0.02]} />
            <meshStandardMaterial color={HAIR} roughness={0.8} />
          </mesh>
        ))}

        {/* glasses + eyes */}
        {[-0.1, 0.1].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.015, 0.245]}>
              <torusGeometry args={[0.062, 0.009, 6, 16]} />
              <meshStandardMaterial color={GLASS} roughness={0.4} metalness={0.3} />
            </mesh>
            <mesh position={[x, 0.015, 0.252]}>
              <sphereGeometry args={[0.021, 8, 8]} />
              <meshStandardMaterial color="#dbe6e9" roughness={0.3} />
            </mesh>
            <mesh position={[x + Math.sign(x) * 0.004, 0.012, 0.266]}>
              <sphereGeometry args={[0.011, 8, 8]} />
              <meshStandardMaterial color="#1b2130" roughness={0.4} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.02, 0.25]}>
          <boxGeometry args={[0.08, 0.014, 0.014]} />
          <meshStandardMaterial color={GLASS} />
        </mesh>
        {/* mouth */}
        <mesh position={[0, -0.12, 0.255]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.02, 0.02]} />
          <meshStandardMaterial color="#8a4a42" />
        </mesh>
      </group>
    </group>
  )
})
