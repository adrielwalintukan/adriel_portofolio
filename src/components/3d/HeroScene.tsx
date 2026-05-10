import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useDeviceDetect } from '@/hooks'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * The inner core of the crystal - extremely bright and glowing.
 */
function CrystalCore() {
  const coreRef = useRef<THREE.Mesh>(null)

  useFrame((_state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.5
      coreRef.current.rotation.y += delta * 0.8
    }
  })

  return (
    <mesh ref={coreRef}>
      <icosahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial 
        color="#ffffff" 
        emissive="#00f0ff" 
        emissiveIntensity={2} 
        wireframe
      />
    </mesh>
  )
}

/**
 * The outer shell of the crystal - translucent and refractive.
 */
function CrystalShell() {
  const shellRef = useRef<THREE.Mesh>(null)

  useFrame((_state, delta) => {
    if (shellRef.current) {
      shellRef.current.rotation.x -= delta * 0.2
      shellRef.current.rotation.y -= delta * 0.3
    }
  })

  return (
    <mesh ref={shellRef}>
      <octahedronGeometry args={[1.5, 0]} />
      <meshPhysicalMaterial 
        color="#b026ff"
        transmission={0.9}
        opacity={1}
        metalness={0.1}
        roughness={0.1}
        ior={1.5}
        thickness={0.5}
        transparent
      />
    </mesh>
  )
}

/**
 * Premium cinematic Hero 3D Visual.
 * Replaces the generic wireframe with a layered futuristic crystal core.
 * Optimized for performance: disabled rendering loop on touch devices.
 */
export function HeroScene() {
  const { isTouchDevice } = useDeviceDetect()

  if (isTouchDevice) return null

  return (
    <div className="h-full w-full opacity-90 transition-opacity duration-1000 mix-blend-screen">
      <Canvas 
        dpr={[1, 1.5]} 
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#b026ff" />
        <pointLight position={[-5, -5, -5]} intensity={3} color="#00f0ff" />
        
        {/* Float component adds a smooth ambient up/down hover effect automatically */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <group>
            <CrystalCore />
            <CrystalShell />
          </group>
        </Float>
      </Canvas>
    </div>
  )
}
