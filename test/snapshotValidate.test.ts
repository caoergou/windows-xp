/**
 * Snapshot load-time validation (#208): every malformed shape is rejected with a
 * path-named error before any storage write (atomicity is the caller's job; here
 * we prove the guard fires).
 */
import { describe, it, expect } from 'vitest';
import {
  assertLoadableSnapshot,
  XPSnapshotError,
  XPSnapshotVersionError,
  XP_SNAPSHOT_VERSION,
  SNAPSHOT_MAX_BYTES,
} from '../src/snapshot';

const base = () => ({
  version: XP_SNAPSHOT_VERSION,
  fs: { root: { type: 'root', name: 'root', children: {} } },
  recycleBin: {},
  openWindows: [],
  wallpaper: null,
  language: null,
  flags: {},
});

const err = (v: unknown): string => {
  try {
    assertLoadableSnapshot(v);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error('expected assertLoadableSnapshot to throw');
};

describe('assertLoadableSnapshot', () => {
  it('accepts a well-formed snapshot', () => {
    expect(() => assertLoadableSnapshot(base())).not.toThrow();
  });

  it('rejects a non-object', () => {
    expect(() => assertLoadableSnapshot(null)).toThrow(XPSnapshotError);
  });

  it('rejects a missing / non-numeric version (version error)', () => {
    expect(() => assertLoadableSnapshot({ ...base(), version: 'x' })).toThrow(XPSnapshotVersionError);
  });

  it('rejects a newer version (version error)', () => {
    expect(() => assertLoadableSnapshot({ ...base(), version: XP_SNAPSHOT_VERSION + 1 })).toThrow(
      XPSnapshotVersionError
    );
  });

  it('names the path of a bad node type', () => {
    const snap = base();
    // @ts-expect-error deliberately malformed
    snap.fs.root.children['C盘'] = { name: 'C盘' }; // missing type
    expect(err(snap)).toContain(`fs.root.children["C盘"].type`);
  });

  it('names the path of a missing name deep in the tree', () => {
    const snap = base();
    // @ts-expect-error deliberately malformed — the deep child lacks a name
    snap.fs.root.children['Docs'] = { type: 'folder', name: 'Docs', children: { 'a.txt': { type: 'file' } } };
    expect(err(snap)).toContain(`fs.root.children["Docs"].children["a.txt"].name`);
  });

  it('rejects a non-object children container', () => {
    const snap = base();
    // @ts-expect-error deliberately malformed
    snap.fs.root.children = 'nope';
    expect(err(snap)).toContain('fs.root.children');
  });

  it('rejects a non-primitive flag value with its key', () => {
    const snap = base();
    // @ts-expect-error deliberately malformed
    snap.flags = { good: 1, bad: { nested: true } };
    expect(err(snap)).toContain('flags["bad"]');
  });

  it('rejects openWindows that is not an array', () => {
    const snap = base();
    // @ts-expect-error deliberately malformed
    snap.openWindows = {};
    expect(err(snap)).toContain('openWindows');
  });

  it('rejects an oversized snapshot', () => {
    const snap = base();
    // @ts-expect-error deliberately malformed
    snap.fs.root.children['big.txt'] = {
      type: 'file',
      name: 'big.txt',
      content: 'x'.repeat(SNAPSHOT_MAX_BYTES + 1),
    };
    expect(err(snap)).toContain('too large');
  });
});
