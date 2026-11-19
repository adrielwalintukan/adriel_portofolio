import { test } from 'node:test'
import assert from 'node:assert/strict'
import { phaseAt, witaHour } from '../src/studio/daylight.ts'

test('the phase follows the clock in Manado (UTC+8)', () => {
  assert.equal(phaseAt(new Date('2026-11-19T04:00:00Z')), 'day') // 12:00 WITA
  assert.equal(phaseAt(new Date('2026-11-19T10:00:00Z')), 'dusk') // 18:00
  assert.equal(phaseAt(new Date('2026-11-19T16:00:00Z')), 'night') // 00:00, wraps past midnight
  assert.equal(phaseAt(new Date('2026-11-19T21:30:00Z')), 'dawn') // 05:30
  assert.equal(phaseAt(new Date('2026-11-19T22:00:00Z')), 'day') // 06:00 boundary
  assert.equal(phaseAt(new Date('2026-11-19T11:00:00Z')), 'night') // 19:00 boundary
})

test('witaHour is fractional and wraps at 24', () => {
  assert.equal(witaHour(new Date('2026-11-19T17:45:00Z')), 1.75)
  assert.equal(witaHour(new Date('2026-11-19T15:59:00Z')).toFixed(3), '23.983')
})

test('fill light stays low in every phase, so the room is lit by its lamps', async () => {
  const { LIGHT } = await import('../src/studio/daylight.ts')
  for (const [phase, l] of Object.entries(LIGHT)) {
    assert.ok(l.ambient <= 0.1, `${phase} ambient`)
    assert.ok(l.hemi <= 0.1, `${phase} hemi`)
  }
  assert.ok(LIGHT.day.window.intensity > LIGHT.night.window.intensity)
})

test('toggling flips night and day and the choice overrides the clock until cleared', async () => {
  const m = await import('../src/studio/daylight.ts')
  m.setPhaseOverride(null)
  const midnight = new Date('2026-11-19T16:00:00Z') // 00:00 WITA, night
  assert.equal(m.togglePhase(midnight), 'day')
  assert.equal(m.getPhaseOverride(), 'day')
  assert.equal(m.effectivePhase(midnight), 'day')
  assert.equal(m.togglePhase(midnight), 'night')
  const noon = new Date('2026-11-19T04:00:00Z')
  assert.equal(m.effectivePhase(noon), 'night') // the override wins over a daytime clock
  m.setPhaseOverride(null)
  assert.equal(m.getPhaseOverride(), null)
  assert.equal(m.effectivePhase(noon), 'day')
  assert.equal(m.togglePhase(noon), 'night') // by day, toggling goes to night
  m.setPhaseOverride(null)
})
