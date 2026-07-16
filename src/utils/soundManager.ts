// Sound facade (mechanism layer). The engine binds NO audio assets (#213 /
// #143): sample URLs arrive at runtime via registerSounds — the XP theme's
// scheme is registered by AppProviders (src/themes/xp/sounds.ts), app sounds
// (QQ) self-register from their own package. Names stay stable; a future theme
// swaps the scheme without touching this file.

let audioCtx: AudioContext | null = null;

/** Runtime name → sample-URL registry (theme scheme + app sounds). */
const sampleRegistry: Record<string, string> = {};

/**
 * Register (or override) named sound samples. Later registrations win, so a
 * host can replace individual sounds; unknown names simply no-op on play.
 */
export const registerSounds = (map: Record<string, string>) => {
  Object.assign(sampleRegistry, map);
};

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

const tone = (freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, delay = 0) => {
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

const audioCache: Record<string, HTMLAudioElement> = {};

const playNamed = (name: string) => {
  const url = sampleRegistry[name];
  if (url) playSample(url);
};

const playSample = (url: string) => {
  if (isMuted) return;
  if (!audioCache[url]) {
    audioCache[url] = new Audio(url);
  }
  const audio = audioCache[url];
  audio.volume = globalVolume / 100;
  audio.currentTime = 0;
  const playPromise = audio.play?.();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(error => {
      console.warn('Sample playback failed:', error);
    });
  }
};

export const sounds = {
  startup() {
    playNamed('startup');
  },
  shutdown() {
    playNamed('shutdown');
  },
  logon() {
    playNamed('logon');
  },
  logoff() {
    playNamed('logoff');
  },
  criticalStop() {
    playNamed('criticalStop');
  },
  error() {
    playNamed('error');
  },
  ding() {
    playNamed('ding');
  },
  exclamation() {
    playNamed('exclamation');
  },
  notify() {
    playNamed('notify');
  },
  menuCommand() {
    playNamed('menuCommand');
  },
  minimize() {
    playNamed('minimize');
  },
  restore() {
    playNamed('restore');
  },
  recycle() {
    playNamed('recycle');
  },

  // Window-open sweep (no authentic XP sample; keep synthesized)
  windowOpen() {
    tone(523, 0.07, 'sine', 0.1, 0.0);
    tone(659, 0.07, 'sine', 0.1, 0.04);
    tone(784, 0.12, 'sine', 0.1, 0.08);
  },

  // Classic QQ knock sound
  qqKnock() {
    tone(800, 0.04, 'sine', 0.12, 0.0);
    tone(600, 0.06, 'sine', 0.14, 0.12);
  },

  // QQ notification sounds — registered by src/apps/QQ/sounds.ts (app package).
  qqMessage() {
    playNamed('qqMessage');
  },
  qqOnline() {
    playNamed('qqOnline');
  },
  qqSystem() {
    playNamed('qqSystem');
  },
};

/** Play a named system sound by key (used by the imperative XPHandle). */
export const playSound = (name: keyof typeof sounds) => {
  sounds[name]?.();
};

/**
 * Play a custom audio file by URL, honoring the global volume + mute state
 * (#139 branded startup sound). No-ops when muted.
 */
export const playCustomSound = (url: string) => {
  if (url) playSample(url);
};
