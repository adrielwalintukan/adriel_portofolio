import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FAST_DPR, defaultQuality, newMonitor, sample } from '../src/studio/quality.ts'

test('defaults: HD on desktop, Fast on touch, a saved choice wins', () => {
  assert.deepEqual(defaultQuality(false, 2, null), { hd: true, ao: true, dpr: 2 })
  assert.equal(defaultQuality(false, 1, null).dpr, 1.5)
  assert.equal(defaultQuality(false, 3, null).dpr, 2)
  assert.deepEqual(defaultQuality(true, 3, null), { hd: false, ao: false, dpr: FAST_DPR })
  assert.equal(defaultQuality(true, 3, 'on').hd, true)
  assert.equal(defaultQuality(false, 2, 'off').hd, false)
  assert.equal(defaultQuality(false, 2, 'off').dpr, FAST_DPR)
})

const feed = (m, q, n, fps, start, auto = true) => {
  let t = start
  for (let i = 0; i < n; i++) {
    t += 2000
    ;({ monitor: m, quality: q } = sample(m, t, fps, q, auto))
  }
  return { m, q, t }
}

test('the first seconds (shaders, textures) never count against the quality', () => {
  const m = newMonitor(0)
  const q = defaultQuality(false, 2, null)
  const out = sample(m, 1000, 5, q, true)
  assert.deepEqual(out.quality, q)
  assert.equal(out.monitor.slow, 0)
})

test('two slow windows in a row step down: AO, then dpr, then Fast; then nothing more', () => {
  let { m, q } = { m: newMonitor(0), q: defaultQuality(false, 2, null) }
  let t = 5000
  ;({ m, q, t } = feed(m, q, 2, 10, t))
  assert.equal(q.ao, false)
  assert.equal(q.hd, true)
  ;({ m, q, t } = feed(m, q, 2, 10, t))
  assert.equal(q.dpr, FAST_DPR)
  assert.equal(q.hd, true)
  ;({ m, q, t } = feed(m, q, 2, 10, t))
  assert.equal(q.hd, false)
  const after = feed(m, q, 6, 10, t)
  assert.deepEqual(after.q, q)
})

test('one slow window followed by a fast one never steps down', () => {
  let m = newMonitor(0)
  let q = defaultQuality(false, 2, null)
  ;({ monitor: m, quality: q } = sample(m, 6000, 10, q, true))
  ;({ monitor: m, quality: q } = sample(m, 8000, 60, q, true))
  ;({ monitor: m, quality: q } = sample(m, 10000, 10, q, true))
  assert.equal(q.ao, true)
})

test('a visitor-chosen mode (auto = false) is never overridden', () => {
  const q = defaultQuality(false, 2, 'on')
  const { q: out } = feed(newMonitor(0), q, 10, 5, 5000, false)
  assert.deepEqual(out, q)
})
