// Web Audio API-based Windows XP sound effects
let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const tone = (freq: number, dur: number, type: OscillatorType = 'sine', vol: number = 0.25, delay: number = 0) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.05);
  } catch (_) {}
};

export const sounds = {
  // Approximation of the Windows XP logon chord (E minor add9 arpeggio)
  logon() {
    tone(329.6, 1.2, 'sine', 0.10, 0.0);   // E4
    tone(493.9, 1.2, 'sine', 0.08, 0.0);   // B4
    tone(523.3, 1.6, 'sine', 0.10, 0.15);  // C5
    tone(659.3, 1.6, 'sine', 0.10, 0.25);  // E5
    tone(987.8, 2.0, 'sine', 0.10, 0.45);  // B5
    tone(1046.5, 2.2, 'sine', 0.08, 0.60); // C6 sustain
  },

  // Windows XP Critical Stop: two descending tones
  error() {
    tone(392, 0.18, 'square', 0.08, 0.0);
    tone(262, 0.28, 'square', 0.08, 0.16);
  },

  // Windows XP Ding: bell-like single tone
  ding() {
    tone(1047, 0.04, 'triangle', 0.35, 0.0);
    tone(1047, 0.55, 'sine', 0.18, 0.04);
    tone(1319, 0.25, 'sine', 0.06, 0.04);
  },

  // Windows XP Exclamation: ascending two-tone
  exclamation() {
    tone(880, 0.12, 'sine', 0.20, 0.0);
    tone(1175, 0.28, 'sine', 0.20, 0.10);
  },

  // Balloon / notification tray pop
  notify() {
    tone(1047, 0.08, 'sine', 0.15, 0.0);
    tone(1319, 0.18, 'sine', 0.15, 0.07);
  },

  // Soft window-open sweep
  windowOpen() {
    tone(523, 0.07, 'sine', 0.10, 0.0);
    tone(659, 0.07, 'sine', 0.10, 0.04);
    tone(784, 0.12, 'sine', 0.10, 0.08);
  },
};
