import { bark, unlock } from '../sound'
import { roomFx } from '../data'
import type { TermEffect } from '../terminal'

/** Plays a hidden command's effect in the room; the left monitor's terminal and the desktop's share it. */
export const applyEffect = (effect: TermEffect) => {
  unlock()
  if (effect === 'bark') {
    bark()
    roomFx.bark = performance.now()
  } else if (effect === 'rain') roomFx.rain = !roomFx.rain
  else {
    roomFx.kind = effect
    roomFx.at = performance.now()
  }
}
