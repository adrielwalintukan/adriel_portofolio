import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COLS, ROWS, brickAt, newGame, stepBreakout } from '../src/studio/breakout.ts'

test('a new game has a full wall, three lives and no score', () => {
  const s = newGame()
  assert.equal(s.bricks.length, ROWS * COLS)
  assert.equal(s.bricks.length, 40)
  assert.ok(s.bricks.every(Boolean))
  assert.equal(s.lives, 3)
  assert.equal(s.score, 0)
  assert.equal(s.over, false)
})

test('a ball fired straight up breaks exactly the brick above it, even at a long frame', () => {
  const s = newGame()
  const b = brickAt(ROWS - 1, 0) // bottom row, first column
  s.bx = b.x + b.w / 2
  s.by = 0.6
  s.vx = 0
  s.vy = -0.9
  for (let i = 0; i < 100 && s.vy < 0; i++) stepBreakout(s, 0.05, s.bx)
  assert.ok(s.vy > 0, 'bounced back down')
  assert.equal(s.bricks.filter((x) => !x).length, 1)
  assert.equal(s.bricks[(ROWS - 1) * COLS], false)
  assert.equal(s.score, 10)
})

test('missing the ball costs a life, and the third miss ends the game', () => {
  const s = newGame()
  for (let life = 3; life > 0; life--) {
    s.bx = 0.9
    s.by = 0.97
    s.vx = 0
    s.vy = 0.5
    for (let i = 0; i < 20; i++) stepBreakout(s, 0.05, 0.1)
    assert.equal(s.lives, life - 1)
  }
  assert.equal(s.over, true)
})

test('clearing the wall refills it and keeps the score', () => {
  const s = newGame()
  s.bricks = s.bricks.map((_, i) => i === 0)
  s.score = 390
  const b = brickAt(0, 0)
  s.bx = b.x + b.w / 2
  s.by = b.y + b.h + 0.02
  s.vx = 0
  s.vy = -0.9
  for (let i = 0; i < 10; i++) stepBreakout(s, 0.05, s.bx)
  assert.ok(s.bricks.every(Boolean))
  assert.equal(s.score, 400)
})
