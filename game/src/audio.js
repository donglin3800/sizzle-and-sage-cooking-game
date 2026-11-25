// Sizzle & Sage — sound: every effect is synthesised with WebAudio, so the
// game ships no audio files and makes no network request. Sound starts only
// after the player's first gesture, as browsers require.

let context = null;
let master = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A short bass line that walks under the lunch rush. Called once per beat.
const BASS_LINE = [55, 0, 65.41, 0, 49, 0, 58.27, 0, 55, 0, 65.41, 0, 73.42, 65.41, 58.27, 49];

function ensureContext() {
  if (context) return true;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return false;
  context = new AudioContext();
  master = context.createGain();
  master.gain.value = 0.5;
  master.connect(context.destination);
  return true;
}

export function unlockAudio() {
  if (!ensureContext()) return;
  if (context.state === 'suspended') void context.resume();
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, seconds, type, volume, when = 0) {
  if (!context || muted) return;
  const start = context.currentTime + when;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

function noise(seconds, volume, filterFreq, when = 0) {
  if (!context || muted) return;
  const start = context.currentTime + when;
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(start);
}

// The knife thock when a chop lands, and a softer tick while chopping.
export function playChop(done) {
  if (!ensureContext()) return;
  if (done) {
    noise(0.09, 0.5, 900);
    tone(180, 0.08, 'triangle', 0.25);
  } else {
    noise(0.05, 0.25, 1400);
  }
}

// The grill's sizzle: a burst of filtered noise when a patty goes on.
export function playSizzle() {
  if (!ensureContext()) return;
  noise(0.5, 0.22, 3200);
  noise(0.4, 0.12, 5200, 0.08);
}

// A bright two-note ding when a dish is served, higher when the tip is big.
export function playServe(tip) {
  if (!ensureContext()) return;
  tone(660, 0.14, 'sine', 0.3);
  tone(tip > 0 ? 990 : 784, 0.22, 'sine', 0.3, 0.1);
}

// A low buzz for a wrong serve or a burnt patty.
export function playError() {
  if (!ensureContext()) return;
  tone(140, 0.22, 'sawtooth', 0.18);
  tone(110, 0.26, 'sawtooth', 0.15, 0.08);
}

// A rising arpeggio when a new order lands on the board.
export function playOrder() {
  if (!ensureContext()) return;
  tone(523, 0.1, 'triangle', 0.2);
  tone(659, 0.1, 'triangle', 0.2, 0.09);
  tone(784, 0.16, 'triangle', 0.2, 0.18);
}

// The rush bell: three quick chimes when the last thirty seconds begin.
export function playRush() {
  if (!ensureContext()) return;
  tone(880, 0.12, 'square', 0.12);
  tone(880, 0.12, 'square', 0.12, 0.16);
  tone(1174, 0.24, 'square', 0.12, 0.32);
}

// A soft pickup blip when an ingredient is taken.
export function playPickup() {
  if (!ensureContext()) return;
  tone(440, 0.07, 'sine', 0.2);
}

export function startMusic() {
  if (!ensureContext() || musicTimer) return;
  musicTimer = window.setInterval(() => {
    if (muted) return;
    const note = BASS_LINE[musicStep % BASS_LINE.length];
    musicStep += 1;
    if (note) tone(note, 0.42, 'triangle', 0.14);
    if (musicStep % 4 === 1) noise(0.03, 0.06, 6000);
  }, 300);
}

export function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = null;
}
