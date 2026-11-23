// audio.js — tiny WebAudio synth for engine hum, sirens, shots and pickups.
// No audio files: every sound is an oscillator, so the game stays offline.
let ctx = null;
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
  return ctx;
}
export function ensureAudio() { ac(); }
function tone(freq, dur, type = 'sine', gain = 0.12, slide = 0) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}
export const sfx = {
  start: () => tone(220, 0.5, 'triangle', 0.14, 220),
  pickup: () => { tone(660, 0.12, 'sine', 0.12); setTimeout(() => tone(880, 0.18, 'sine', 0.12), 90); },
  shoot: () => tone(180, 0.14, 'square', 0.16, -120),
  siren: () => { tone(700, 0.4, 'sine', 0.05, 300); setTimeout(() => tone(1000, 0.4, 'sine', 0.05, -300), 420); },
  crash: () => tone(90, 0.3, 'sawtooth', 0.18, -40),
  mission: () => { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.13), i * 120)); },
};
// A low engine hum that follows speed; call every frame with 0..1.
let engineOsc = null, engineGain = null;
export function engineHum(level) {
  const c = ac(); if (!c) return;
  if (!engineOsc) {
    engineOsc = c.createOscillator(); engineGain = c.createGain();
    engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 60;
    engineGain.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    engineOsc.connect(lp).connect(engineGain).connect(c.destination);
    engineOsc.start();
  }
  engineOsc.frequency.value = 55 + level * 120;
  engineGain.gain.value = level * 0.05;
}
