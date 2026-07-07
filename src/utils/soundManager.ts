// Web Audio API-based Windows XP sound effects
let audioCtx: AudioContext | null = null;

let globalVolume = 75;
let isMuted = false;

export const getVolume = () => globalVolume;
export const setVolume = (vol: number) => {
  globalVolume = Math.max(0, Math.min(100, vol));
};
export const getMuted = () => isMuted;
export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
  }
  return audioCtx;
};

const tone = (
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  vol = 0.25,
  delay = 0
) => {
  if (isMuted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol * (globalVolume / 100), ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.05);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

export const sounds = {
  // Approximation of the Windows XP logon chord (E minor add9 arpeggio)
  logon() {
    tone(329.6, 1.2, 'sine', 0.1, 0.0); // E4
    tone(493.9, 1.2, 'sine', 0.08, 0.0); // B4
    tone(523.3, 1.6, 'sine', 0.1, 0.15); // C5
    tone(659.3, 1.6, 'sine', 0.1, 0.25); // E5
    tone(987.8, 2.0, 'sine', 0.1, 0.45); // B5
    tone(1046.5, 2.2, 'sine', 0.08, 0.6); // C6 sustain
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
    tone(880, 0.12, 'sine', 0.2, 0.0);
    tone(1175, 0.28, 'sine', 0.2, 0.1);
  },

  // Balloon / notification tray pop
  notify() {
    tone(1047, 0.08, 'sine', 0.15, 0.0);
    tone(1319, 0.18, 'sine', 0.15, 0.07);
  },

  // Soft window-open sweep
  windowOpen() {
    tone(523, 0.07, 'sine', 0.1, 0.0);
    tone(659, 0.07, 'sine', 0.1, 0.04);
    tone(784, 0.12, 'sine', 0.1, 0.08);
  },

  // QQ 经典敲门声：好友发来消息时的“咚咚”两声
  qqKnock() {
    tone(800, 0.04, 'sine', 0.12, 0.0);
    tone(600, 0.06, 'sine', 0.14, 0.12);
  },

  // QQ 消息提示音：清脆的“叮”
  qqMessage() {
    tone(1047, 0.05, 'triangle', 0.18, 0.0);
    tone(1319, 0.18, 'sine', 0.14, 0.04);
  },

  // QQ 上线提示音：上扬的“叮咚”
  qqOnline() {
    tone(880, 0.08, 'sine', 0.12, 0.0);
    tone(1175, 0.16, 'sine', 0.12, 0.08);
  },
};
