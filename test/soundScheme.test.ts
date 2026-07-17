import { describe, expect, it } from 'vitest';
import { XP_SOUNDS } from '../src/themes/xp/sounds';
import { sounds } from '../src/utils/soundManager';

// #213: the engine's soundManager binds no audio — the XP theme supplies a
// name → URL scheme that the composition root registers at startup. This pins
// the two sides of that seam together: every sample-backed facade name must
// have a sample in the theme scheme (a missing key would silently no-op).
const SAMPLE_BACKED = [
  'startup',
  'shutdown',
  'logon',
  'logoff',
  'criticalStop',
  'error',
  'ding',
  'exclamation',
  'notify',
  'menuCommand',
  'minimize',
  'restore',
  'recycle',
] as const;

describe('XP theme sound scheme (#213)', () => {
  it('covers every sample-backed soundManager name with a URL', () => {
    for (const name of SAMPLE_BACKED) {
      expect(XP_SOUNDS[name], `XP_SOUNDS.${name}`).toBeTruthy();
      expect(name in sounds, `sounds.${name}`).toBe(true);
    }
  });

  it('contains no orphan keys (scheme names the facade cannot play)', () => {
    for (const key of Object.keys(XP_SOUNDS)) {
      expect(key in sounds, `sounds.${key}`).toBe(true);
    }
  });
});
