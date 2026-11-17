import { Suspense, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { StationId, ViewId } from './data'
import { CameraRig } from './CameraRig'
import { Character } from './Character'
import { Room } from './Room'

interface SceneProps {
  view: ViewId
  reduced: boolean
  shadows: boolean
  dpr: [number, number]
  greetKey: number
  onReady: () => void
  onPick: (id: StationId) => void
  onHover: (label: string | null, x: number, y: number) => void
  onGreet: () => void
}

/**
 * The 3D half of the studio. Everything in here is procedural: no model or texture downloads
 * besides the wall poster, so the whole room is one lazy chunk.
 */
export const StudioScene = memo(function StudioScene({
  view,
  reduced,
  shadows,
  dpr,
  greetKey,
  onReady,
  onPick,
  onHover,
  onGreet,
}: SceneProps) {
  return (
    <Canvas
      shadows={shadows}
      dpr={dpr}
      className="studio-canvas"
      camera={{ fov: 33, near: 0.1, far: 120, position: [16, 13, 19] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={onReady}
    >
      <color attach="background" args={['#070c16']} />

      <ambientLight intensity={0.55} color="#cddbe6" />
      <hemisphereLight args={['#9fc8d8', '#2a1c12', 0.5]} />
      <directionalLight
        position={[7, 12, 7]}
        intensity={1.4}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      {/* pendant over the desk, cool fill from the window, teal bounce from the monitors */}
      <pointLight position={[1.4, 3.7, -4.4]} intensity={26} distance={12} decay={2} color="#ffb877" />
      <pointLight position={[4.4, 2.4, -4.6]} intensity={9} distance={9} decay={2} color="#8ec4e0" />
      <pointLight position={[2.2, 2.0, -4.7]} intensity={4} distance={4} decay={2} color="#3fb0b7" />
      <pointLight position={[-3.2, 2.6, 3.4]} intensity={7} distance={10} decay={2} color="#7fb0c8" />
      {/* soft front fill: the character stands with his back to the key light, so his face needs it */}
      <pointLight position={[2.2, 2.4, 3.6]} intensity={5} distance={9} decay={2} color="#b6cbd8" />

      <Suspense fallback={null}>
        <Room onPick={onPick} onHover={onHover} />
      </Suspense>
      <Character
        greetKey={greetKey}
        onPick={() => {
          onGreet()
          onPick('about')
        }}
        onHover={onHover}
      />
      <CameraRig view={view} reduced={reduced} />
    </Canvas>
  )
})
