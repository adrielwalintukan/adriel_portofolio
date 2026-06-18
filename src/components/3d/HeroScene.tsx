import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useDeviceDetect } from '@/hooks'
import { Float, Sparkles } from '@react-three/drei'
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
 * Orbital rings that rotate around the main core to create a planetary/holographic feel.
 */
function OrbitalRings() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x -= delta * 0.1
      groupRef.current.rotation.y += delta * 0.15
      groupRef.current.rotation.z += delta * 0.05
    }
  })

  return (
    <group ref={groupRef}>
      {/* Outer Ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.2, 0.015, 16, 100]} />
        <meshBasicMaterial color="#b026ff" transparent opacity={0.3} />
      </mesh>
      {/* Inner Ring */}
      <mesh rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
        <torusGeometry args={[1.8, 0.01, 16, 100]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} />
      </mesh>
      {/* Accent Ring */}
      <mesh rotation={[0, Math.PI / 2, Math.PI / 4]}>
        <torusGeometry args={[2.5, 0.008, 16, 100]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

/**
 * Smaller, out-of-focus background crystals for cinematic depth.
 */
function BackgroundCrystals() {
  return (
    <group>
      <Float speed={1.5} rotationIntensity={1} floatIntensity={2} position={[-2.5, 1.5, -3]}>
        <mesh>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1} wireframe transparent opacity={0.3} />
        </mesh>
      </Float>
      
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5} position={[2, -1.5, -2]}>
        <mesh>
          <icosahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial color="#b026ff" emissive="#b026ff" emissiveIntensity={1} wireframe transparent opacity={0.3} />
        </mesh>
      </Float>

      <Float speed={1} rotationIntensity={0.5} floatIntensity={3} position={[1.5, 2.5, -4]}>
        <mesh>
          <tetrahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} wireframe transparent opacity={0.2} />
        </mesh>
      </Float>
    </group>
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
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#b026ff" />
        <pointLight position={[-5, -5, -5]} intensity={3} color="#00f0ff" />
        
        {/* Holographic Dust Particles */}
        <Sparkles 
          count={60} 
          scale={8} 
          size={1.5} 
          speed={0.3} 
          opacity={0.3} 
          color="#a855f7" 
        />
        <Sparkles 
          count={40} 
          scale={6} 
          size={2} 
          speed={0.4} 
          opacity={0.4} 
          color="#00f0ff" 
        />

        <BackgroundCrystals />

        {/* Float component adds a smooth ambient up/down hover effect automatically */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <group>
            <CrystalCore />
            <OrbitalRings />
          </group>
        </Float>
      </Canvas>
    </div>
  )
}
