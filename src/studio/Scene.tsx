import { Suspense, memo, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { StationId, TvMode, ViewId } from './data'
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
  onPoster: () => void
  onTv: () => void
  onTvPick: (index: number) => void
  tvMode: TvMode
  tvSel: number
  deskSel: number
  onDeskOpen: (index: number) => void
  onLook: (view: 'terminal' | 'sideboard' | 'billiards') => void
}

/** Soft studio reflections on every material, generated on the GPU: no HDR download. */
function Reflections() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    /* eslint-disable react-hooks/immutability */
    scene.environment = env
    scene.environmentIntensity = 0.3
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
    /* eslint-enable react-hooks/immutability */
  }, [gl, scene])
  return null
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
  onPoster,
  onTv,
  onTvPick,
  tvMode,
  tvSel,
  deskSel,
  onDeskOpen,
  onLook,
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
      <Reflections />

      <ambientLight intensity={0.55} color="#cddbe6" />
      <hemisphereLight args={['#9fc8d8', '#2a1c12', 0.5]} />
      <directionalLight
        position={[7, 12, 7]}
        intensity={1.4}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      {/* pendant over the desk, cool fill from the window, teal bounce from the monitors */}
      <pointLight
        position={[1.4, 3.7, -4.4]}
        intensity={26}
        distance={12}
        decay={2}
        color="#ffb877"
      />
      <pointLight
        position={[4.4, 2.4, -4.6]}
        intensity={9}
        distance={9}
        decay={2}
        color="#8ec4e0"
      />
      <pointLight
        position={[2.2, 2.0, -4.7]}
        intensity={4}
        distance={4}
        decay={2}
        color="#3fb0b7"
      />
      <pointLight
        position={[-3.2, 2.6, 2.8]}
        intensity={7}
        distance={10}
        decay={2}
        color="#7fb0c8"
      />
      {/* soft front fill: the character stands with his back to the key light, so his face needs it */}
      <pointLight position={[2.2, 2.4, 3.0]} intensity={5} distance={9} decay={2} color="#b6cbd8" />
      {/* gallery bar over the certificates, so that wall is as warm as the desk */}
      <pointLight
        position={[-4.6, 3.1, 2.4]}
        intensity={16}
        distance={9}
        decay={2}
        color="#ffcf9a"
      />
      {/* lounge: the floor lamp and the glow of a paused game */}
      <pointLight
        position={[3.21, 1.38, 2.11]}
        intensity={3}
        distance={4.5}
        decay={2}
        color="#5fb2c8"
      />

      <Suspense fallback={null}>
        <Room
          onPick={onPick}
          onHover={onHover}
          onPoster={onPoster}
          onTv={onTv}
          onTvPick={onTvPick}
          tvActive={view === 'tv'}
          tvMode={tvMode}
          tvSel={tvSel}
          deskActive={view === 'projects'}
          deskSel={deskSel}
          onDeskOpen={onDeskOpen}
          onLook={onLook}
          billiardsActive={view === 'billiards'}
        />
      </Suspense>
      <Character
        greetKey={greetKey}
        focus={view === 'about'}
        reduced={reduced}
        onPick={() => {
          onGreet()
          onPick('about')
        }}
        onHover={onHover}
      />
      <CameraRig
        view={view}
        reduced={reduced}
        locked={view === 'tv' || view === 'projects' || view === 'billiards'}
      />
    </Canvas>
  )
})
