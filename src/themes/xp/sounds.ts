// Windows XP sound scheme (#213) — the theme's event-name → audio-URL map.
// The engine's soundManager never imports audio itself; the composition root
// (AppProviders) registers this map at startup, so a future theme ships its own
// sound scheme the same way it ships tokens/assets (see docs/THEMING.md).
import startupUrl from './assets/audio/startup.wav';
import shutdownUrl from './assets/audio/shutdown.wav';
import logonUrl from './assets/audio/logon.wav';
import logoffUrl from './assets/audio/logoff.wav';
import criticalStopUrl from './assets/audio/critical_stop.wav';
import errorUrl from './assets/audio/error.wav';
import dingUrl from './assets/audio/ding.wav';
import exclamationUrl from './assets/audio/exclamation.wav';
import notifyUrl from './assets/audio/notify.wav';
import menuCommandUrl from './assets/audio/menu_command.wav';
import minimizeUrl from './assets/audio/minimize.wav';
import restoreUrl from './assets/audio/restore.wav';
import recycleUrl from './assets/audio/recycle.wav';

/** Authentic XP WAV samples, keyed by the soundManager facade names. */
export const XP_SOUNDS: Record<string, string> = {
  startup: startupUrl,
  shutdown: shutdownUrl,
  logon: logonUrl,
  logoff: logoffUrl,
  criticalStop: criticalStopUrl,
  error: errorUrl,
  ding: dingUrl,
  exclamation: exclamationUrl,
  notify: notifyUrl,
  menuCommand: menuCommandUrl,
  minimize: minimizeUrl,
  restore: restoreUrl,
  recycle: recycleUrl,
};
