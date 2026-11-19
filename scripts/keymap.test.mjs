import { test } from 'node:test'
import assert from 'node:assert/strict'
import { keyAction } from '../src/studio/keymap.ts'

const ev = (key, extra = {}) => ({ key, ctrlKey: false, metaKey: false, altKey: false, ...extra })
const free = { typing: false, modal: false }

test('letters and ? map to room actions, case-insensitively', () => {
  assert.deepEqual(keyAction(ev('?'), free), { type: 'help' })
  assert.deepEqual(keyAction(ev('m'), free), { type: 'music' })
  assert.deepEqual(keyAction(ev('M'), free), { type: 'music' })
  assert.deepEqual(keyAction(ev('t'), free), { type: 'tour' })
  assert.deepEqual(keyAction(ev('n'), free), { type: 'night' })
  assert.deepEqual(keyAction(ev('r'), free), { type: 'room' })
})

test('1 to 5 jump to the stations in menu order', () => {
  const ids = ['projects', 'skills', 'experience', 'certificates', 'about']
  ids.forEach((id, i) => assert.deepEqual(keyAction(ev(String(i + 1)), free), { type: 'station', id }))
  assert.equal(keyAction(ev('6'), free), null)
  assert.equal(keyAction(ev('0'), free), null)
})

test('nothing fires while typing, behind a modal, with a modifier, or for other keys', () => {
  assert.equal(keyAction(ev('m'), { typing: true, modal: false }), null)
  assert.equal(keyAction(ev('1'), { typing: false, modal: true }), null)
  assert.equal(keyAction(ev('r', { ctrlKey: true }), free), null)
  assert.equal(keyAction(ev('t', { metaKey: true }), free), null)
  assert.equal(keyAction(ev('n', { altKey: true }), free), null)
  assert.equal(keyAction(ev('x'), free), null)
  assert.equal(keyAction(ev('Enter'), free), null)
})

test('a held key does not repeat the action', () => {
  assert.equal(keyAction(ev('n', { repeat: true }), free), null)
  assert.equal(keyAction(ev('m', { repeat: true }), free), null)
  assert.deepEqual(keyAction(ev('n', { repeat: false }), free), { type: 'night' })
})
