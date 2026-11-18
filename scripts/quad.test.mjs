import { test } from 'node:test'
import assert from 'node:assert/strict'
import { quadMatrix } from '../src/studio/quad.ts'

// apply a column-major matrix3d to a 2D point, with the perspective divide
const apply = (m, x, y) => {
  const w = m[3] * x + m[7] * y + m[15]
  return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w]
}

test('quadMatrix puts the box corners on a keystoned quad', () => {
  const quad = [
    [120, 80],
    [860, 95],
    [830, 470],
    [150, 455],
  ]
  const m = quadMatrix(960, 532, quad)
  const corners = [
    [0, 0],
    [960, 0],
    [960, 532],
    [0, 532],
  ]
  corners.forEach(([x, y], i) => {
    const [px, py] = apply(m, x, y)
    assert.ok(Math.abs(px - quad[i][0]) < 1e-6 && Math.abs(py - quad[i][1]) < 1e-6, `corner ${i}: ${px},${py}`)
  })
})
