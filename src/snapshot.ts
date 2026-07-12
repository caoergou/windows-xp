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

/** Base class for any reason a snapshot cannot be loaded (#208). */
export class XPSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'XPSnapshotError';
  }
}

/** Thrown when a snapshot's version is missing or newer than this build. */
export class XPSnapshotVersionError extends XPSnapshotError {
  constructor(message: string) {
    super(message);
    this.name = 'XPSnapshotVersionError';
  }
}

/**
 * Reject a snapshot larger than this (#208). A shared save is untrusted input;
 * an oversized blob could blow the storage quota mid-write. 5 MB of JSON is far
 * beyond any real desktop (file contents live in it, but not media blobs).
 */
export const SNAPSHOT_MAX_BYTES = 5 * 1024 * 1024;

const NODE_TYPES = ['root', 'folder', 'drive', 'file', 'app_shortcut', 'external_link'] as const;
const CONTAINER_TYPES = ['root', 'folder', 'drive'];
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Recursively validate a filesystem node, failing fast with a keyed path. */
const validateNode = (node: unknown, path: string): void => {
  if (!isPlainObject(node)) {
    throw new XPSnapshotError(`${path}: expected a node object, got ${describe(node)}.`);
  }
  if (typeof node.type !== 'string' || !NODE_TYPES.includes(node.type as never)) {
    throw new XPSnapshotError(
      `${path}.type: expected one of ${NODE_TYPES.map(t => `'${t}'`).join('|')}, got ${describe(node.type)}.`
    );
  }
  if (typeof node.name !== 'string') {
    throw new XPSnapshotError(`${path}.name: expected a string, got ${describe(node.name)}.`);
  }
  if (CONTAINER_TYPES.includes(node.type)) {
    if (!isPlainObject(node.children)) {
      throw new XPSnapshotError(`${path}.children: expected an object, got ${describe(node.children)}.`);
    }
    for (const [key, child] of Object.entries(node.children)) {
      validateNode(child, `${path}.children[${JSON.stringify(key)}]`);
    }
  }
};

/** A short, safe description of an unexpected value for error messages. */
const describe = (v: unknown): string => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  const t = typeof v;
  return t === 'object' ? 'object' : t === 'undefined' ? 'undefined' : `${t} ${JSON.stringify(v)}`;
};

const isPrimitive = (v: unknown): boolean =>
  v === null || ['string', 'number', 'boolean'].includes(typeof v);

/**
 * Validate a value is a loadable snapshot for this build (#117, #208). Throws
 * {@link XPSnapshotVersionError} for a missing/too-new version and
 * {@link XPSnapshotError} for a malformed structure — with the offending path in
 * the message — rather than letting bad input corrupt storage. Callers validate
 * before applying, so a rejected snapshot leaves the desktop untouched.
 */
export function assertLoadableSnapshot(value: unknown): asserts value is XPSnapshot {
  if (!value || typeof value !== 'object') {
    throw new XPSnapshotError('Invalid snapshot: expected an object.');
  }

  // Size guard first — before walking a potentially huge tree.
  let bytes = 0;
  try {
    bytes = JSON.stringify(value).length;
  } catch {
    throw new XPSnapshotError('Invalid snapshot: not JSON-serializable (circular reference?).');
  }
  if (bytes > SNAPSHOT_MAX_BYTES) {
    throw new XPSnapshotError(
      `Snapshot is too large (${Math.round(bytes / 1024)} KB > ${SNAPSHOT_MAX_BYTES / 1024 / 1024} MB limit).`
    );
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
    throw new XPSnapshotError('Invalid snapshot: missing filesystem tree ("fs.root").');
  }
  validateNode((snap.fs as { root: unknown }).root, 'fs.root');

  if (snap.openWindows !== undefined && !Array.isArray(snap.openWindows)) {
    throw new XPSnapshotError(`openWindows: expected an array, got ${describe(snap.openWindows)}.`);
  }
  if (snap.recycleBin !== undefined && !isPlainObject(snap.recycleBin)) {
    throw new XPSnapshotError(`recycleBin: expected an object, got ${describe(snap.recycleBin)}.`);
  }
  if (snap.wallpaper !== undefined && snap.wallpaper !== null && typeof snap.wallpaper !== 'string') {
    throw new XPSnapshotError(`wallpaper: expected a string or null, got ${describe(snap.wallpaper)}.`);
  }
  if (snap.language !== undefined && snap.language !== null && typeof snap.language !== 'string') {
    throw new XPSnapshotError(`language: expected a string or null, got ${describe(snap.language)}.`);
  }
  if (snap.flags !== undefined) {
    if (!isPlainObject(snap.flags)) {
      throw new XPSnapshotError(`flags: expected an object, got ${describe(snap.flags)}.`);
    }
    for (const [key, v] of Object.entries(snap.flags)) {
      if (!isPrimitive(v)) {
        throw new XPSnapshotError(`flags[${JSON.stringify(key)}]: expected a string/number/boolean/null, got ${describe(v)}.`);
      }
    }
  }
}
