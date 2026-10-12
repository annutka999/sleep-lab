// ============================================================
// SLEEP LAB — dream laboratory synthesizer
// BODY (low, slow) + BRAIN (high, unstable), steered by 9 knobs
// ============================================================

// ───────── Knobs ─────────
const PARAMS = {
  sleep: { label: 'Sleep', min: 0, max: 1, value: 0.1, unit: '%', hint: 'depth of sleep: darker, quieter, slower' },
  pulse: { label: 'Pulse', min: 40, max: 110, value: 90, unit: ' bpm', hint: 'heart rate = the tempo of the whole night' },
  brain: { label: 'Brain', min: 0, max: 1, value: 0.8, unit: '%', hint: 'how many brain notes survive from the motif' },
  depth: { label: 'Depth', min: 0, max: 1, value: 0.2, unit: '%', hint: 'dream space: bigger reverb, darker body' },
  noise: { label: 'Noise', min: 0, max: 1, value: 0.1, unit: '%', hint: 'breathing noise of the room' },
  rem: { label: 'REM', min: 0, max: 1, value: 0, unit: '%', hint: 'rapid eye movement: glitching pitch and echoes' },
  wake: { label: 'Wake', min: 0, max: 1, value: 0.8, unit: '%', hint: 'opens the filters: brighter, sharper, awake' },
  drift: { label: 'Drift', min: 0, max: 1, value: 0.3, unit: '%', hint: 'body wobble: slow chorus, the pitch floats' },
  echo: { label: 'Echo', min: 0, max: 1, value: 0.3, unit: '%', hint: 'brain echoes bouncing between the ears' }
}

// ───────── Stages of the night: scenes of knob values ─────────
const STAGES = {
  awake: { sleep: 0.1, pulse: 96, brain: 0.9, depth: 0.2, noise: 0.1, rem: 0, wake: 0.55, drift: 0.1, echo: 0.15 },
  n1: { sleep: 0.3, pulse: 80, brain: 0.6, depth: 0.4, noise: 0.25, rem: 0, wake: 0.3, drift: 0.3, echo: 0.3 },
  n2: { sleep: 0.55, pulse: 66, brain: 0.4, depth: 0.6, noise: 0.35, rem: 0, wake: 0.1, drift: 0.5, echo: 0.4 },
  n3: { sleep: 0.95, pulse: 46, brain: 0.12, depth: 0.95, noise: 0.5, rem: 0, wake: 0, drift: 0.8, echo: 0.6 },
  rem: { sleep: 0.6, pulse: 88, brain: 1, depth: 0.7, noise: 0.2, rem: 1, wake: 0, drift: 0.6, echo: 0.9 },
  wake: { sleep: 0.05, pulse: 104, brain: 0.8, depth: 0.15, noise: 0.05, rem: 0.1, wake: 1, drift: 0.1, echo: 0.1 }
}
const STAGE_ORDER = Object.keys(STAGES)

// [stage, seconds before the next one]
const NIGHT = [['awake', 10], ['n1', 18], ['n2', 22], ['n3', 28], ['rem', 28], ['wake', 16]]

// ───────── The motif: 16 steps, two phrases ─────────
const BODY_MOTIF = ['D2', null, null, null, 'A1', null, null, null, 'Bb1', null, null, null, 'F2', null, null, null]
const BRAIN_MOTIF = [
  ['F5', null, 'A5', 'G5', null, 'E5', 'D6', null, 'F5', 'C6', null, 'A5', null, 'E5', 'C#6', null],
  ['A5', null, 'F5', 'E5', null, 'G5', 'D6', null, 'F5', null, 'A5', 'C6', null, 'E5', 'D6', null]
]
// ───────── Report: phase of sleep, brain waves, what the subject sees ─────────
const PHASES = {
  awake: { title: 'Awake', waves: 'beta waves', hz: 'beta · 13–30 Hz', time: '23:10', dreams: ['The lights are still on. Thoughts run faster than you can follow.', 'You replay the conversations of the day.', 'A to-do list scrolls behind your eyes.'] },
  n1: { title: 'N1 · falling asleep', waves: 'alpha waves', hz: 'alpha · 8–13 Hz', time: '23:40', dreams: ['Shapes drift in: a corridor, a window, a half-heard voice.', 'Your body feels heavy and far away.', 'A thought slips and turns into an image.'] },
  n2: { title: 'N2 · light sleep', waves: 'theta waves', hz: 'theta · 4–8 Hz', time: '01:10', dreams: ['Faint fragments: hands, a door, rain on glass.', 'You no longer notice the room.', 'Sleep spindles stitch the thoughts together.'] },
  n3: { title: 'N3 · deep sleep', waves: 'delta waves', hz: 'delta · 0.5–4 Hz', time: '03:00', dreams: ['Almost no dreams. Only slow, heavy dark.', 'The body repairs itself. Nothing moves.', 'Deep water, no surface, no light.'] },
  rem: { title: 'REM · dreaming', waves: 'fast mixed waves', hz: 'mixed · 4–30 Hz', time: '05:20', dreams: ['You fly over a city made of glass.', 'An endless staircase, and every step is a different room.', 'The sea is inside the house.', 'A familiar face with the wrong eyes.'] },
  wake: { title: 'Waking up', waves: 'beta waves', hz: 'beta · 13–30 Hz', time: '07:00', dreams: ['The dream melts away. You almost remember it.', 'Light through the curtains. The world sharpens.', 'A last image fades. You cannot say what it was.'] }
}

// one-shot dream events (hover the pads)
const DREAM_EVENTS = {
  fall: 'You miss a step. The stairs end in the dark.',
  bell: 'Far away a bell rings in a house you do not know.',
  whisper: 'Someone behind you says your name.',
  jolt: 'You wake for a second, sure that you have fallen.',
  swell: 'The whole room breathes with you.'
}

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
    dream: new Tone.Channel({ volume: -9, pan: 0 }).connect(mix)
  }

  // voice 1 — BODY
  const bodySynth = new Tone.Synth({
    volume: -8,
    portamento: 0.25,
    oscillator: { type: 'sine' },
    envelope: { attack: 1, decay: 0.5, sustain: 0.8, release: 2 }
  })
  const bodyFilter = new Tone.Filter(600, 'lowpass')
  const bodyChorus = new Tone.Chorus(0.4, 3.5, 0.7).start()
  bodySynth.chain(bodyFilter, bodyChorus, channels.body)

  // voice 2 — BRAIN
  const brainSynth = new Tone.Synth({
    volume: -8,
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.5 }
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
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 }
  }).connect(channels.pulse)

  // breathing noise: the auto-filter opens and closes like lungs
  const noise = new Tone.Noise('pink')
  const breath = new Tone.AutoFilter({ frequency: 0.2, baseFrequency: 200, octaves: 4 }).start()
  const noiseFilter = new Tone.Filter(1000, 'lowpass')
  noise.chain(breath, noiseFilter, channels.noise)
  noise.volume.value = -60
  noise.start()

  // dream events: one-shot bell/fall voice and a whisper noise
  const dreamSynth = new Tone.FMSynth({
    volume: -10,
    harmonicity: 3,
    modulationIndex: 6,
    envelope: { attack: 0.01, decay: 1.4, sustain: 0, release: 1.5 }
  }).connect(channels.dream)
  const whisperFilter = new Tone.Filter(3500, 'bandpass').connect(channels.dream)
  const dreamNoise = new Tone.NoiseSynth({
    volume: -12,
    noise: { type: 'white' },
    envelope: { attack: 0.25, decay: 0.9, sustain: 0 }
  }).connect(whisperFilter)

  const dreamHeart = new Tone.MembraneSynth({
    volume: -6,
    pitchDecay: 0.05,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 }
  }).connect(channels.dream)

  const waveform = new Tone.Waveform(1024)
  limiter.connect(waveform)
  const preLimiter = new Tone.Waveform(256)
  rumbleCut.connect(preLimiter)

  audio = { preLimiter, reverb, masterFilter, channels, waveform, heart, dreamHeart, dreamSynth, dreamNoise, bodyChorus, bodySynth, bodyFilter, brainSynth, brainVibrato, brainFilter, brainDelay, noise, breath, noiseFilter }

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
    try {
      heart.triggerAttackRelease('D2', '16n', time, 0.9)
      heart.triggerAttackRelease('A1', '16n', time + 0.22 * (60 / state.pulse), 0.5)
    } catch (error) {
      console.warn(error)
    }
  }, '4n').start(0)

  mix.gain.rampTo(0.9, 0.8)
  applyState()
}

// one step of the score: BODY and BRAIN motifs. The first BRAIN note of a phrase always sounds,
// so you can hear the motif return to the beginning
function playStep(time, i, phrase) {
  const bodyNote = BODY_MOTIF[i]
  if (bodyNote) {
    audio.bodySynth.triggerAttackRelease(bodyNote, Math.min(1.5 + state.sleep * 3, (120 / state.pulse) * 0.9), time)
  }

  let brainNote = BRAIN_MOTIF[phrase][i]
  const glitching = Math.random() < state.rem * 0.6
  if (brainNote && (i === 0 || Math.random() < 0.2 + state.brain * 0.8)) {
    if (glitching) brainNote = Tone.Frequency(brainNote).transpose(pick(GLITCH_INTERVALS))
    audio.brainSynth.detune.value = glitching ? (Math.random() - 0.5) * 400 : 0
    audio.brainSynth.triggerAttackRelease(brainNote, 0.05 + (1 - state.brain) * 0.25, time, 0.3 + Math.random() * 0.5)
  } else if (!brainNote && state.rem > 0.6 && Math.random() < state.rem * 0.35) {
    // REM: extra notes fall into the silences
    audio.brainSynth.triggerAttackRelease(pick(['C7', 'E6', 'A6', 'G6']), 0.06, time, 0.25)
  }
}

// state → audio parameters
function applyState() {
  if (!audio) return
  const { sleep, pulse, brain, depth, noise, rem, wake, drift, echo } = state
  const a = audio

  Tone.getTransport().bpm.rampTo(pulse, 0.3)
  a.masterFilter.frequency.rampTo(900 + (1 - sleep) * 3000 + wake * 14000, 0.3)
  a.reverb.wet.rampTo(0.15 + depth * 0.75, 0.3)

  a.bodyFilter.frequency.rampTo(250 + (1 - sleep) * 900 + wake * 1500, 0.3)
  a.bodySynth.envelope.attack = 1.4 - wake * 1.2

  a.brainFilter.frequency.rampTo(1000 + brain * 4000 + wake * 4000, 0.3)
  a.brainVibrato.depth.rampTo(0.1 + brain * 0.25 + rem * 0.5, 0.3)
  a.brainVibrato.frequency.rampTo(4 + rem * 9, 0.3)
  a.brainDelay.feedback.rampTo(0.2 + rem * 0.5, 0.3)

  a.noise.volume.rampTo(-60 + noise * 52, 0.3)
  a.noiseFilter.frequency.rampTo(300 + (1 - sleep) * 2000 + wake * 5000, 0.3)
  a.breath.frequency.rampTo(pulse / 480, 0.3)
  a.bodyChorus.depth = 0.2 + drift * 0.8
  a.brainDelay.wet.rampTo(echo * 0.8, 0.3)
}

// ───────── Knobs ─────────
function renderKnob(id) {
  const p = PARAMS[id]
  const el = knobElements[id]
  const norm = (state[id] - p.min) / (p.max - p.min)
  el.querySelector('.Knob__dial').style.setProperty('--norm', norm)
  el.querySelector('.Knob__needle').style.transform = `rotate(${-135 + norm * 270}deg)`
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
    Object.keys(target).forEach((key) => setParam(key, from[key] + (target[key] - from[key]) * eased, true))
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
  el.classList.remove('is-new')
  void el.offsetWidth
  el.classList.add('is-new')
}

function updatePhase() {
  const phase = currentPhase()
  const info = PHASES[phase]
  $('phaseMeta').textContent = `${info.waves} · ${Math.round(state.pulse)} bpm`
  $('readout').textContent = `EEG · ${info.hz}`
  if (phase === lastPhase) return
  lastPhase = phase
  $('phaseName').textContent = info.title
  $('clock').textContent = info.time
  showDream(pick(info.dreams))
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
  const lab = document.querySelector('.Lab')
  lab.classList.remove('Lab--flash')
  void lab.offsetWidth
  lab.classList.add('Lab--flash')
}

// ───────── Stages and the automatic night ─────────
function setStageLabel(name) {
  $('stageName').textContent = name
  document.querySelectorAll('.Stage').forEach((b) => b.classList.toggle('is-active', b.dataset.stage === name))
}

async function goToStage(name, seconds = 5) {
  await ensureRunning()
  setStageLabel(name)
  glideTo(STAGES[name], seconds)
}

async function runNight() {
  await ensureRunning()
  stopNight()
  $('nightButton').classList.add('is-active')
  let delay = 0
  NIGHT.forEach(([name, seconds]) => {
    nightTimers.push(setTimeout(() => goToStage(name, 6), delay * 1000))
    delay += seconds
  })
  nightTimers.push(setTimeout(stopNight, delay * 1000))
}

function stopNight() {
  nightTimers.forEach(clearTimeout)
  nightTimers = []
  $('nightButton').classList.remove('is-active')
}

// ───────── Power ─────────
async function ensureRunning() {
  if (!audio) {
    Tone.setContext(new Tone.Context({ latencyHint: 'playback', lookAhead: 0.2 }))
    await Tone.start()
    createAudio()
    setStageLabel('awake')
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

// ───────── Waves and channels ─────────
function initWaves() {
  document.querySelectorAll('.Waves').forEach((group) => {
    group.addEventListener('click', (e) => {
      const button = e.target.closest('.Wave')
      if (!button) return
      group.querySelectorAll('.Wave').forEach((b) => b.classList.toggle('is-active', b === button))
      if (!audio) return
      const synth = group.dataset.voice === 'body' ? audio.bodySynth : audio.brainSynth
      synth.oscillator.type = button.dataset.wave
    })
  })
}

function createChannel(el) {
  const name = el.dataset.channel
  el.innerHTML = `
    <span class="Channel__name">${name}</span>
    <input class="Channel__fader" type="range" min="-40" max="0" step="1" />
    <button class="Channel__button" data-action="solo" data-hint="Solo: hear only this channel">S</button>
    <button class="Channel__button" data-action="mute" data-hint="Mute this channel">M</button>`
  const fader = el.querySelector('.Channel__fader')
  fader.value = { body: -6, brain: -12, pulse: -10, noise: -14, dream: -9 }[name]
  fader.addEventListener('input', () => audio && (audio.channels[name].volume.value = Number(fader.value)))

  el.querySelectorAll('.Channel__button').forEach((button) =>
    button.addEventListener('click', () => {
      if (!audio) return
      const action = button.dataset.action
      audio.channels[name][action] = !audio.channels[name][action]
      button.classList.toggle('is-active', audio.channels[name][action])
    })
  )
}

// ───────── EEG scope ─────────
function drawScope() {
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

  // level before the limiter: it turns pink when the limiter has to work (the source of crackling)
  if (audio) {
    let peak = 0
    audio.preLimiter.getValue().forEach((v) => (peak = Math.max(peak, Math.abs(v))))
    const db = peak > 0 ? Math.round(20 * Math.log10(peak)) : -99
    $('level').textContent = `OUT ${db} dB`
    $('level').classList.toggle('is-hot', db > -3)
  }

  ctx.lineWidth = 2 * ratio
  ctx.strokeStyle = state.rem > 0.5 ? '#ff8fb8' : '#81d8d0'
  ctx.shadowBlur = 12 * ratio
  ctx.shadowColor = ctx.strokeStyle
  ctx.beginPath()
  values.forEach((v, i) => {
    const x = (i / values.length) * canvas.width
    const y = canvas.height / 2 + v * canvas.height * 1.4
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.stroke()
  requestAnimationFrame(drawScope)
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
    const index = Number(e.key) - 1
    if (STAGE_ORDER[index]) {
      stopNight()
      goToStage(STAGE_ORDER[index])
    }
  })
  document.addEventListener('keyup', (e) => e.code === 'Space' && e.preventDefault())
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
  $('nightButton').addEventListener('click', () => ($('nightButton').classList.contains('is-active') ? stopNight() : runNight()))
  document.querySelectorAll('.Stage').forEach((button) =>
    button.addEventListener('click', () => {
      stopNight()
      goToStage(button.dataset.stage)
    })
  )
  drawScope()
})
