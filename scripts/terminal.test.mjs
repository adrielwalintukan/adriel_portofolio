import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runCommand } from '../src/studio/terminal.ts'

const data = {
  name: 'Adriel',
  about: 'student',
  city: 'Manado',
  email: 'a@b.c',
  availability: 'open',
  projects: ['DailyBoost AI', 'Interview AI', 'Carta AI'],
  skills: [{ category: 'Frontend', names: ['React', 'Vite'] }],
}

test('terminal commands', () => {
  assert.ok(runCommand('help', data).lines.some(([t]) => t.startsWith('open <n>')))
  assert.equal(runCommand('open 2', data).open, 1)
  assert.equal(runCommand('open carta', data).open, 2)
  assert.equal(runCommand('open 9', data).open, undefined)
  assert.equal(runCommand('clear', data).clear, true)
  assert.match(runCommand('rm -rf /', data).lines[1][0], /command not found: rm/)
  assert.equal(runCommand('ls', data).lines[1][0], '01  DailyBoost AI')
})
