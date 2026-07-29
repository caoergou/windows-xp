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
import { isContainerNode, isFileContentNode, type FileNode } from './types';
import { isAssetRef, isContentRef, type ContentRef } from './content/types';
import type { ReadAwareContentResolver } from './content/resolver';
import { snapshotPathKey, type ContentPackSnapshotCatalog } from './content/fingerprint';
import type { RecycleBinItem } from './utils/storage';
import type { ClockSnapshot } from './context/ClockContext';
import type { RecentDocumentEntry } from './context/RecentDocumentsContext';
import type { PrintJob } from './context/PrintSpoolerContext';

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
  /** Instance-local virtual wall-clock state (#275). */
  clock?: ClockSnapshot;
  /** Seeded and runtime recent-document history (#282). */
  recentDocuments?: RecentDocumentEntry[];
  /** Persisted virtual print queue (#276). */
  printJobs?: PrintJob[];
  /** Per-playlist track index and playhead; audio never auto-resumes (#277). */
  mediaSessions?: Record<string, { index: number; position: number }>;
  /** Evidence report drafts and review state (#278). */
  evidenceReports?: Record<string, unknown>;
  /** ContentRef provenance and optional bodies for portable shared saves (#266). */
  contentRefs?: SnapshotContentRefEntry[];
}

export interface SnapshotContentRefEntry {
  /** Absolute filesystem path below the snapshot root. */
  path: string[];
  /** The authored reference retained by the filesystem node. */
  ref: ContentRef;
  /** Pack that supplied the file or referenced asset, when applicable. */
  packId?: string;
  /** Compatibility fingerprint of that pack's authored asset manifest. */
  assetManifestFingerprint?: string;
  /** Present only after a user-facing content reader successfully opened the ref. */
  resolvedContent?: string;
}

export interface SnapshotContentSource extends ContentPackSnapshotCatalog {
  assets: Record<string, ContentRef>;
  resolver: Pick<ReadAwareContentResolver, 'peekRead'>;
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

export type XPSnapshotContentErrorCode =
  | 'snapshot-content-pack-missing'
  | 'snapshot-content-pack-mismatch'
  | 'snapshot-content-asset-missing'
  | 'snapshot-content-entry-invalid';

/** Structured failure for a snapshot whose external content cannot be restored. */
export class XPSnapshotContentError extends XPSnapshotError {
  constructor(
    readonly code: XPSnapshotContentErrorCode,
    message: string,
    readonly path: string[],
    readonly packId?: string,
    readonly asset?: string
  ) {
    super(message);
    this.name = 'XPSnapshotContentError';
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
      throw new XPSnapshotError(
        `${path}.children: expected an object, got ${describe(node.children)}.`
      );
    }
    for (const [key, child] of Object.entries(node.children)) {
      validateNode(child, `${path}.children[${JSON.stringify(key)}]`);
    }
  } else if (node.type === 'file') {
    if (node.content !== undefined && typeof node.content !== 'string') {
      throw new XPSnapshotError(
        `${path}.content: expected a string, got ${describe(node.content)}.`
      );
    }
    if (node.contentRef !== undefined && !isContentRef(node.contentRef)) {
      throw new XPSnapshotError(`${path}.contentRef: expected a valid ContentRef.`);
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

const sameRef = (left: ContentRef, right: ContentRef): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const findNode = (tree: { root: FileNode }, path: string[]): FileNode | null => {
  let node: FileNode = tree.root;
  for (const segment of path) {
    if (!isContainerNode(node)) return null;
    const child = node.children[segment];
    if (!child) return null;
    node = child;
  }
  return node;
};

const walkContentRefs = (
  node: FileNode,
  path: string[],
  visit: (node: FileNode, path: string[]) => void
): void => {
  visit(node, path);
  if (!isContainerNode(node)) return;
  for (const [key, child] of Object.entries(node.children)) {
    walkContentRefs(child, [...path, key], visit);
  }
};

/** Capture contentRef provenance without turning solver-only resolutions into reads. */
export const captureSnapshotContentRefs = (
  tree: { root: FileNode },
  source: SnapshotContentSource
): SnapshotContentRefEntry[] => {
  const entries: SnapshotContentRefEntry[] = [];
  walkContentRefs(tree.root, [], (node, path) => {
    if (!isFileContentNode(node) || !node.contentRef) return;
    const ref = node.contentRef;
    const packId = isAssetRef(ref)
      ? source.assetOrigins[ref.asset]
      : source.fileOrigins[snapshotPathKey(path)];
    const assetManifestFingerprint = packId ? source.packFingerprints[packId] : undefined;
    const resolvedContent = source.resolver.peekRead(ref);
    entries.push({
      path,
      ref,
      ...(packId ? { packId } : {}),
      ...(assetManifestFingerprint ? { assetManifestFingerprint } : {}),
      ...(resolvedContent !== null ? { resolvedContent } : {}),
    });
  });
  return entries;
};

/**
 * Clone and prepare snapshot filesystem content before persistence.
 *
 * Read refs become self-contained inline files. Unread refs remain lazy, but
 * their pack and manifest fingerprint must match the mounted content catalog.
 */
export const prepareSnapshotFilesystem = (
  snapshot: XPSnapshot,
  source: SnapshotContentSource
): { root: FileNode } => {
  const tree = JSON.parse(JSON.stringify(snapshot.fs)) as { root: FileNode };
  for (const entry of snapshot.contentRefs ?? []) {
    const node = findNode(tree, entry.path);
    const asset = isAssetRef(entry.ref) ? entry.ref.asset : undefined;
    if (
      !node ||
      !isFileContentNode(node) ||
      !node.contentRef ||
      !sameRef(node.contentRef, entry.ref)
    ) {
      throw new XPSnapshotContentError(
        'snapshot-content-entry-invalid',
        `Snapshot content entry at ${JSON.stringify(entry.path)} does not match its filesystem node.`,
        entry.path,
        entry.packId,
        asset
      );
    }
    if (entry.resolvedContent !== undefined) {
      node.content = entry.resolvedContent;
      delete node.contentRef;
      continue;
    }
    if (!entry.packId || !entry.assetManifestFingerprint) {
      if (asset) {
        throw new XPSnapshotContentError(
          'snapshot-content-pack-missing',
          `Snapshot unread asset "${asset}" at ${JSON.stringify(entry.path)} does not name its originating content pack.`,
          entry.path,
          entry.packId,
          asset
        );
      }
      continue;
    }
    const mountedFingerprint = source.packFingerprints[entry.packId];
    if (!mountedFingerprint) {
      throw new XPSnapshotContentError(
        'snapshot-content-pack-missing',
        `Snapshot requires content pack "${entry.packId}" for unread${asset ? ` asset "${asset}"` : ' content'} at ${JSON.stringify(entry.path)}.`,
        entry.path,
        entry.packId,
        asset
      );
    }
    if (mountedFingerprint !== entry.assetManifestFingerprint) {
      throw new XPSnapshotContentError(
        'snapshot-content-pack-mismatch',
        `Snapshot content pack "${entry.packId}" has a different asset manifest for unread${asset ? ` asset "${asset}"` : ' content'} at ${JSON.stringify(entry.path)}.`,
        entry.path,
        entry.packId,
        asset
      );
    }
    if (
      asset &&
      (!Object.prototype.hasOwnProperty.call(source.assets, asset) ||
        source.assetOrigins[asset] !== entry.packId)
    ) {
      throw new XPSnapshotContentError(
        'snapshot-content-asset-missing',
        `Snapshot content pack "${entry.packId}" does not provide unread asset "${asset}" at ${JSON.stringify(entry.path)}.`,
        entry.path,
        entry.packId,
        asset
      );
    }
  }
  return tree;
};

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
  if (
    snap.wallpaper !== undefined &&
    snap.wallpaper !== null &&
    typeof snap.wallpaper !== 'string'
  ) {
    throw new XPSnapshotError(
      `wallpaper: expected a string or null, got ${describe(snap.wallpaper)}.`
    );
  }
  if (snap.language !== undefined && snap.language !== null && typeof snap.language !== 'string') {
    throw new XPSnapshotError(
      `language: expected a string or null, got ${describe(snap.language)}.`
    );
  }
  if (snap.flags !== undefined) {
    if (!isPlainObject(snap.flags)) {
      throw new XPSnapshotError(`flags: expected an object, got ${describe(snap.flags)}.`);
    }
    for (const [key, v] of Object.entries(snap.flags)) {
      if (!isPrimitive(v)) {
        throw new XPSnapshotError(
          `flags[${JSON.stringify(key)}]: expected a string/number/boolean/null, got ${describe(v)}.`
        );
      }
    }
  }
  if (snap.clock !== undefined) {
    if (!isPlainObject(snap.clock)) {
      throw new XPSnapshotError(`clock: expected an object, got ${describe(snap.clock)}.`);
    }
    if (
      !Number.isFinite(snap.clock.virtualEpoch) ||
      !Number.isFinite(snap.clock.realEpoch) ||
      !['realtime', 'offset', 'frozen'].includes(String(snap.clock.mode))
    ) {
      throw new XPSnapshotError('clock: invalid epoch or mode.');
    }
  }
  if (snap.recentDocuments !== undefined && !Array.isArray(snap.recentDocuments)) {
    throw new XPSnapshotError('recentDocuments: expected an array.');
  }
  if (snap.printJobs !== undefined && !Array.isArray(snap.printJobs)) {
    throw new XPSnapshotError('printJobs: expected an array.');
  }
  if (snap.mediaSessions !== undefined && !isPlainObject(snap.mediaSessions)) {
    throw new XPSnapshotError('mediaSessions: expected an object.');
  }
  if (snap.evidenceReports !== undefined && !isPlainObject(snap.evidenceReports)) {
    throw new XPSnapshotError('evidenceReports: expected an object.');
  }
  if (snap.contentRefs !== undefined) {
    if (!Array.isArray(snap.contentRefs)) {
      throw new XPSnapshotError('contentRefs: expected an array.');
    }
    const paths = new Set<string>();
    for (const [index, entry] of snap.contentRefs.entries()) {
      const entryPath = `contentRefs[${index}]`;
      if (!isPlainObject(entry)) {
        throw new XPSnapshotError(`${entryPath}: expected an object.`);
      }
      if (
        !Array.isArray(entry.path) ||
        entry.path.some(segment => typeof segment !== 'string' || segment.length === 0)
      ) {
        throw new XPSnapshotError(`${entryPath}.path: expected non-empty string segments.`);
      }
      const pathKey = snapshotPathKey(entry.path);
      if (paths.has(pathKey)) {
        throw new XPSnapshotError(`${entryPath}.path: duplicate snapshot content path.`);
      }
      paths.add(pathKey);
      if (!isContentRef(entry.ref)) {
        throw new XPSnapshotError(`${entryPath}.ref: expected a valid ContentRef.`);
      }
      if (entry.packId !== undefined && typeof entry.packId !== 'string') {
        throw new XPSnapshotError(`${entryPath}.packId: expected a string.`);
      }
      if (
        entry.assetManifestFingerprint !== undefined &&
        typeof entry.assetManifestFingerprint !== 'string'
      ) {
        throw new XPSnapshotError(`${entryPath}.assetManifestFingerprint: expected a string.`);
      }
      if (entry.resolvedContent !== undefined && typeof entry.resolvedContent !== 'string') {
        throw new XPSnapshotError(`${entryPath}.resolvedContent: expected a string.`);
      }
      const node = findNode(snap.fs as { root: FileNode }, entry.path);
      if (
        !node ||
        !isFileContentNode(node) ||
        !node.contentRef ||
        !sameRef(node.contentRef, entry.ref)
      ) {
        throw new XPSnapshotError(`${entryPath}: does not match its filesystem contentRef.`);
      }
    }
  }
}
