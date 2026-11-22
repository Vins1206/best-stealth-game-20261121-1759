// audio.js — tiny WebAudio sounds made in code, no audio files.
//
// Footsteps tick while anyone walks near the thief, a soft chime marks a
// relic, a rising sting marks rising suspicion, and two flat tones close
// the night: one for an escape, one for a capture. Everything is an
// oscillator and a gain envelope, created lazily on the first input so a
// browser never blocks it.

export function createAudio() {
  let context = null;
  let stepTimer = 0;

  function ensureContext() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    context = new AudioCtor();
    return context;
  }

  function tone(freqStart, freqEnd, seconds, volume, type) {
    const ctx = ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  return {
    unlock() {
      ensureContext();
    },
    footstep(sneaking, loudness) {
      stepTimer -= 1;
      if (stepTimer > 0) return;
      stepTimer = sneaking ? 26 : 15;
      tone(sneaking ? 180 : 130, 70, 0.07, 0.05 * loudness, 'triangle');
    },
    guardStep(loudness) {
      tone(95, 60, 0.08, 0.04 * loudness, 'square');
    },
    pebble() {
      tone(880, 420, 0.12, 0.10, 'sine');
      setTimeout(() => tone(660, 330, 0.10, 0.08, 'sine'), 70);
    },
    relic() {
      tone(740, 1180, 0.22, 0.12, 'sine');
    },
    suspicious() {
      tone(320, 520, 0.16, 0.09, 'sawtooth');
    },
    alarm() {
      tone(520, 940, 0.30, 0.14, 'sawtooth');
    },
    escaped() {
      tone(523, 523, 0.16, 0.12, 'sine');
      setTimeout(() => tone(659, 659, 0.16, 0.12, 'sine'), 140);
      setTimeout(() => tone(784, 1046, 0.34, 0.12, 'sine'), 280);
    },
    caught() {
      tone(220, 55, 0.55, 0.16, 'sawtooth');
    },
  };
}
