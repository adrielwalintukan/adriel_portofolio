import { Suspense, lazy, memo, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { fxLevel, type StationId, type TvMode, type ViewId } from './data'
import type { Note } from '@/lib/guestbook'
import { CameraRig } from './CameraRig'
import { LIGHT, usePhase } from './daylight'
import { newMonitor, sample, type Monitor, type Quality } from './quality'
import { Character } from './Character'
import { Room } from './Room'

interface SceneProps {
  view: ViewId
  reduced: boolean
  shadowSize: number
  quality: Quality
  onQuality: (q: Quality) => void
  /** false once the visitor picked a mode themselves */
  autoQuality: boolean
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
  onLook: (view: 'terminal' | 'sideboard' | 'billiards') => void
  onCert: (id: string) => void
  guestNotes: Note[]
  onSign: () => void
}

// the gallery bar's soft strip light needs its look-up tables loaded once
RectAreaLightUniformsLib.init()

/** Room fill light; the terminal's `sudo hire adriel` pulses it teal and `matrix` tints it green. */
function Ambient({ intensity }: { intensity: number }) {
  const light = useRef<THREE.AmbientLight>(null)
  const colors = useMemo(
    () => ({ base: new THREE.Color('#cddbe6'), hire: new THREE.Color('#3fb0b7'), matrix: new THREE.Color('#1f8f4f') }),
    []
  )
  useFrame(({ clock }) => {
    const l = light.current
    if (!l) return
    const hire = fxLevel('hire') * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 12))
    const matrix = fxLevel('matrix')
    l.color.copy(colors.base).lerp(colors.hire, hire).lerp(colors.matrix, matrix * 0.8)
    l.intensity = intensity + hire * 1.2 + matrix * 0.3
  })
  return <ambientLight ref={light} intensity={intensity} color="#cddbe6" />
}

const Effects = lazy(() => import('./Effects'))

/** Averages the frame rate over 2 s windows and lets the quality policy step down when it is poor. */
function QualityMonitor({ quality, auto, onQuality }: { quality: Quality; auto: boolean; onQuality: (q: Quality) => void }) {
  // the start time is taken on the first frame, not during render
  const state = useRef<{ monitor: Monitor; frames: number; since: number } | null>(null)
  useFrame((_, delta) => {
    state.current ??= { monitor: newMonitor(performance.now()), frames: 0, since: performance.now() }
    const s = state.current
    // a long hitch (tab in the background, a shader compile) says nothing about steady-state speed
    if (delta > 0.25) {
      s.frames = 0
      s.since = performance.now()
      return
    }
    s.frames += 1
    const now = performance.now()
    if (now - s.since < 2000) return
    const fps = (s.frames * 1000) / (now - s.since)
    s.frames = 0
    s.since = now
    const out = sample(s.monitor, now, fps, quality, auto)
    s.monitor = out.monitor
    if (out.quality !== quality) onQuality(out.quality)
  })
  return null
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
  shadowSize,
  quality,
  onQuality,
  autoQuality,
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
  onLook,
  onCert,
  guestNotes,
  onSign,
}: SceneProps) {
  const light = LIGHT[usePhase()]
  return (
    <Canvas
      shadows
      dpr={quality.dpr}
      className="studio-canvas"
      camera={{ fov: 33, near: 0.1, far: 120, position: [16, 13, 19] }}
      // antialias is fixed when the context is created, so it stays on: Fast mode needs it, and HD's SMAA runs on top
      gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
      onCreated={onReady}
    >
      <QualityMonitor quality={quality} auto={autoQuality} onQuality={onQuality} />
      <color attach="background" args={[light.bg]} />
      <Reflections />

      <Ambient intensity={light.ambient} />
      <hemisphereLight args={['#b8c0c8', '#2a1c12', light.hemi]} />
      <directionalLight
        position={[7, 12, 7]}
        intensity={light.sun}
        color="#ffc58a"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />
      {/* the lamps: pendant over the desk (key), then the window; the floor lamp and TV glow are below */}
      <pointLight
        position={[1.4, 3.7, -4.4]}
        intensity={26}
        distance={12}
        decay={2}
        color="#ffb877"
      />
      {/* what comes in through the window: moon by night, sun by day */}
      <pointLight position={[4.0, 3.0, -5.3]} intensity={light.window.intensity} distance={9} decay={2} color={light.window.color} />
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
          onLook={onLook}
          onCert={onCert}
          guestNotes={guestNotes}
          onSign={onSign}
          // phones get the small shadow map, so they get fewer motes too
          particles={reduced ? 0 : shadowSize > 1024 ? 60 : 20}
          reduced={reduced}
          billiardsActive={view === 'billiards'}
        />
      </Suspense>
      <Character
        greetKey={greetKey}
        focus={view === 'about'}
        away={view === 'sideboard'}
        reduced={reduced}
        onPick={() => {
          onGreet()
          onPick('about')
        }}
        onHover={onHover}
      />
      {quality.hd && (
        <Suspense fallback={null}>
          {/* remounted when the pixel ratio changes, so every render target matches the canvas */}
          <Effects key={quality.dpr} ao={quality.ao} />
        </Suspense>
      )}
      <CameraRig
        view={view}
        reduced={reduced}
        locked={view === 'tv' || view === 'projects' || view === 'billiards'}
      />
    </Canvas>
  )
})
