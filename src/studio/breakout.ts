/**
 * The TV's Breakout, in 0..1 screen space (y down). Pure, so it is tested with node --test; the TV
 * paints whatever state this leaves behind.
 */
export const ROWS = 5
export const COLS = 8
const TOP = 0.12
const ROW_H = 0.05
const GAP = 0.008
const SIDE = 0.04
const BRICK_W = (1 - SIDE * 2 - GAP * (COLS - 1)) / COLS
export const PADDLE_Y = 0.92
export const PADDLE_HALF = 0.09
export const BALL_R = 0.012
const PADDLE_RATE = 1.8
const SERVE = { vx: 0.35, vy: -0.75 }

export type BreakoutState = {
  bx: number
  by: number
  vx: number
  vy: number
  paddle: number
  bricks: boolean[]
  score: number
  lives: number
  over: boolean
}

export const brickAt = (row: number, col: number) => ({
  x: SIDE + col * (BRICK_W + GAP),
  y: TOP + row * (ROW_H + GAP),
  w: BRICK_W,
  h: ROW_H,
})

const serve = (s: BreakoutState) => {
  s.bx = s.paddle
  s.by = PADDLE_Y - 0.07
  s.vx = SERVE.vx
  s.vy = SERVE.vy
}

export const newGame = (): BreakoutState => {
  const s: BreakoutState = {
    bx: 0.5,
    by: 0.5,
    vx: 0,
    vy: 0,
    paddle: 0.5,
    bricks: Array.from({ length: ROWS * COLS }, () => true),
    score: 0,
    lives: 3,
    over: false,
  }
  serve(s)
  return s
}

/** The brick the ball's centre is in (grown by its radius), or -1. */
const hitBrick = (s: BreakoutState, x: number, y: number) =>
  s.bricks.findIndex((alive, i) => {
    if (!alive) return false
    const b = brickAt(Math.floor(i / COLS), i % COLS)
    return x > b.x - BALL_R && x < b.x + b.w + BALL_R && y > b.y - BALL_R && y < b.y + b.h + BALL_R
  })

export const stepBreakout = (s: BreakoutState, dt: number, paddleTo: number) => {
  if (s.over) return
  const target = Math.min(1 - PADDLE_HALF, Math.max(PADDLE_HALF, paddleTo))
  s.paddle += Math.max(-PADDLE_RATE * dt, Math.min(PADDLE_RATE * dt, target - s.paddle))

  // small sub-steps, so a slow frame can never carry the ball through a brick or the paddle
  const steps = Math.max(1, Math.ceil((Math.hypot(s.vx, s.vy) * dt) / 0.01))
  const h = dt / steps
  for (let k = 0; k < steps; k++) {
    const px = s.bx
    s.bx += s.vx * h
    s.by += s.vy * h

    if (s.bx < BALL_R || s.bx > 1 - BALL_R) {
      s.bx = Math.min(1 - BALL_R, Math.max(BALL_R, s.bx))
      s.vx = -s.vx
    }
    if (s.by < BALL_R) {
      s.by = BALL_R
      s.vy = Math.abs(s.vy)
    }

    const i = hitBrick(s, s.bx, s.by)
    if (i >= 0) {
      s.bricks[i] = false
      s.score += 10
      const b = brickAt(Math.floor(i / COLS), i % COLS)
      // came in from the side: bounce sideways; otherwise off the top or bottom face
      if (px <= b.x - BALL_R || px >= b.x + b.w + BALL_R) s.vx = -s.vx
      else s.vy = -s.vy
      if (s.bricks.every((alive) => !alive)) {
        s.bricks = s.bricks.map(() => true)
        serve(s)
        return
      }
      continue
    }

    if (s.vy > 0 && s.by >= PADDLE_Y - BALL_R && s.by < PADDLE_Y + 0.03 && Math.abs(s.bx - s.paddle) < PADDLE_HALF + BALL_R) {
      // where it lands on the paddle sets the angle; the speed stays the same
      const speed = Math.hypot(s.vx, s.vy)
      const offset = Math.max(-1, Math.min(1, (s.bx - s.paddle) / PADDLE_HALF))
      s.by = PADDLE_Y - BALL_R
      s.vx = offset * 0.7 * speed
      s.vy = -Math.sqrt(speed * speed - s.vx * s.vx)
    }

    if (s.by > 1.02) {
      s.lives -= 1
      if (s.lives <= 0) {
        s.over = true
        return
      }
      serve(s)
      return
    }
  }
}
