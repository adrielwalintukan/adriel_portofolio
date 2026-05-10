import { useState, useEffect } from 'react'

interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  prefersReducedMotion: boolean
  devicePixelRatio: number
}

/**
 * Detect device type, touch capability, and motion preferences.
 * Used globally to gate expensive effects (particles, 3D, heavy blur).
 */
export function useDeviceDetect(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    prefersReducedMotion: false,
    devicePixelRatio: 1,
  }))

  useEffect(() => {
    function detect() {
      const w = window.innerWidth
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches

      setDevice({
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1024,
        isDesktop: w >= 1024,
        isTouchDevice,
        prefersReducedMotion,
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      })
    }

    detect()
    window.addEventListener('resize', detect, { passive: true })
    return () => window.removeEventListener('resize', detect)
  }, [])

  return device
}
