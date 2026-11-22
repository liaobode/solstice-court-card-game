// Solstice Court — Procedural Web Audio synthesizer (zero external audio files).

let audioCtx = null;
let isMuted = false;

function ensureAudio() {
  if (isMuted) return null;
  if (!audioCtx && typeof window !== 'undefined') {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioCtx = new Ctor();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setMuted(muted) {
  isMuted = Boolean(muted);
}

function playTone(freq, duration, type = 'triangle', gainPeak = 0.14, delay = 0) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playCardSlide() {
  playTone(260, 0.08, 'sine', 0.08);
  playTone(390, 0.07, 'triangle', 0.06, 0.03);
}

export function playCardSnap(suit) {
  const base = { solar: 440, lunar: 523, verdant: 392, imperial: 330 }[suit] ?? 440;
  playTone(base, 0.14, 'triangle', 0.14);
  playTone(base * 1.5, 0.12, 'sine', 0.08, 0.04);
}

export function playComboChime() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => playTone(n, 0.28, 'triangle', 0.12, i * 0.06));
}

export function playShieldClang() {
  playTone(620, 0.18, 'sine', 0.12);
  playTone(930, 0.16, 'triangle', 0.08, 0.02);
}

export function playVictoryFanfare() {
  const chord = [392.0, 493.88, 587.33, 783.99, 987.77];
  chord.forEach((n, i) => playTone(n, 0.55, 'triangle', 0.12, i * 0.08));
}

export function playDefeatChord() {
  const chord = [293.66, 261.63, 220.0, 174.61];
  chord.forEach((n, i) => playTone(n, 0.5, 'sawtooth', 0.06, i * 0.1));
}
