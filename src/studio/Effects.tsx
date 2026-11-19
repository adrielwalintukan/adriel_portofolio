import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/**
 * HD pipeline: ambient occlusion in the corners, glow on lamps and screens, a tougher and less colourful grade,
 * filmic tone mapping, a light vignette and crisp edges. Loaded only in HD mode.
 */
export default function Effects({ ao }: { ao: boolean }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    // the composer tone-maps once at the end, so the renderer itself must not
    /* eslint-disable react-hooks/immutability */
    gl.toneMapping = THREE.NoToneMapping
    return () => {
      gl.toneMapping = THREE.ACESFilmicToneMapping
    }
    /* eslint-enable react-hooks/immutability */
  }, [gl])
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <>
        {ao && <N8AO aoRadius={0.9} distanceFalloff={0.6} intensity={2} quality="performance" halfRes color="#1a1210" />}
      </>
      <Bloom mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={0.2} intensity={0.6} radius={0.7} />
      <HueSaturation saturation={-0.15} />
      <BrightnessContrast contrast={0.12} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.4} />
      <SMAA />
    </EffectComposer>
  )
}
