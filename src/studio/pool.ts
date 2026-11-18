/** Pool table physics in table space: x along the long side, z across, metres, origin at the centre. */
export const POOL = { w: 2.7, d: 1.4, r: 0.045, pocket: 0.1 }

export interface Ball {
  x: number
  z: number
  vx: number
  vz: number
  in: boolean
}

export interface PoolState {
  balls: Ball[]
  shots: number
}

const DECEL = 0.55 // rolling resistance, m/s²
const CUSHION = 0.8
const MAX_POWER = 4.2
const CUE_SPOT = { x: -POOL.w / 4, z: 0 }

const POCKETS = [-1, 0, 1].flatMap((i) =>
  [-1, 1].map((j) => ({ x: (i * POOL.w) / 2, z: (j * POOL.d) / 2 }))
)

/** Ball 0 is the cue ball; then ten balls racked in a triangle on the far half. */
export const rack = (): PoolState => {
  const balls: Ball[] = [{ ...CUE_SPOT, vx: 0, vz: 0, in: false }]
  const gap = POOL.r * 2.02
  for (let row = 0; row < 4; row++) {
    for (let k = 0; k <= row; k++) {
      balls.push({
        x: POOL.w / 4 + row * gap * 0.87,
        z: (k - row / 2) * gap,
        vx: 0,
        vz: 0,
        in: false,
      })
    }
  }
  return { balls, shots: 0 }
}

export const moving = (s: PoolState) => s.balls.some((b) => !b.in && (b.vx !== 0 || b.vz !== 0))

export const potted = (s: PoolState) => s.balls.slice(1).filter((b) => b.in).length

/** Strikes the cue ball toward (x, z); farther aim means a harder shot. Ignored while balls roll. */
export const shoot = (s: PoolState, x: number, z: number) => {
  const cue = s.balls[0]
  if (moving(s) || cue.in) return false
  const dx = x - cue.x
  const dz = z - cue.z
  const dist = Math.hypot(dx, dz)
  if (dist < 1e-3) return false
  const power = Math.min(dist * 2.4, MAX_POWER)
  cue.vx = (dx / dist) * power
  cue.vz = (dz / dist) * power
  s.shots += 1
  return true
}

const SUBSTEPS = 6

export type Hit = (kind: 'ball' | 'cushion' | 'pocket', speed: number) => void

/** Advances the table by dt seconds: rolling, cushions, pockets and ball-on-ball hits. */
export const step = (s: PoolState, dt: number, onHit?: Hit) => {
  const { r } = POOL
  const hx = POOL.w / 2 - r
  const hz = POOL.d / 2 - r
  const h = dt / SUBSTEPS
  const live = s.balls.filter((b) => !b.in)

  for (let n = 0; n < SUBSTEPS; n++) {
    for (const b of live) {
      if (b.in) continue
      const speed = Math.hypot(b.vx, b.vz)
      if (speed === 0) continue
      const slow = Math.max(0, speed - DECEL * h) / speed
      b.vx *= slow
      b.vz *= slow
      if (Math.hypot(b.vx, b.vz) < 0.01) b.vx = b.vz = 0
      b.x += b.vx * h
      b.z += b.vz * h
      if (Math.abs(b.x) > hx) {
        b.x = Math.sign(b.x) * hx
        onHit?.('cushion', Math.abs(b.vx))
        b.vx = -b.vx * CUSHION
      }
      if (Math.abs(b.z) > hz) {
        b.z = Math.sign(b.z) * hz
        onHit?.('cushion', Math.abs(b.vz))
        b.vz = -b.vz * CUSHION
      }
      if (POCKETS.some((p) => Math.hypot(b.x - p.x, b.z - p.z) < POOL.pocket)) {
        b.in = true
        b.vx = b.vz = 0
        onHit?.('pocket', 0)
      }
    }

    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i]
        const b = live[j]
        if (a.in || b.in) continue
        const dx = b.x - a.x
        const dz = b.z - a.z
        const dist = Math.hypot(dx, dz)
        if (dist >= 2 * r || dist === 0) continue
        const nx = dx / dist
        const nz = dz / dist
        const push = (2 * r - dist) / 2
        a.x -= nx * push
        a.z -= nz * push
        b.x += nx * push
        b.z += nz * push
        // equal masses: swap the velocity components along the line of centres
        const along = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz
        if (along <= 0) continue
        onHit?.('ball', along)
        const kick = along * 0.97
        a.vx -= kick * nx
        a.vz -= kick * nz
        b.vx += kick * nx
        b.vz += kick * nz
      }
    }
  }

  if (moving(s)) return
  // a scratch respots the cue ball; a cleared table racks again
  const cue = s.balls[0]
  if (cue.in) Object.assign(cue, CUE_SPOT, { in: false })
  if (potted(s) === s.balls.length - 1) Object.assign(s, rack())
}

/** The one table in the room, shared by the 3D scene and the page's Rerack button. */
export const table: PoolState = rack()

export const rerack = () => Object.assign(table, rack())
