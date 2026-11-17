import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { POSES, PORTRAIT_POSES, pointerDrag, type ViewId } from './data'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const ease = (dt: number) => 1 - Math.exp(-4.5 * Math.min(dt, 0.1))

/**
 * Camera that glides between station poses and can be dragged to look around the room.
 * Orbit is a spherical offset around the station target, so dragging never leaves the room.
 * The maths is plain numbers on purpose: nothing allocated per frame.
 */
export function CameraRig({ view, reduced }: { view: ViewId; reduced: boolean }) {
  const { camera, gl } = useThree()
  const orbit = useRef({ yaw: 0, pitch: 0, zoom: 1 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef(0)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const look = useRef({ x: POSES.room.target[0], y: POSES.room.target[1], z: POSES.room.target[2] })

  // a new station starts from a clean view, not from wherever the last drag left the camera
  useEffect(() => {
    orbit.current = { yaw: 0, pitch: 0, zoom: 1 }
  }, [view])

  useEffect(() => {
    const el = gl.domElement

    const down = (e: PointerEvent) => {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      dragging.current = true
      pointerDrag.moved = 0
      last.current = { x: e.clientX, y: e.clientY }
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const [a, b] = [...pointers.current.values()]
      if (a && b) {
        const distance = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch.current) orbit.current.zoom = clamp(orbit.current.zoom * (pinch.current / distance), 0.55, 1.6)
        pinch.current = distance
        return
      }
      if (!dragging.current) return
      const dx = e.clientX - last.current.x
      const dy = e.clientY - last.current.y
      last.current = { x: e.clientX, y: e.clientY }
      pointerDrag.moved += Math.abs(dx) + Math.abs(dy)
      orbit.current.yaw = clamp(orbit.current.yaw - dx * 0.005, -1.1, 1.1)
      orbit.current.pitch = clamp(orbit.current.pitch - dy * 0.004, -0.42, 0.42)
    }
    const up = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId)
      if (pointers.current.size < 2) pinch.current = 0
      if (pointers.current.size === 0) dragging.current = false
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      orbit.current.zoom = clamp(orbit.current.zoom * (1 + e.deltaY * 0.0009), 0.55, 1.6)
    }

    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])

  // r3f's camera model is imperative: mutating the camera here is the whole point of the rig
  /* eslint-disable react-hooks/immutability */
  useFrame((_, dt) => {
    const perspective = camera as THREE.PerspectiveCamera
    const portrait = perspective.aspect < 1
    const pose = (portrait ? PORTRAIT_POSES : POSES)[view]
    // a phone gets a wider lens instead of a longer one, or the room would be a keyhole
    const fov = portrait ? 46 : 33
    if (Math.abs(perspective.fov - fov) > 0.01) {
      perspective.fov = fov
      perspective.updateProjectionMatrix()
    }
    const [ex, ey, ez] = pose.eye
    const [tx, ty, tz] = pose.target
    const dx = ex - tx
    const dy = ey - ty
    const dz = ez - tz
    const baseRadius = Math.hypot(dx, dy, dz)
    const theta = Math.atan2(dx, dz) + orbit.current.yaw
    const phi = clamp(Math.acos(dy / baseRadius) + orbit.current.pitch, 0.35, 1.5)
    const radius = baseRadius * orbit.current.zoom
    const horizontal = radius * Math.sin(phi)
    const x = tx + horizontal * Math.sin(theta)
    const y = ty + radius * Math.cos(phi)
    const z = tz + horizontal * Math.cos(theta)

    if (reduced) {
      camera.position.set(x, y, z)
      camera.lookAt(tx, ty, tz)
      look.current = { x: tx, y: ty, z: tz }
      return
    }
    const k = ease(dt)
    camera.position.x += (x - camera.position.x) * k
    camera.position.y += (y - camera.position.y) * k
    camera.position.z += (z - camera.position.z) * k
    look.current.x += (tx - look.current.x) * k
    look.current.y += (ty - look.current.y) * k
    look.current.z += (tz - look.current.z) * k
    camera.lookAt(look.current.x, look.current.y, look.current.z)
  })
  /* eslint-enable react-hooks/immutability */

  return null
}
