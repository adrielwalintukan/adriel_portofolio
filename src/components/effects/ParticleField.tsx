import { useState, useEffect } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

/**
 * Ambient particle background effect.
 * Renders floating dots with subtle connections for a futuristic atmosphere.
 */
export function ParticleField() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <Particles
      id="particle-field"
      options={{
        fullScreen: false,
        fpsLimit: 60,
        particles: {
          number: { value: 50, density: { enable: true } },
          color: { value: '#6c5ce7' },
          opacity: {
            value: { min: 0.1, max: 0.3 },
            animation: { enable: true, speed: 0.5, sync: false },
          },
          size: {
            value: { min: 1, max: 2 },
          },
          move: {
            enable: true,
            speed: 0.5,
            direction: 'none',
            random: true,
            straight: false,
            outModes: 'out',
          },
          links: {
            enable: true,
            distance: 120,
            color: '#6c5ce7',
            opacity: 0.08,
            width: 1,
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'grab' },
          },
          modes: {
            grab: { distance: 140, links: { opacity: 0.2 } },
          },
        },
        detectRetina: true,
      }}
      className="absolute inset-0 -z-10"
    />
  )
}
