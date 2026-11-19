import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CARRY_POSE, READ_POSE, jointsAt } from '../src/studio/armpose.ts'

// the torso is roughly an ellipse around the spine; an elbow inside it would poke through the jacket
const clear = (e) => e.y < 1.0 || (e.x / 0.26) ** 2 + (e.z / 0.18) ** 2 > 1

test('reading: both hands meet in front of the chest, a book width apart, elbows clear of the body', () => {
  const l = jointsAt('L', READ_POSE.L)
  const r = jointsAt('R', READ_POSE.R)
  for (const j of [l, r]) {
    assert.ok(j.hand.y > 1.0 && j.hand.y < 1.25, `hand height ${j.hand.y}`)
    assert.ok(j.hand.z > 0.2, `hand forward ${j.hand.z}`)
    assert.ok(clear(j.elbow), 'elbow inside the torso')
  }
  const gap = l.hand.distanceTo(r.hand)
  assert.ok(gap > 0.2 && gap < 0.46, `hands ${gap} apart`)
})

test('carrying: the right hand holds the book in front of the body, the elbow clear of it', () => {
  const j = jointsAt('R', CARRY_POSE)
  assert.ok(j.hand.y > 0.9 && j.hand.y < 1.2, `hand height ${j.hand.y}`)
  assert.ok(j.hand.z > 0.15, `hand forward ${j.hand.z}`)
  assert.ok(clear(j.elbow), 'elbow inside the torso')
})
