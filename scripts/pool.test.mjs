import { test } from 'node:test'
import assert from 'node:assert/strict'
import { POOL, rack, shoot, step, moving, potted } from '../src/studio/pool.ts'

const run = (s, seconds = 20) => {
  for (let t = 0; t < seconds && moving(s); t += 1 / 60) step(s, 1 / 60)
}

test('a break shot hits the rack, stays on the table and comes to rest', () => {
  const s = rack()
  assert.equal(s.balls.length, 11)
  assert.ok(shoot(s, POOL.w / 4, 0))
  assert.equal(shoot(s, 0, 0), false, 'no second shot while rolling')
  run(s)
  assert.equal(moving(s), false)
  assert.ok(
    s.balls.slice(1).some((b) => b.x !== rack().balls[s.balls.indexOf(b)].x),
    'rack was hit'
  )
  for (const b of s.balls.filter((b) => !b.in)) {
    assert.ok(Math.abs(b.x) <= POOL.w / 2 && Math.abs(b.z) <= POOL.d / 2)
  }
})

test('a ball sent into a corner is potted, a scratched cue ball respots', () => {
  const s = rack()
  s.balls[1].x = POOL.w / 2 - 0.2
  s.balls[1].z = POOL.d / 2 - 0.2
  s.balls[1].vx = s.balls[1].vz = 1
  // the cue ball heads straight for the near corner pocket
  s.balls[0].vx = -2
  s.balls[0].vz = -2.07
  run(s)
  assert.equal(potted(s), 1)
  assert.deepEqual([s.balls[0].in, s.balls[0].x, s.balls[0].z], [false, -POOL.w / 4, 0])
})

test('hits are reported: a break makes ball and cushion sounds', () => {
  const s = rack()
  const kinds = new Set()
  shoot(s, POOL.w / 4, 0)
  for (let t = 0; t < 20 && moving(s); t += 1 / 60)
    step(s, 1 / 60, (kind, speed) => {
      assert.ok(speed >= 0)
      kinds.add(kind)
    })
  assert.ok(kinds.has('ball') && kinds.has('cushion'))
})
