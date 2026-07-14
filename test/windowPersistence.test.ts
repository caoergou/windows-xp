import { describe, it, expect } from 'vitest';
import {
  OPEN_WINDOWS_VERSION,
  encodeOpenWindows,
  decodeOpenWindows,
} from '../src/utils/windowPersistence';

describe('windowPersistence — versioned open_windows codec (#163 C)', () => {
  it('encodes into a { version, windows } envelope', () => {
    const wins = [{ id: 'w1', appId: 'Calculator' }];
    const parsed = JSON.parse(encodeOpenWindows(wins));
    expect(parsed).toEqual({ version: OPEN_WINDOWS_VERSION, windows: wins });
  });

  it('round-trips an encoded payload back to the window list', () => {
    const wins = [
      { id: 'w1', appId: 'Explorer' },
      { id: 'w2', appId: 'Notepad' },
    ];
    expect(decodeOpenWindows(encodeOpenWindows(wins))).toEqual(wins);
  });

  it('returns [] for null / empty input', () => {
    expect(decodeOpenWindows(null)).toEqual([]);
    expect(decodeOpenWindows('')).toEqual([]);
  });

  it('discards the pre-#163 bare-array (unversioned) format', () => {
    const legacy = JSON.stringify([{ id: 'w1', appId: 'Calculator' }]);
    expect(decodeOpenWindows(legacy)).toEqual([]);
  });

  it('discards a mismatched (older/newer) version envelope', () => {
    const older = JSON.stringify({ version: OPEN_WINDOWS_VERSION - 1, windows: [{ id: 'a' }] });
    const newer = JSON.stringify({ version: OPEN_WINDOWS_VERSION + 1, windows: [{ id: 'b' }] });
    expect(decodeOpenWindows(older)).toEqual([]);
    expect(decodeOpenWindows(newer)).toEqual([]);
  });

  it('discards a correct version whose windows field is not an array', () => {
    const bad = JSON.stringify({ version: OPEN_WINDOWS_VERSION, windows: { not: 'an array' } });
    expect(decodeOpenWindows(bad)).toEqual([]);
  });

  it('returns [] on corrupt JSON rather than throwing', () => {
    expect(() => decodeOpenWindows('{not valid json')).not.toThrow();
    expect(decodeOpenWindows('{not valid json')).toEqual([]);
  });
});
