/**
 * Serializable desktop snapshot (#117).
 *
 * An `XPSnapshot` is a self-contained, versioned JSON description of a desktop
 * instance's state — filesystem (with file contents), recycle bin, open
 * windows, wallpaper, language, and a reserved `flags` slot for the scenario
 * system (#84). Snapshots can be exported from one instance/browser and
 * imported into another ("share a save"), or shipped by an author as a
 * checkpoint.
 */
import type { FileNode } from './types';
import type { RecycleBinItem } from './utils/storage';

/** Current snapshot format version. Bump on breaking schema changes. */
export const XP_SNAPSHOT_VERSION = 1;

export interface XPSnapshot {
  /** Snapshot format version. Loading a newer version throws. */
  version: number;
  /** Full filesystem tree, including file contents. */
  fs: { root: FileNode };
  /** Recycle bin contents keyed by bin entry id. */
  recycleBin: Record<string, RecycleBinItem>;
  /** Persisted open windows (the JSON stored under `<prefix>open_windows`). */
  openWindows: unknown[];
  /** Active wallpaper id or URL, or null. */
  wallpaper: string | null;
  /** Active language code, or null. */
  language: string | null;
  /** Reserved for the scenario system (#84): scenario flags. */
  flags: Record<string, unknown>;
}

/** Thrown when a snapshot cannot be loaded (missing/invalid/too-new version). */
export class XPSnapshotVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XPSnapshotVersionError';
  }
}

/**
 * Validate a value is a loadable snapshot for this build. Throws
 * {@link XPSnapshotVersionError} with a clear message rather than letting a
 * malformed or future-version snapshot corrupt storage.
 */
export function assertLoadableSnapshot(value: unknown): asserts value is XPSnapshot {
  if (!value || typeof value !== 'object') {
    throw new XPSnapshotVersionError('Invalid snapshot: expected an object.');
  }
  const snap = value as Partial<XPSnapshot>;
  if (typeof snap.version !== 'number') {
    throw new XPSnapshotVersionError('Invalid snapshot: missing numeric "version".');
  }
  if (snap.version > XP_SNAPSHOT_VERSION) {
    throw new XPSnapshotVersionError(
      `Snapshot version ${snap.version} is newer than this build supports (${XP_SNAPSHOT_VERSION}). Update @caoergou/windows-xp to load it.`
    );
  }
  if (!snap.fs || typeof snap.fs !== 'object' || !('root' in snap.fs)) {
    throw new XPSnapshotVersionError('Invalid snapshot: missing filesystem tree.');
  }
}
