// Windows XP sound effects: authentic WAV samples with Web Audio API fallback
import startupUrl from '../assets/audio/xp/startup.wav';
import shutdownUrl from '../assets/audio/xp/shutdown.wav';
import logonUrl from '../assets/audio/xp/logon.wav';
import logoffUrl from '../assets/audio/xp/logoff.wav';
import criticalStopUrl from '../assets/audio/xp/critical_stop.wav';
import errorUrl from '../assets/audio/xp/error.wav';
import dingUrl from '../assets/audio/xp/ding.wav';
import exclamationUrl from '../assets/audio/xp/exclamation.wav';
import notifyUrl from '../assets/audio/xp/notify.wav';
import menuCommandUrl from '../assets/audio/xp/menu_command.wav';
import minimizeUrl from '../assets/audio/xp/minimize.wav';
import restoreUrl from '../assets/audio/xp/restore.wav';
import recycleUrl from '../assets/audio/xp/recycle.wav';
// Authentic QQ2006 sound effects (extracted from the original installer via
// mengkunsoft/QQ2006 — see src/apps/QQ/assets/NOTICE.md). Wired into the QQ
// Messenger (#119).
import qqMessageUrl from '../assets/audio/qq/message.mp3';
import qqOnlineUrl from '../assets/audio/qq/online.mp3';
import qqSystemUrl from '../assets/audio/qq/system.mp3';

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

// Authentic Windows XP WAV samples (imported so Vite handles base URL/hashing)
const audioCache: Record<string, HTMLAudioElement> = {};

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
    playPromise.catch((error) => {
      console.warn('Sample playback failed:', error);
    });
  }
};

export const sounds = {
  startup() {
    playSample(startupUrl);
  },
  shutdown() {
    playSample(shutdownUrl);
  },
  logon() {
    playSample(logonUrl);
  },
  logoff() {
    playSample(logoffUrl);
  },
  criticalStop() {
    playSample(criticalStopUrl);
  },
  error() {
    playSample(errorUrl);
  },
  ding() {
    playSample(dingUrl);
  },
  exclamation() {
    playSample(exclamationUrl);
  },
  notify() {
    playSample(notifyUrl);
  },
  menuCommand() {
    playSample(menuCommandUrl);
  },
  minimize() {
    playSample(minimizeUrl);
  },
  restore() {
    playSample(restoreUrl);
  },
  recycle() {
    playSample(recycleUrl);
  },

  // Window-open sweep (no authentic XP sample; keep synthesized)
  windowOpen() {
    tone(523, 0.07, 'sine', 0.1, 0.0);
    tone(659, 0.07, 'sine', 0.1, 0.04);
    tone(784, 0.12, 'sine', 0.1, 0.08);
  },

  // QQ 经典敲门声
  qqKnock() {
    tone(800, 0.04, 'sine', 0.12, 0.0);
    tone(600, 0.06, 'sine', 0.14, 0.12);
  },

  // QQ 消息提示音（原版 msg.wav：寻呼机"滴滴"）
  qqMessage() {
    playSample(qqMessageUrl);
  },

  // QQ 上线提示音（原版 Global.wav：敲门"咚咚"）
  qqOnline() {
    playSample(qqOnlineUrl);
  },

  // QQ 系统消息 / 加好友提示音（原版 system.wav："咳、咳"）
  qqSystem() {
    playSample(qqSystemUrl);
  },
};

/** Play a named system sound by key (used by the imperative XPHandle). */
export const playSound = (name: keyof typeof sounds) => {
  sounds[name]?.();
};
