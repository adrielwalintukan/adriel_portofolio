/**
 * Every sound in the studio is synthesised with Web Audio: no audio files. Browsers only allow
 * audio after a user gesture, so nothing is created until `unlock()` runs inside one.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null

/** Call from a click or key handler; safe to call again. */
export const unlock = () => {
  if (typeof window === 'undefined') return
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.8
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

const ready = () => (ctx && master && ctx.state === 'running' ? { ctx, master } : null)

const noiseBuffer = (seconds: number) => {
  const c = ctx!
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

/** A short tone with an exponential fall, optionally sliding in pitch. */
const blip = (
  freq: number,
  endFreq: number,
  seconds: number,
  volume: number,
  type: OscillatorType
) => {
  const a = ready()
  if (!a) return
  const now = a.ctx.currentTime
  const osc = a.ctx.createOscillator()
  const gain = a.ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + seconds)
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
  osc.connect(gain).connect(a.master)
  osc.start(now)
  osc.stop(now + seconds + 0.02)
}

/** A very short filtered noise tick: the hard edge of two balls meeting. */
const tick = (volume: number, cutoff: number) => {
  const a = ready()
  if (!a) return
  const now = a.ctx.currentTime
  const src = a.ctx.createBufferSource()
  src.buffer = noiseBuffer(0.03)
  const filter = a.ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = cutoff
  filter.Q.value = 3
  const gain = a.ctx.createGain()
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03)
  src.connect(filter).connect(gain).connect(a.master)
  src.start(now)
}

const loud = (speed: number, max: number) => Math.min(1, speed / 3) * max

/** Two short woofs: a falling tone with a breathy edge, the second a little lower. */
export const bark = () => {
  const a = ready()
  if (!a) return
  ;[0, 0.22].forEach((delay, i) => {
    const at = a.ctx.currentTime + delay
    const osc = a.ctx.createOscillator()
    const gain = a.ctx.createGain()
    const filter = a.ctx.createBiquadFilter()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(i ? 420 : 470, at)
    osc.frequency.exponentialRampToValueAtTime(i ? 210 : 240, at + 0.13)
    filter.type = 'lowpass'
    filter.frequency.value = 1400
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.3, at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16)
    osc.connect(filter).connect(gain).connect(a.master)
    osc.start(at)
    osc.stop(at + 0.18)
  })
}

export const poolSound = {
  cue: (power: number) => {
    tick(loud(power, 0.5), 2600)
    blip(900, 500, 0.05, loud(power, 0.12), 'triangle')
  },
  ball: (speed: number) => {
    tick(loud(speed, 0.7), 3400)
    blip(2200, 1700, 0.04, loud(speed, 0.1), 'sine')
  },
  cushion: (speed: number) => blip(160, 90, 0.09, loud(speed, 0.35), 'sine'),
  pocket: () => {
    blip(260, 90, 0.22, 0.25, 'sine')
    tick(0.15, 700)
  },
}

/* --- room music: a slow lofi loop --------------------------------------------------------- */

// Fmaj7, Em7, Dm7, Cmaj7: two bars each at 72 bpm
const CHORDS = [
  [174.61, 220.0, 261.63, 329.63],
  [164.81, 196.0, 246.94, 293.66],
  [146.83, 174.61, 220.0, 261.63],
  [130.81, 164.81, 196.0, 246.94],
]
const BEAT = 60 / 72

let music: {
  bus: GainNode
  timer: number
  next: number
  step: number
  crackle: AudioBufferSourceNode
  kicks: number[]
} | null = null

const schedule = (c: AudioContext, bus: GainNode, at: number, step: number) => {
  const bar = Math.floor(step / 4)
  const beat = step % 4
  // a soft chord pad at the start of every second bar
  if (beat === 0 && bar % 2 === 0) {
    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.connect(bus)
    for (const freq of CHORDS[(bar / 2) % CHORDS.length]) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      osc.detune.value = (Math.random() - 0.5) * 12
      const length = BEAT * 8
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(0.05, at + 0.4)
      gain.gain.linearRampToValueAtTime(0.0001, at + length)
      osc.connect(gain).connect(filter)
      osc.start(at)
      osc.stop(at + length + 0.05)
    }
  }
  // kick on 1 and 3, a brushed hat on every beat
  if (beat === 0 || beat === 2) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.frequency.setValueAtTime(110, at)
    osc.frequency.exponentialRampToValueAtTime(45, at + 0.18)
    gain.gain.setValueAtTime(0.28, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25)
    osc.connect(gain).connect(bus)
    osc.start(at)
    osc.stop(at + 0.3)
  }
  const hat = c.createBufferSource()
  hat.buffer = noiseBuffer(0.06)
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 6000
  const hg = c.createGain()
  hg.gain.setValueAtTime(beat % 2 ? 0.035 : 0.02, at + BEAT * 0.5)
  hg.gain.exponentialRampToValueAtTime(0.0001, at + BEAT * 0.5 + 0.06)
  hat.connect(hp).connect(hg).connect(bus)
  hat.start(at + BEAT * 0.5)
}

/** Starts the loop quietly; it schedules a little ahead so timer jitter never gaps the beat. */
export const startMusic = () => {
  const a = ready()
  if (!a || music) return
  const bus = a.ctx.createGain()
  bus.gain.setValueAtTime(0, a.ctx.currentTime)
  bus.gain.linearRampToValueAtTime(0.55, a.ctx.currentTime + 2)
  bus.connect(a.master)

  // vinyl crackle under everything
  const crackle = a.ctx.createBufferSource()
  crackle.buffer = noiseBuffer(2)
  crackle.loop = true
  const cf = a.ctx.createBiquadFilter()
  cf.type = 'bandpass'
  cf.frequency.value = 2500
  const cg = a.ctx.createGain()
  cg.gain.value = 0.012
  crackle.connect(cf).connect(cg).connect(bus)
  crackle.start()

  const state = { bus, timer: 0, next: a.ctx.currentTime + 0.1, step: 0, crackle, kicks: [] as number[] }
  state.timer = window.setInterval(() => {
    while (state.next < a.ctx.currentTime + 0.4) {
      schedule(a.ctx, bus, state.next, state.step)
      // kicks land on beats 1 and 3; the lights read these times back
      if (state.step % 2 === 0) state.kicks = [...state.kicks.slice(-7), state.next]
      state.next += BEAT
      state.step += 1
    }
  }, 100)
  music = state
}

/** 0..1: jumps to 1 on each kick of the music and fades out; 0 while the music is off. */
export const musicPulse = () => {
  if (!music || !ctx) return 0
  const now = ctx.currentTime
  const last = music.kicks.filter((k) => k <= now).pop()
  return last === undefined ? 0 : Math.exp(-(now - last) * 6)
}

export const stopMusic = () => {
  if (!music || !ctx) return
  const { bus, timer, crackle } = music
  window.clearInterval(timer)
  bus.gain.cancelScheduledValues(ctx.currentTime)
  bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime)
  bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
  crackle.stop(ctx.currentTime + 0.7)
  window.setTimeout(() => bus.disconnect(), 800)
  music = null
}
