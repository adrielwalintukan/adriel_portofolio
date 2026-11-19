import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const scene = readFileSync(new URL('../src/studio/Scene.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

test('the shadow setup is exactly what it was', () => {
  for (const line of [
    'shadows\n',
    'position={[7, 12, 7]}',
    'castShadow',
    'shadow-mapSize={[shadowSize, shadowSize]}',
    'shadow-bias={-0.0003}',
    'shadow-normalBias={0.02}',
    'shadow-camera-left={-9}',
    'shadow-camera-right={9}',
    'shadow-camera-top={9}',
    'shadow-camera-bottom={-9}',
  ])
    assert.ok(scene.includes(line), line.trim())
})

test('the cool fill lights that flattened the room are gone', () => {
  for (const color of ['#8ec4e0', '#7fb0c8', '#b6cbd8']) assert.ok(!scene.includes(color), color)
})
