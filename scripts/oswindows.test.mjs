import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AREA, activeId, close, focus, initial, minimize, move, open, toggleMax } from '../src/studio/os/windows.ts'

const two = () => {
  let s = open(initial(), 'explorer', 'Explorer')
  s = open(s, 'notepad', 'Notepad')
  return s
}

test('windows cascade and the newest is on top', () => {
  const s = two()
  const [a, b] = s.wins
  assert.ok(b.z > a.z)
  assert.equal(b.x - a.x, 28)
  assert.equal(b.y - a.y, 28)
  assert.equal(activeId(s), b.id)
})

test('focus raises a window and brings a minimized one back', () => {
  let s = two()
  const [a, b] = s.wins
  s = minimize(s, a.id)
  assert.equal(activeId(s), b.id)
  s = focus(s, a.id)
  assert.equal(s.wins.find((w) => w.id === a.id).min, false)
  assert.equal(activeId(s), a.id)
})

test('closing the last window leaves no active window, never a stuck one', () => {
  let s = two()
  const [a, b] = s.wins
  s = close(s, b.id)
  assert.equal(activeId(s), a.id)
  s = close(s, a.id)
  assert.equal(activeId(s), null)
  assert.equal(s.wins.length, 0)
})

test('maximize toggles and restores the earlier geometry', () => {
  let s = open(initial(), 'photos', 'Photos')
  const before = { ...s.wins[0] }
  s = toggleMax(s, before.id)
  assert.equal(s.wins[0].max, true)
  s = toggleMax(s, before.id)
  const after = s.wins[0]
  assert.deepEqual([after.x, after.y, after.w, after.h, after.max], [before.x, before.y, before.w, before.h, false])
})

test('dragging far off screen keeps the title bar reachable', () => {
  const s0 = open(initial(), 'media', 'Player')
  const id = s0.wins[0].id
  for (const [x, y] of [[-5000, -5000], [5000, 5000]]) {
    const w = move(s0, id, x, y).wins[0]
    assert.ok(w.x + w.w >= 80, `x ${w.x}`)
    assert.ok(w.x <= AREA.w - 80, `x ${w.x}`)
    assert.ok(w.y >= 0 && w.y <= AREA.h - 32, `y ${w.y}`)
  }
})

test('on a phone a new window opens maximized; an unknown id changes nothing', () => {
  const s = open(initial(), 'browser', 'Browser', undefined, true)
  assert.equal(s.wins[0].max, true)
  assert.equal(close(s, 999), s)
})

test('retarget swaps a window\'s content in place and raises it', async () => {
  const { retarget } = await import('../src/studio/os/windows.ts')
  let s = two()
  const [a] = s.wins
  s = retarget(s, a.id, 'Demo', { src: '/x.mp4', kind: 'video' })
  const w = s.wins.find((x) => x.id === a.id)
  assert.equal(w.title, 'Demo')
  assert.equal(w.arg.src, '/x.mp4')
  assert.equal(activeId(s), a.id)
  assert.equal(retarget(s, 999, 'x'), s)
})

test('restoring a window that opened maximized (phones) really restores it', () => {
  let s = open(initial(), 'photos', 'Photos', undefined, true)
  const id = s.wins[0].id
  s = toggleMax(s, id)
  assert.equal(s.wins[0].max, false)
})
