// ============================================================
// SOMNOGRAPH — a sleep synthesizer: it plays the night instead of recording it
// BODY (low, slow) + BRAIN (high, unstable), steered by 9 knobs
// ============================================================

// ───────── Knobs ─────────
const PARAMS = {
  sleep: {
    label: 'Sleep',
    min: 0,
    max: 1,
    value: 0.1,
    unit: '%',
    hint: 'depth of sleep: darker, quieter, slower',
  },
  pulse: {
    label: 'Pulse',
    min: 40,
    max: 110,
    value: 90,
    unit: ' bpm',
    hint: 'heart rate = the tempo of the whole night',
  },
  brain: {
    label: 'Brain',
    min: 0,
    max: 1,
    value: 0.8,
    unit: '%',
    hint: 'how many brain notes survive from the motif',
  },
  depth: {
    label: 'Depth',
    min: 0,
    max: 1,
    value: 0.2,
    unit: '%',
    hint: 'dream space: bigger reverb, darker body',
  },
  noise: {
    label: 'Noise',
    min: 0,
    max: 1,
    value: 0.1,
    unit: '%',
    hint: 'breathing noise of the room',
  },
  rem: {
    label: 'REM',
    min: 0,
    max: 1,
    value: 0,
    unit: '%',
    hint: 'rapid eye movement: glitching pitch and echoes',
  },
  wake: {
    label: 'Wake',
    min: 0,
    max: 1,
    value: 0.8,
    unit: '%',
    hint: 'opens the filters: brighter, sharper, awake',
  },
  drift: {
    label: 'Drift',
    min: 0,
    max: 1,
    value: 0.3,
    unit: '%',
    hint: 'body wobble: slow chorus, the pitch floats',
  },
  echo: {
    label: 'Echo',
    min: 0,
    max: 1,
    value: 0.3,
    unit: '%',
    hint: 'brain echoes bouncing between the ears',
  },
}

// ───────── Stages of the night: scenes of knob values ─────────
const STAGES = {
  awake: {
    sleep: 0.1,
    pulse: 96,
    brain: 0.9,
    depth: 0.2,
    noise: 0.1,
    rem: 0,
    wake: 0.55,
    drift: 0.1,
    echo: 0.15,
  },
  n1: {
    sleep: 0.3,
    pulse: 80,
    brain: 0.6,
    depth: 0.4,
    noise: 0.25,
    rem: 0,
    wake: 0.3,
    drift: 0.3,
    echo: 0.3,
  },
  n2: {
    sleep: 0.55,
    pulse: 66,
    brain: 0.4,
    depth: 0.6,
    noise: 0.35,
    rem: 0,
    wake: 0.1,
    drift: 0.5,
    echo: 0.4,
  },
  n3: {
    sleep: 0.95,
    pulse: 46,
    brain: 0.12,
    depth: 0.95,
    noise: 0.5,
    rem: 0,
    wake: 0,
    drift: 0.8,
    echo: 0.6,
  },
  rem: {
    sleep: 0.6,
    pulse: 88,
    brain: 1,
    depth: 0.7,
    noise: 0.2,
    rem: 1,
    wake: 0,
    drift: 0.6,
    echo: 0.9,
  },
  wake: {
    sleep: 0.05,
    pulse: 104,
    brain: 0.8,
    depth: 0.15,
    noise: 0.05,
    rem: 0.1,
    wake: 1,
    drift: 0.1,
    echo: 0.1,
  },
}
const STAGE_ORDER = Object.keys(STAGES)

// [stage, seconds before the next one]
const NIGHT = [
  ['awake', 10],
  ['n1', 18],
  ['n2', 22],
  ['n3', 28],
  ['rem', 28],
  ['wake', 16],
]

// ───────── The score: one motif that develops through the night ─────────
// A phrase has 16 steps (eighth notes), a cycle has two phrases.
// Awake / N1 — the motif in D minor, complete.    N2 — only what is left of it.
// N3 — one long D.                                REM — a foreign whole-tone world.
// Wake — the same motif comes back in D major, an octave brighter: the sleeper has changed.
const steps = (notes) => Array.from({ length: 16 }, (_, i) => notes[i] ?? null)
const half = (phrase) => phrase.map((note, i) => (i < 8 ? note : null))

const PHRASE_A = steps({
  0: 'F5',
  2: 'A5',
  3: 'G5',
  5: 'E5',
  6: 'D6',
  8: 'F5',
  9: 'C6',
  11: 'A5',
  13: 'E5',
  14: 'C#6',
})
const PHRASE_B = steps({
  0: 'A5',
  2: 'F5',
  3: 'E5',
  5: 'G5',
  6: 'D6',
  8: 'F5',
  10: 'A5',
  11: 'C6',
  13: 'E5',
  14: 'D6',
})
const PHRASE_A_MAJOR = steps({
  0: 'F#5',
  2: 'A5',
  3: 'G5',
  5: 'E5',
  6: 'D6',
  8: 'F#5',
  9: 'C#6',
  11: 'A5',
  13: 'E5',
  14: 'C#6',
})
const PHRASE_B_MAJOR = steps({
  0: 'A5',
  2: 'F#5',
  3: 'E5',
  5: 'G5',
  6: 'D6',
  8: 'F#5',
  10: 'A5',
  11: 'C#6',
  13: 'E5',
  14: 'D6',
})
const PHRASE_REM_A = steps({
  0: 'Bb5',
  2: 'D6',
  3: 'C6',
  5: 'E6',
  6: 'F#6',
  8: 'D6',
  9: 'Ab6',
  11: 'E6',
  13: 'C6',
  14: 'Bb5',
})
const PHRASE_REM_B = steps({
  0: 'E6',
  2: 'C6',
  3: 'Bb5',
  5: 'D6',
  6: 'F#6',
  8: 'C6',
  10: 'E6',
  11: 'Ab6',
  13: 'D6',
  14: 'F#6',
})

const MATERIAL = {
  awake: {
    body: steps({ 0: 'D2', 4: 'A1', 8: 'Bb1', 12: 'F2' }),
    brain: [PHRASE_A, PHRASE_B],
  },
  n2: {
    body: steps({ 0: 'D2', 8: 'Bb1' }),
    brain: [half(PHRASE_A), half(PHRASE_B)],
  },
  n3: {
    body: steps({ 0: 'D2' }),
    brain: [steps({ 0: 'D5' }), steps({ 0: 'A4' })],
  },
  rem: {
    body: steps({ 0: 'Bb1', 6: 'C2', 10: 'Bb1', 14: 'D2' }),
    brain: [PHRASE_REM_A, PHRASE_REM_B],
  },
  wake: {
    body: steps({ 0: 'D3', 4: 'A2', 8: 'B2', 12: 'F#3' }),
    brain: [PHRASE_A_MAJOR, PHRASE_B_MAJOR],
  },
}
MATERIAL.n1 = MATERIAL.awake

// ───────── Report: phase of sleep, brain waves, what the subject sees ─────────
const PHASES = {
  awake: {
    title: 'Awake',
    waves: 'beta waves',
    hz: 'beta · 13–30 Hz',
    dreams: [
      'The lights are still on. Thoughts run faster than you can follow.',
      'You replay the conversations of the day.',
      'A to-do list scrolls behind your eyes.',
    ],
  },
  n1: {
    title: 'N1 · falling asleep',
    waves: 'alpha waves',
    hz: 'alpha · 8–13 Hz',
    dreams: [
      'Shapes drift in: a corridor, a window, a half-heard voice.',
      'Your body feels heavy and far away.',
      'A thought slips and turns into an image.',
    ],
  },
  n2: {
    title: 'N2 · light sleep',
    waves: 'theta waves',
    hz: 'theta · 4–8 Hz',
    dreams: [
      'Faint fragments: hands, a door, rain on glass.',
      'You no longer notice the room.',
      'Sleep spindles stitch the thoughts together.',
    ],
  },
  n3: {
    title: 'N3 · deep sleep',
    waves: 'delta waves',
    hz: 'delta · 0.5–4 Hz',
    dreams: [
      'Almost no dreams. Only slow, heavy dark.',
      'The body repairs itself. Nothing moves.',
      'Deep water, no surface, no light.',
    ],
  },
  rem: {
    title: 'REM · dreaming',
    waves: 'fast mixed waves',
    hz: 'mixed · 4–30 Hz',
    dreams: [
      'You fly over a city made of glass.',
      'An endless staircase, and every step is a different room.',
      'The sea is inside the house.',
      'A familiar face with the wrong eyes.',
    ],
  },
  wake: {
    title: 'Waking up',
    waves: 'beta waves',
    hz: 'beta · 13–30 Hz',
    dreams: [
      'The dream melts away. You almost remember it.',
      'Light through the curtains. The world sharpens.',
      'A last image fades. You cannot say what it was.',
    ],
  },
}

// the night in minutes after 23:10: the clock flows between these points
const NIGHT_END = 470
const PHASE_MINUTES = {
  awake: 0,
  n1: 30,
  n2: 120,
  n3: 230,
  rem: 370,
  wake: 470,
}

// one-shot dream events (hover the pads)
const DREAM_EVENTS = {
  fall: 'You miss a step. The stairs end in the dark.',
  bell: 'Far away a bell rings in a house you do not know.',
  whisper: 'Someone behind you says your name.',
  jolt: 'You wake for a second, sure that you have fallen.',
  swell: 'The whole room breathes with you.',
}

const DREAM_LABELS = {
  fall: 'Fall · missed step',
  bell: 'Bell · far away',
  whisper: 'Whisper · behind you',
  jolt: 'Jolt · hypnic jerk',
  swell: 'Swell · room breath',
}

const WAVE_NAMES = {
  sine: 'sine',
  triangle: 'tri',
  square: 'sq',
  sawtooth: 'saw',
} // short names for the signal chain
const GLITCH_INTERVALS = [-12, -5, 5, 7, 12]
const DEFAULT_HINT = 'hover any control to see what it does'

const state = {}
const knobElements = {}
let audio = null
let step = 0
let glideId = 0
let nightTimers = []
let lastPhase = null
let lastDream = 0
let dreamNextTime = 0
let applyQueued = false
let night = null // { start } while Auto night is playing
let finaleActive = false
let finaleToken = 0
let brainHold = false
let clockMin = 0
let clockText = ''
let lastSample = 0
let hypnogramFrame = 0
let loggedPhase = null
const history = [] // [minute, level] points: the night recorded so far

Object.keys(PARAMS).forEach((id) => (state[id] = PARAMS[id].value))

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const pick = (list) => list[Math.floor(Math.random() * list.length)]
const $ = (id) => document.getElementById(id)

// ───────── Audio: voices, effect chains, channels ─────────
function createAudio() {
  // master: mix → reverb → filter → 45 Hz cut → limiter
  const limiter = new Tone.Limiter(-1).toDestination()
  const rumbleCut = new Tone.Filter(45, 'highpass').connect(limiter) // no sub-bass: speakers distort on it
  const masterFilter = new Tone.Filter(4000, 'lowpass').connect(rumbleCut)
  const reverb = new Tone.Reverb({ decay: 3, wet: 0.2 }).connect(masterFilter)
  const mix = new Tone.Gain(0).connect(reverb) // fades in at start: no pop

  // five separate channels
  const channels = {
    body: new Tone.Channel({ volume: -6, pan: -0.5 }).connect(mix),
    brain: new Tone.Channel({ volume: -12, pan: 0.5 }).connect(mix),
    pulse: new Tone.Channel({ volume: -10, pan: 0 }).connect(mix),
    noise: new Tone.Channel({ volume: -14, pan: 0 }).connect(mix),
    dream: new Tone.Channel({ volume: -9, pan: 0 }).connect(mix),
  }

  // voice 1 — BODY
  const bodySynth = new Tone.Synth({
    volume: -8,
    portamento: 0.25,
    oscillator: { type: 'sine' },
    envelope: { attack: 1, decay: 0.5, sustain: 0.8, release: 2 },
  })
  const bodyFilter = new Tone.Filter(600, 'lowpass')
  const bodyChorus = new Tone.Chorus(0.4, 3.5, 0.7).start()
  bodySynth.chain(bodyFilter, bodyChorus, channels.body)

  // voice 2 — BRAIN
  const brainSynth = new Tone.Synth({
    volume: -8,
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.5 },
  })
  const brainVibrato = new Tone.Vibrato(5, 0.1)
  const brainFilter = new Tone.Filter(3000, 'lowpass')
  const brainDelay = new Tone.PingPongDelay('8n.', 0.3)
  brainSynth.chain(brainVibrato, brainFilter, brainDelay, channels.brain)

  // heartbeat
  const heart = new Tone.MembraneSynth({
    volume: -6,
    pitchDecay: 0.05,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
  }).connect(channels.pulse)

  // breathing noise: the auto-filter opens and closes like lungs
  const noise = new Tone.Noise('pink')
  const breath = new Tone.AutoFilter({
    frequency: 0.2,
    baseFrequency: 200,
    octaves: 4,
  }).start()
  const noiseFilter = new Tone.Filter(1000, 'lowpass')
  noise.chain(breath, noiseFilter, channels.noise)
  noise.volume.value = -60
  noise.start()

  // dream events: one-shot bell/fall voice and a whisper noise
  const dreamSynth = new Tone.FMSynth({
    volume: -10,
    harmonicity: 3,
    modulationIndex: 6,
    envelope: { attack: 0.01, decay: 1.4, sustain: 0, release: 1.5 },
  }).connect(channels.dream)
  const whisperFilter = new Tone.Filter(3500, 'bandpass').connect(
    channels.dream,
  )
  const dreamNoise = new Tone.NoiseSynth({
    volume: -12,
    noise: { type: 'white' },
    envelope: { attack: 0.25, decay: 0.9, sustain: 0 },
  }).connect(whisperFilter)

  const dreamHeart = new Tone.MembraneSynth({
    volume: -6,
    pitchDecay: 0.05,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
  }).connect(channels.dream)

  const waveform = new Tone.Waveform(1024)
  limiter.connect(waveform)
  const preLimiter = new Tone.Waveform(256)
  rumbleCut.connect(preLimiter)

  audio = {
    limiter,
    mix,
    preLimiter,
    reverb,
    masterFilter,
    channels,
    waveform,
    heart,
    dreamHeart,
    dreamSynth,
    dreamNoise,
    bodyChorus,
    bodySynth,
    bodyFilter,
    brainSynth,
    brainVibrato,
    brainFilter,
    brainDelay,
    noise,
    breath,
    noiseFilter,
  }

  // the score: one step every eighth note, state is read live
  new Tone.Loop((time) => {
    // 32 steps = two phrases. The counter wraps around, so the motif never ends
    const i = step % 16
    const phrase = Math.floor(step / 16)
    step = (step + 1) % 32
    try {
      playStep(time, i, phrase)
    } catch (error) {
      console.warn(error)
    }
  }, '8n').start(0)

  new Tone.Loop((time) => {
    if (finaleActive) return
    try {
      heart.triggerAttackRelease('D2', '16n', time, 0.9)
      heart.triggerAttackRelease(
        'A1',
        '16n',
        time + 0.22 * (60 / state.pulse),
        0.5,
      )
    } catch (error) {
      console.warn(error)
    }
  }, '4n').start(0)

  mix.gain.rampTo(0.9, 0.8)
  applyState()
}

// how many steps until the next BODY note of a pattern (sparse patterns sustain longer)
function stepsToNext(pattern, i) {
  for (let d = 1; d <= 16; d++) if (pattern[(i + d) % 16]) return d
  return 16
}

// one step of the score. The material depends on the phase of sleep.
// The first BRAIN note of a phrase always sounds, so you can hear the motif return to the beginning
function playStep(time, i, phrase) {
  if (finaleActive) return
  const material = MATERIAL[currentPhase()]

  const bodyNote = material.body[i]
  if (bodyNote) {
    const gap = stepsToNext(material.body, i) * (30 / state.pulse) // seconds until the next BODY note
    audio.bodySynth.triggerAttackRelease(
      bodyNote,
      Math.min(1.5 + state.sleep * 6, gap * 0.95),
      time,
    )
    showNote('body', bodyNote, time)
  }
  if (brainHold) return // the intro of Auto night: BRAIN is silent for the first seconds

  let brainNote = material.brain[phrase][i]
  const glitching = Math.random() < state.rem * 0.6
  if (brainNote && (i === 0 || Math.random() < 0.2 + state.brain * 0.8)) {
    if (glitching)
      brainNote = Tone.Frequency(brainNote).transpose(pick(GLITCH_INTERVALS))
    audio.brainSynth.detune.value = glitching ? (Math.random() - 0.5) * 400 : 0
    audio.brainSynth.triggerAttackRelease(
      brainNote,
      0.05 + (1 - state.brain) * 0.25,
      time,
      0.3 + Math.random() * 0.5,
    )
    showNote('brain', brainNote, time)
  } else if (
    !brainNote &&
    state.rem > 0.6 &&
    Math.random() < state.rem * 0.35
  ) {
    // REM: extra notes fall into the silences
    const extra = pick(['C7', 'E6', 'Ab6', 'F#6'])
    audio.brainSynth.triggerAttackRelease(extra, 0.06, time, 0.25)
    showNote('brain', extra, time)
  }
}

// state → the values of the sound parameters (the signal chains on the panels show the same numbers)
function derive({ sleep, pulse, brain, depth, noise, rem, wake, drift, echo }) {
  return {
    bpm: pulse,
    masterFilter: 900 + (1 - sleep) * 3000 + wake * 14000,
    reverbWet: 0.15 + depth * 0.75,
    bodyFilter: 250 + (1 - sleep) * 900 + wake * 1500,
    bodyAttack: 1.4 - wake * 1.2,
    bodyChorusDepth: 0.2 + drift * 0.8,
    brainFilter: 1000 + brain * 4000 + wake * 4000,
    brainVibratoDepth: 0.1 + brain * 0.25 + rem * 0.5,
    brainVibratoRate: 4 + rem * 9,
    brainFeedback: 0.2 + rem * 0.5,
    brainDelayWet: echo * 0.8,
    noiseVolume: -60 + noise * 52,
    noiseFilter: 300 + (1 - sleep) * 2000 + wake * 5000,
    breathRate: pulse / 480,
  }
}

function applyState() {
  if (!audio) return
  const a = audio
  const d = derive(state)

  Tone.getTransport().bpm.rampTo(d.bpm, 0.3)
  a.masterFilter.frequency.rampTo(d.masterFilter, 0.3)
  a.reverb.wet.rampTo(d.reverbWet, 0.3)

  a.bodyFilter.frequency.rampTo(d.bodyFilter, 0.3)
  a.bodySynth.envelope.attack = d.bodyAttack
  a.bodyChorus.depth = d.bodyChorusDepth

  a.brainFilter.frequency.rampTo(d.brainFilter, 0.3)
  a.brainVibrato.depth.rampTo(d.brainVibratoDepth, 0.3)
  a.brainVibrato.frequency.rampTo(d.brainVibratoRate, 0.3)
  a.brainDelay.feedback.rampTo(d.brainFeedback, 0.3)
  a.brainDelay.wet.rampTo(d.brainDelayWet, 0.3)

  a.noise.volume.rampTo(d.noiseVolume, 0.3)
  a.noiseFilter.frequency.rampTo(d.noiseFilter, 0.3)
  a.breath.frequency.rampTo(d.breathRate, 0.3)
}

// the live numbers in the signal chains
function updateChains() {
  const d = derive(state)
  const text = (id, value) => ($(id).textContent = value)
  text('bodyFilterValue', `${Math.round(d.bodyFilter)} Hz`)
  text('bodyChorusValue', `${Math.round(d.bodyChorusDepth * 100)}%`)
  text('brainVibratoValue', `${Math.round(d.brainVibratoRate)} Hz`)
  text('brainFilterValue', `${(d.brainFilter / 1000).toFixed(1)} kHz`)
  text('brainDelayValue', `${Math.round(d.brainDelayWet * 100)}%`)
  text('masterReverbValue', `${Math.round(d.reverbWet * 100)}%`)
  text('masterFilterValue', `${(d.masterFilter / 1000).toFixed(1)} kHz`)
}

// restart a CSS animation that is triggered by a class
function restartAnimation(el, className) {
  el.classList.remove(className)
  void el.offsetWidth
  el.classList.add(className)
}

// the note a voice plays is shown at the moment it sounds, and a flash runs through the chain of the voice
function showNote(voice, note, time) {
  const name = typeof note === 'string' ? note : Tone.Frequency(note).toNote()
  Tone.getDraw().schedule(() => {
    const el = $(`${voice}Note`)
    el.textContent = name
    restartAnimation(el, 'is-new')
    restartAnimation($(`${voice}Chain`), 'is-flowing')
  }, time)
}

// ───────── Knobs ─────────
function renderKnob(id) {
  const p = PARAMS[id]
  const el = knobElements[id]
  const norm = (state[id] - p.min) / (p.max - p.min)
  el.querySelector('.Knob__dial').style.setProperty('--norm', norm)
  el.querySelector('.Knob__needle').style.transform =
    `rotate(${-135 + norm * 270}deg)`
  const shown = p.unit === '%' ? Math.round(norm * 100) : Math.round(state[id])
  el.querySelector('.Knob__value').textContent = shown + p.unit
}

function queueApply() {
  if (applyQueued) return
  applyQueued = true
  setTimeout(() => {
    applyQueued = false
    applyState()
  }, 50)
}

function setParam(id, value, fromGlide = false) {
  if (!fromGlide) glideId++
  state[id] = clamp(value, PARAMS[id].min, PARAMS[id].max)
  renderKnob(id)
  document.documentElement.style.setProperty('--sleep', state.sleep)
  document.documentElement.style.setProperty('--rem', state.rem)
  updatePhase()
  queueApply()
}

function createKnob(el) {
  const id = el.dataset.param
  const p = PARAMS[id]
  el.dataset.hint = `${p.label}: ${p.hint}`
  el.innerHTML = `
    <div class="Knob__dial"><div class="Knob__needle"></div></div>
    <div class="Knob__label">${p.label}</div>
    <div class="Knob__value"></div>`
  knobElements[id] = el

  let startY = 0
  let startValue = 0

  el.addEventListener('pointerdown', (e) => {
    startY = e.clientY
    startValue = state[id]
    el.setPointerCapture(e.pointerId)
    stopNight()
    setStageLabel('manual')
  })
  el.addEventListener('pointermove', (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return
    setParam(id, startValue + ((startY - e.clientY) / 160) * (p.max - p.min))
  })
  el.addEventListener('dblclick', () => setParam(id, p.value))
  renderKnob(id)
}

// smooth transition between scenes
function glideTo(target, seconds) {
  const id = ++glideId
  const from = { ...state }
  const start = performance.now()

  function frame(now) {
    if (id !== glideId) return
    const k = Math.min((now - start) / (seconds * 1000), 1)
    const eased = k * k * (3 - 2 * k)
    Object.keys(target).forEach((key) =>
      setParam(key, from[key] + (target[key] - from[key]) * eased, true),
    )
    if (k < 1) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

// ───────── Report: the knobs decide the phase, the phase decides the story ─────────
function currentPhase() {
  if (state.wake > 0.85) return 'wake'
  if (state.rem > 0.5) return 'rem'
  if (state.sleep > 0.8) return 'n3'
  if (state.sleep > 0.42) return 'n2'
  if (state.sleep > 0.2) return 'n1'
  return 'awake'
}

function showDream(text) {
  const el = $('dreamText')
  el.textContent = text
  restartAnimation(el, 'is-new')
}

function updatePhase() {
  const phase = currentPhase()
  const info = PHASES[phase]
  $('phaseMeta').textContent = `${info.waves} · ${Math.round(state.pulse)} bpm`
  $('pulseValue').textContent = Math.round(state.pulse)
  $('readout').textContent = `EEG · ${info.hz}`
  updateBands()
  updateChains()
  if (phase === lastPhase) return
  lastPhase = phase
  $('phaseName').textContent = info.title
  showDream(pick(info.dreams))
  // a phase is logged only when it lasts: the knobs pass through other phases while they glide
  const stamp = night ? formatClock(PHASE_MINUTES[phase]) : clockText // in Auto night: the time of the plan, as on the hypnogram
  if (audio) {
    setTimeout(() => {
      if (currentPhase() !== phase || loggedPhase === phase) return
      loggedPhase = phase
      logEvent(info.title, stamp)
    }, 1200)
  }
}

// ───────── EEG bands: which brain rhythm dominates in the current state ─────────
function bandLevels() {
  const { sleep, rem, brain, wake } = state
  const bump = (x, center, width) =>
    Math.max(0, 1 - Math.abs(x - center) / width)
  return {
    delta: clamp01(bump(sleep, 1, 0.45) * (1 - rem)),
    theta: clamp01(bump(sleep, 0.6, 0.35) * (1 - rem) + rem * 0.7),
    alpha: clamp01(bump(sleep, 0.3, 0.28) * (1 - rem)),
    beta: clamp01((1 - sleep) * (0.45 + 0.55 * brain) + rem * 0.8 + wake * 0.2),
  }
}

function updateBands() {
  const levels = bandLevels()
  document
    .querySelectorAll('.Band')
    .forEach((el) => el.style.setProperty('--level', levels[el.dataset.band]))
}

// ───────── Night log ─────────
function logEvent(text, stamp = clockText || '23:10') {
  const list = $('log')
  const item = document.createElement('li')
  item.className = 'Log__item is-new'
  const time = document.createElement('span')
  time.className = 'Log__time'
  time.textContent = stamp
  const label = document.createElement('span')
  label.textContent = text
  item.append(time, label)
  list.prepend(item)
  while (list.children.length > 5) list.lastChild.remove()
}

// ───────── The clock of the night and the hypnogram ─────────
const LEVELS = { wake: 0, awake: 0, rem: 1, n1: 2, n2: 3, n3: 4 } // rows of a real hypnogram
const PLAN = [
  [0, 0],
  [30, 2],
  [120, 3],
  [230, 4],
  [370, 1],
  [470, 0],
] // the ideal night: [minute, level]

// during Auto night the clock follows the plan exactly, otherwise it drifts to the time of the current phase
function nightClock(now) {
  const t = (now - night.start) / 1000
  let acc = 0
  for (let i = 0; i < NIGHT.length; i++) {
    const [name, seconds] = NIGHT[i]
    const next = NIGHT[i + 1]
    if (!next) return PHASE_MINUTES[name]
    if (t < acc + seconds)
      return (
        PHASE_MINUTES[name] +
        (PHASE_MINUTES[next[0]] - PHASE_MINUTES[name]) *
          clamp01((t - acc) / seconds)
      )
    acc += seconds
  }
  return NIGHT_END
}

function formatClock(minutes) {
  const total = (23 * 60 + 10 + Math.round(minutes)) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function tickClock(dt, now) {
  if (night) clockMin = nightClock(now)
  else
    clockMin +=
      (PHASE_MINUTES[currentPhase()] - clockMin) * Math.min(1, dt * 1.2)

  const text = formatClock(clockMin)
  if (text !== clockText) {
    clockText = text
    $('clock').textContent = text
  }

  if (audio && now - lastSample > 1000) {
    lastSample = now
    const last = history[history.length - 1]
    if (last && clockMin < last[0] - 5) history.length = 0 // time went backwards: a new night
    history.push([clockMin, LEVELS[currentPhase()]])
    if (history.length > 600) history.shift()
  }
}

function stepped(ctx, points, x, y) {
  points.forEach((point, i) => {
    if (i === 0) return ctx.moveTo(x(point[0]), y(point[1]))
    ctx.lineTo(x(point[0]), y(points[i - 1][1]))
    ctx.lineTo(x(point[0]), y(point[1]))
  })
}

function drawHypnogram() {
  const canvas = $('hypnogram')
  const ctx = canvas.getContext('2d')
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = Math.round(canvas.clientWidth * ratio)
  const height = Math.round(canvas.clientHeight * ratio)
  if (!width || !height) return
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  } else {
    ctx.clearRect(0, 0, width, height)
  }

  const left = 26 * ratio
  const right = width - 6 * ratio
  const top = 8 * ratio
  const bottom = height - 16 * ratio
  const x = (minute) => left + (minute / NIGHT_END) * (right - left)
  const y = (level) => top + (level / 4) * (bottom - top)

  ctx.font = `${9 * ratio}px 'IBM Plex Mono', monospace`
  ctx.fillStyle = 'rgba(13,56,54,0.7)'
  ctx.strokeStyle = 'rgba(13,56,54,0.15)'
  ctx.lineWidth = ratio
  ;['W', 'R', 'N1', 'N2', 'N3'].forEach((label, level) => {
    ctx.fillText(label, 0, y(level) + 3 * ratio)
    ctx.beginPath()
    ctx.moveTo(left, y(level))
    ctx.lineTo(right, y(level))
    ctx.stroke()
  })
  ;[
    [50, '00'],
    [170, '02'],
    [290, '04'],
    [410, '06'],
  ].forEach(([minute, label]) =>
    ctx.fillText(label, x(minute) - 5 * ratio, height - 3 * ratio),
  )

  // the planned night: dashed
  ctx.strokeStyle = 'rgba(13,56,54,0.5)'
  ctx.setLineDash([3 * ratio, 3 * ratio])
  ctx.beginPath()
  stepped(ctx, PLAN, x, y)
  ctx.stroke()
  ctx.setLineDash([])

  // the night so far: pink, with the marker at the current moment
  const level = LEVELS[currentPhase()]
  ctx.strokeStyle = '#e0558c'
  ctx.lineWidth = 2 * ratio
  ctx.beginPath()
  stepped(ctx, [...history, [clockMin, level]], x, y)
  ctx.stroke()
  ctx.fillStyle = '#ff8fb8'
  ctx.strokeStyle = '#0d3836'
  ctx.lineWidth = ratio
  ctx.beginPath()
  ctx.arc(x(clockMin), y(level), 4 * ratio, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

// ───────── Dream events ─────────
function triggerDream(name) {
  try {
    playDream(name)
  } catch (error) {
    console.warn(error)
  }
}

function playDream(name) {
  if (!audio) {
    $('hint').textContent = 'power on first: the lab is asleep'
    return
  }
  if (performance.now() - lastDream < 600) return
  lastDream = performance.now()

  const a = audio
  const t = Math.max(Tone.now(), dreamNextTime)
  dreamNextTime = t + 0.35
  if (name === 'fall') {
    a.dreamSynth.triggerAttackRelease(880, 1.4, t)
    a.dreamSynth.frequency.exponentialRampTo(110, 1.4, t)
  } else if (name === 'bell') {
    a.dreamSynth.triggerAttackRelease(pick(['D6', 'F6', 'A6']), '2n', t)
    a.dreamSynth.triggerAttackRelease(pick(['C7', 'E6', 'G6']), '2n', t + 0.3)
  } else if (name === 'whisper') {
    a.dreamNoise.triggerAttackRelease(0.9, t)
  } else if (name === 'jolt') {
    a.dreamHeart.triggerAttackRelease('D2', '8n', t, 1)
    a.dreamHeart.triggerAttackRelease('A1', '8n', t + 0.13, 1)
  } else if (name === 'swell') {
    a.noise.volume.rampTo(-12, 1.2)
    setTimeout(applyState, 1600)
  }

  showDream(DREAM_EVENTS[name])
  const pad = document.querySelector(`.Pad[data-dream="${name}"]`)
  pad.classList.add('is-playing')
  setTimeout(() => pad.classList.remove('is-playing'), 1100)
  logEvent(DREAM_LABELS[name])
  restartAnimation(document.querySelector('.Lab'), 'Lab--flash')
}

// ───────── Stages and the automatic night ─────────
function setStageLabel(name) {
  $('stageName').textContent = name
  document
    .querySelectorAll('.Stage')
    .forEach((b) => b.classList.toggle('is-active', b.dataset.stage === name))
}

async function goToStage(name, seconds = 5) {
  await ensureRunning()
  setStageLabel(name)
  glideTo(STAGES[name], seconds)
}

async function runNight() {
  await ensureRunning()
  stopNight()
  finaleToken++
  finaleActive = false
  history.length = 0
  clockMin = 0
  night = { start: performance.now() }
  brainHold = true // intro: only the body and the pulse for the first seconds
  nightTimers.push(setTimeout(() => (brainHold = false), 6000))
  $('nightButton').classList.add('is-active')
  logEvent('Auto night started')
  let delay = 0
  NIGHT.forEach(([name, seconds]) => {
    nightTimers.push(setTimeout(() => goToStage(name, 6), delay * 1000))
    delay += seconds
  })
  nightTimers.push(setTimeout(finale, delay * 1000))
}

function stopNight() {
  nightTimers.forEach(clearTimeout)
  nightTimers = []
  night = null
  brainHold = false
  $('nightButton').classList.remove('is-active')
}

// the end of the night: the motif is gone, a last chord of D major is played slowly, then silence
// the finale can be played by the button and by the F key, only while the instrument is running
function playFinale() {
  if (audio && !finaleActive) finale()
}

function finale() {
  stopNight()
  const token = ++finaleToken
  finaleActive = true
  logEvent('Night ended · subject awake')
  glideTo({ brain: 0, noise: 0, rem: 0, pulse: 60, echo: 0.6, depth: 0.8 }, 4)

  const a = audio
  const t = Tone.now() + 0.3
  a.brainSynth.detune.value = 0
  a.bodySynth.triggerAttackRelease('D3', 7, t)
  ;['A5', 'D6', 'F#6'].forEach((note, k) =>
    a.brainSynth.triggerAttackRelease(note, 2.5, t + 0.6 + k * 0.9, 0.5),
  )
  a.mix.gain.rampTo(0, 4.5, t + 4)

  setTimeout(() => {
    if (token !== finaleToken) return // a new night has started meanwhile
    Tone.getTransport().pause()
    finaleActive = false
    $('powerButton').textContent = 'Power on'
  }, 9500)
}

// ───────── Power ─────────
async function ensureRunning() {
  if (!audio) {
    Tone.setContext(
      new Tone.Context({ latencyHint: 'playback', lookAhead: 0.2 }),
    )
    await Tone.start()
    createAudio()
    setStageLabel('awake')
    logEvent('Experiment started')
  } else {
    audio.mix.gain.rampTo(0.9, 0.6)
  }
  Tone.getTransport().start()
  $('powerButton').textContent = 'Power off'
}

async function togglePower() {
  if (audio && Tone.getTransport().state === 'started') {
    Tone.getTransport().pause()
    $('powerButton').textContent = 'Power on'
  } else {
    await ensureRunning()
  }
}

// ───────── Recording: the sound of the instrument as a WAV file ─────────
let recorder = null
let recTimer = null
let recStart = 0

// WAV is understood by every editor (webm, which the browser records, is not opened by QuickTime or iMovie)
function encodeWav(buffer) {
  const channels = buffer.numberOfChannels
  const size = buffer.length * channels * 2 + 44
  const view = new DataView(new ArrayBuffer(size))
  const write = (offset, text) =>
    [...text].forEach((char, i) =>
      view.setUint8(offset + i, char.charCodeAt(0)),
    )
  write(0, 'RIFF')
  view.setUint32(4, size - 8, true)
  write(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * channels * 2, true)
  view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, size - 44, true)

  const data = Array.from({ length: channels }, (_, c) =>
    buffer.getChannelData(c),
  )
  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < channels; c++) {
      const v = clamp(data[c][i], -1, 1)
      view.setInt16(offset, v < 0 ? v * 0x8000 : v * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([view], { type: 'audio/wav' })
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

async function toggleRecording() {
  const button = $('recButton')
  if (recTimer) {
    // stop: decode what the browser recorded and save it as WAV
    clearInterval(recTimer)
    recTimer = null
    button.classList.remove('is-recording')
    button.textContent = 'Saving…'
    const recorded = await recorder.stop()
    const decoded = await Tone.getContext().rawContext.decodeAudioData(
      await recorded.arrayBuffer(),
    )
    const url = URL.createObjectURL(encodeWav(decoded))
    const name = `somnograph-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.wav`
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    button.textContent = 'Rec'
    logEvent(`Recording saved · ${name}`)
    return
  }

  await ensureRunning()
  if (!recorder) {
    recorder = new Tone.Recorder()
    audio.limiter.connect(recorder)
  }
  await recorder.start()
  recStart = performance.now()
  button.classList.add('is-recording')
  button.textContent = 'Stop 00:00'
  recTimer = setInterval(
    () =>
      (button.textContent = `Stop ${formatTime((performance.now() - recStart) / 1000)}`),
    500,
  )
  logEvent('Recording started')
}

// ───────── Waves and channels ─────────
function initWaves() {
  document.querySelectorAll('.Waves').forEach((group) => {
    group.addEventListener('click', (e) => {
      const button = e.target.closest('.Wave')
      if (!button) return
      group
        .querySelectorAll('.Wave')
        .forEach((b) => b.classList.toggle('is-active', b === button))
      $(`${group.dataset.voice}Wave`).textContent =
        WAVE_NAMES[button.dataset.wave]
      if (!audio) return
      const synth =
        group.dataset.voice === 'body' ? audio.bodySynth : audio.brainSynth
      synth.oscillator.type = button.dataset.wave
    })
  })
}

function createChannel(el) {
  const name = el.dataset.channel
  el.innerHTML = `
    <span class="Channel__name">${name}</span>
    <input class="Channel__fader" type="range" min="-40" max="0" step="1" />
    <button class="Channel__button" data-action="solo" data-hint="Solo: hear only this channel">Solo</button>
    <button class="Channel__button" data-action="mute" data-hint="Mute this channel">Mute</button>`
  const fader = el.querySelector('.Channel__fader')
  fader.value = { body: -6, brain: -12, pulse: -10, noise: -14, dream: -9 }[
    name
  ]
  fader.addEventListener(
    'input',
    () => audio && (audio.channels[name].volume.value = Number(fader.value)),
  )

  el.querySelectorAll('.Channel__button').forEach((button) =>
    button.addEventListener('click', () => {
      if (!audio) return
      const action = button.dataset.action
      audio.channels[name][action] = !audio.channels[name][action]
      button.classList.toggle('is-active', audio.channels[name][action])
    }),
  )
}

// ───────── Dream window: a halftone picture of the current phase + the live EEG line ─────────
// Every phase has its own small scene built from dots. The dots react to the sleep depth,
// brain activity, REM, the heartbeat and the sound level.
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const soft = (distance, radius) => clamp01((radius - distance) / 0.025)
const hash = (a, b = 0) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return v - Math.floor(v)
}

// Every scene is a small picture drawn with dots. X is 0..aspect, Y is 0..1 inside the picture,
// t is time in seconds; the result is the brightness 0..1. The scenes illustrate the dreams of the phase.
const SCENES = {
  // the to-do list scrolls on the left, the window of the lit room is on the right
  awake: (X, Y, t, A) => {
    const rowPosition = (Y + t * 0.04) * 9
    const row = Math.floor(rowPosition)
    const local = rowPosition - row
    if (X < A * 0.42) {
      if (local < 0.3 || local > 0.7) return 0.07
      if (X > 0.12 && X < 0.18) return 0.85 // the checkbox
      return X > 0.24 && X < 0.24 + 0.2 + 0.5 * hash(row) ? 0.6 : 0.07 // the line of text
    }
    const dx = Math.abs(X - A * 0.72)
    const dy = Math.abs(Y - 0.5)
    if (dx < 0.22 && dy < 0.38)
      return dx < 0.012 || dy < 0.012 ? 0.15 : 0.95 - 0.3 * Y
    return 0.1
  },
  // a corridor: rectangles come toward you, a door shines at the end
  n1: (X, Y, t, A) => {
    const n = Math.max(
      Math.abs(X - A * 0.5) / (A * 0.5),
      Math.abs(Y - 0.5) / 0.5,
    )
    if (n < 0.07) return 0.95
    const ring = Math.sqrt(n) * 5 - t * 0.2
    return ring - Math.floor(ring) < 0.14 ? 0.85 - n * 0.4 : 0.07
  },
  // rain on the glass, a faint door and a sleep spindle: a short burst of fast waves
  n2: (X, Y, t, A) => {
    const column = Math.floor(X * 22)
    const head = (t * (0.08 + 0.12 * hash(column)) + hash(column, 3)) % 1
    const behind = (((head - Y) % 1) + 1) % 1
    let v =
      behind < 0.16 && hash(column, 7) > 0.35
        ? 0.55 * (1 - behind / 0.16)
        : 0.05
    const doorX = Math.abs(X - A * 0.8)
    const doorY = Y - 0.55
    if (
      doorX < 0.13 &&
      doorY > -0.3 &&
      doorY < 0.45 &&
      (doorX > 0.115 || doorY < -0.285)
    )
      v = Math.max(v, 0.6)
    const burst = Math.exp(
      -Math.pow((X - A * 0.35 - Math.sin(t * 0.3) * 0.1) / 0.28, 2),
    )
    if (Math.abs(Y - (0.5 + 0.16 * burst * Math.sin(X * 55 - t * 7))) < 0.025)
      v = Math.max(v, 0.5 + 0.45 * burst)
    return v
  },
  // deep water without a surface and without light: one dim disc, bubbles rising
  n3: (X, Y, t, A) => {
    let v = 0.04 + 0.28 * soft(Math.hypot(X - A * 0.5, Y - 0.5), 0.34)
    const column = Math.floor(X * 26)
    if (hash(column, 11) > 0.9) {
      const y =
        1 - ((t * (0.03 + 0.05 * hash(column, 5)) + hash(column, 9)) % 1)
      if (Math.abs(Y - y) < 0.035) v = Math.max(v, 0.6)
    }
    return v
  },
  // a glass city, the sea inside it and a moon that sees double
  rem: (X, Y, t, A) => {
    const water = 0.7 + 0.025 * Math.sin(X * 9 + t * 2)
    const city = (y) => {
      const column = Math.floor(X * 20)
      const height =
        0.22 + 0.5 * hash(column) + 0.05 * Math.sin(t * 1.5 + column)
      return y > 1 - height ? 0.65 : 0.07
    }
    let v =
      Y < water
        ? city(Y)
        : Math.max(
            0.12,
            city(2 * water - Y) * 0.5 + 0.08 * Math.sin(X * 30 + t * 3),
          ) // below the water: the city reflected
    const wobble = 0.03 * Math.sin(t * 3)
    v = Math.max(v, soft(Math.hypot(X - A * 0.3, Y - 0.26), 0.09))
    return Math.max(
      v,
      soft(Math.hypot(X - A * 0.3 - 0.04 - wobble, Y - 0.28), 0.09) * 0.8,
    )
  },
  // light through the curtains: the sun rises between them
  wake: (X, Y, t, A) => {
    if (X < A * 0.2 || X > A * 0.8)
      return 0.3 + 0.25 * Math.sin(X * 38 + Math.sin(t * 0.5) * 0.6) // the folds of the curtains
    const cx = A * 0.5
    const cy = 0.66
    if (Y > cy) return 0.22 + 0.12 * Math.sin(X * 16 + t)
    const d = Math.hypot(X - cx, Y - cy)
    const ray =
      Math.pow(
        Math.max(0, Math.sin(Math.atan2(Y - cy, X - cx) * 14 + t * 0.4)),
        3,
      ) *
      Math.max(0, 1 - d * 0.9) *
      0.8
    return Math.max(soft(d, 0.2), ray, 0.08)
  },
}

const PICTURE = 0.66 // the scenes are composed in the upper part of the window and fade out softly under the caption

let sceneFrom = 'awake'
let sceneTo = 'awake'
let sceneFade = 1
let lastFrame = 0

function drawScope(now = performance.now()) {
  requestAnimationFrame(drawScope)
  if (document.hidden || now - lastFrame < 33) return // about 30 frames per second
  const dt = (now - lastFrame) / 1000
  lastFrame = now
  tickClock(dt, now)
  if (hypnogramFrame++ % 3 === 0) drawHypnogram()

  const canvas = $('scope')
  const ctx = canvas.getContext('2d')
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = Math.round(canvas.clientWidth * ratio)
  const height = Math.round(canvas.clientHeight * ratio)
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  } else {
    ctx.clearRect(0, 0, width, height)
  }

  const values = audio ? audio.waveform.getValue() : new Float32Array(1024)

  // level before the limiter: it turns red when the limiter has to work (the source of crackling)
  let level = 0
  if (audio) {
    let peak = 0
    audio.preLimiter
      .getValue()
      .forEach((v) => (peak = Math.max(peak, Math.abs(v))))
    const db = peak > 0 ? Math.round(20 * Math.log10(peak)) : -99
    $('level').textContent = `OUT ${db} dB`
    $('level').classList.toggle('is-hot', db > -3)
    level = Math.min(1, peak * 3)
  }

  // crossfade between the scenes when the phase changes
  const phase = currentPhase()
  if (phase !== sceneTo) {
    sceneFrom = sceneTo
    sceneTo = phase
    sceneFade = 0
  }
  sceneFade = Math.min(1, sceneFade + dt / 1.5)

  const t = now / 1000
  const aspect = width / (height * PICTURE) // the scenes are drawn in the upper part only
  const cell = (9 + state.sleep * 5) * ratio // deeper sleep = coarser, blurrier picture
  const cols = Math.ceil(width / cell)
  const rows = Math.ceil(height / cell)
  const visibility = 1 - state.sleep * 0.45
  const throb =
    1 + 0.12 * Math.max(0, Math.sin(t * Math.PI * 2 * (state.pulse / 60))) // one throb per heartbeat
  const color = state.rem > 0.5 ? '255,143,184' : '129,216,208'
  const bins = [new Path2D(), new Path2D(), new Path2D(), new Path2D()]

  for (let r = 0; r < rows; r++) {
    // REM glitch: some rows slip sideways
    const slip =
      state.rem > 0.3 && hash(r, Math.floor(t * 8)) > 0.93
        ? state.rem * 0.06 * aspect
        : 0
    for (let c = 0; c < cols; c++) {
      const X = ((c + 0.5) / cols) * aspect + slip
      const row = (r + 0.5) / rows
      const Y = row / PICTURE
      let v = SCENES[sceneTo](X, Y, t, aspect)
      if (sceneFade < 1)
        v = SCENES[sceneFrom](X, Y, t, aspect) * (1 - sceneFade) + v * sceneFade
      const fadeOut = clamp01((row - PICTURE * 0.7) / (1 - PICTURE * 0.7)) // the picture dims toward the caption, no hard edge
      v *= 1 - 0.88 * fadeOut * fadeOut * (3 - 2 * fadeOut)
      v += (hash(c, r + Math.floor(t * 6)) - 0.5) * 0.35 * state.brain // brain activity flickers the dots
      v = clamp01(v * visibility)
      if (v < 0.06) continue
      const radius = cell * 0.5 * (0.25 + 0.75 * v) * throb * (1 + level * 0.4)
      const x = (c + 0.5) * cell
      const y = (r + 0.5) * cell
      const bin = bins[Math.min(3, Math.floor(v * 4))]
      bin.moveTo(x + radius, y)
      bin.arc(x, y, radius, 0, Math.PI * 2)
    }
  }
  bins.forEach((bin, i) => {
    ctx.fillStyle = `rgba(${color},${0.3 + 0.23 * i})`
    ctx.fill(bin)
  })

  // EEG line: the real output of the instrument
  ctx.lineWidth = 1.5 * ratio
  ctx.strokeStyle = `rgb(${color})`
  ctx.beginPath()
  values.forEach((v, i) => {
    const x = (i / values.length) * width
    const y = height * 0.36 + v * height * 0.5
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.stroke()
}

// ───────── Hints and keyboard ─────────
function initHints() {
  $('hint').textContent = DEFAULT_HINT
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-hint]')
    $('hint').textContent = target ? target.dataset.hint : DEFAULT_HINT
  })
}

function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault()
      togglePower()
    }
    // F plays the finale at any moment: the motif stops, the last chord sounds, the instrument stops
    if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) playFinale()
    const index = Number(e.key) - 1
    if (STAGE_ORDER[index]) {
      stopNight()
      goToStage(STAGE_ORDER[index])
    }
  })
  document.addEventListener(
    'keyup',
    (e) => e.code === 'Space' && e.preventDefault(),
  )
}

// ───────── Start ─────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.Knob').forEach(createKnob)
  document.querySelectorAll('.Channel').forEach(createChannel)
  document.querySelectorAll('.Pad').forEach((pad) => {
    pad.addEventListener('mouseenter', () => triggerDream(pad.dataset.dream))
    pad.addEventListener('click', () => triggerDream(pad.dataset.dream))
  })
  updatePhase()
  initWaves()
  initHints()
  initKeyboard()

  $('powerButton').addEventListener('click', togglePower)
  $('recButton').addEventListener('click', toggleRecording)
  $('finaleButton').addEventListener('click', playFinale)
  logEvent('Subject 07 connected')
  logEvent('Ready · press Power on')
  $('nightButton').addEventListener('click', () =>
    $('nightButton').classList.contains('is-active') ? stopNight() : runNight(),
  )
  document.querySelectorAll('.Stage[data-stage]').forEach((button) =>
    button.addEventListener('click', () => {
      stopNight()
      goToStage(button.dataset.stage)
    }),
  )
  drawScope()
})
