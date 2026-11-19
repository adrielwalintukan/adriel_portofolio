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

test('hidden commands trigger room effects and stay out of help', () => {
  const hire = runCommand('sudo hire adriel', data)
  assert.equal(hire.effect, 'hire')
  assert.ok(hire.lines.some(([t]) => t.includes(data.email)))
  assert.equal(runCommand('SUDO Hire Adriel', data).effect, 'hire')
  assert.equal(runCommand('matrix', data).effect, 'matrix')
  assert.equal(runCommand('bark', data).effect, 'bark')
  assert.equal(runCommand('rain', data).effect, 'rain')
  const help = runCommand('help', data).lines.map(([t]) => t).join('\n')
  for (const word of ['sudo', 'matrix', 'bark', 'rain']) assert.ok(!help.includes(word), word)
  const denied = runCommand('sudo rm -rf /', data)
  assert.equal(denied.effect, undefined)
  assert.match(denied.lines[1][0], /not in the sudoers file/)
})

test('help points at the secrets, and hint lists them', () => {
  assert.ok(runCommand('help', data).lines.some(([t]) => t.includes('hint')))
  const hint = runCommand('hint', data).lines.map(([t]) => t).join('\n')
  for (const word of ['sudo hire adriel', 'matrix', 'bark', 'rain']) assert.ok(hint.includes(word), word)
})
