import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clean } from '../src/lib/guestbook.ts'

const ok = (input) => {
  const r = clean(input)
  assert.equal(r.ok, true, JSON.stringify(r))
  return r.note
}
const bad = (input) => assert.equal(clean(input).ok, false, JSON.stringify(input))

test('a normal note passes, trimmed and with spaces collapsed', () => {
  assert.deepEqual(ok({ name: '  Rina  ', message: 'Keren   banget\nstudionya!', website: '' }), {
    name: 'Rina',
    message: 'Keren banget studionya!',
  })
})

test('lengths are enforced: name 1-24, message 1-80', () => {
  ok({ name: 'a'.repeat(24), message: 'b'.repeat(80) })
  bad({ name: 'a'.repeat(25), message: 'hi' })
  bad({ name: 'Rina', message: 'b'.repeat(81) })
  bad({ name: '   ', message: 'hi' })
  bad({ name: 'Rina', message: '' })
})

test('bots that fill the hidden field and junk bodies are rejected', () => {
  bad({ name: 'Rina', message: 'hi', website: 'http://spam.example' })
  bad(null)
  bad('text')
  bad({ name: 3, message: 'hi' })
})

test('rude words are blocked in Indonesian, English and leetspeak', () => {
  bad({ name: 'Rina', message: 'dasar goblok' })
  bad({ name: 'Rina', message: 'this is shit' })
  bad({ name: 'Rina', message: 'you b1tch' })
})

test('ordinary words that merely contain a blocked one still pass', () => {
  ok({ name: 'Rina', message: 'anjingnya lucu, classic setup' })
  ok({ name: 'Natasha', message: 'Great assessment of the stack' })
})

test('markup is kept as plain text; the board draws it on a canvas', () => {
  assert.equal(ok({ name: 'x', message: '<script>alert(1)</script>' }).message, '<script>alert(1)</script>')
})

test('invisible and direction-control characters are stripped, so they cannot hide a blocked word', () => {
  bad({ name: 'Rina', message: 'f​uck this' })
  assert.equal(ok({ name: '‮anir', message: 'hi⁦' }).name, 'anir')
})

test('babi passes: in Manado it is mostly food (babi rica)', () => {
  ok({ name: 'Rina', message: 'babi rica enak' })
})
