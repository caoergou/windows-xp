import type { ContentPack, ContentRef } from './types';
import { isContainerNode, isFileContentNode, type FileNode } from '../types';

export interface ContentPackSnapshotCatalog {
  packFingerprints: Record<string, string>;
  assetOrigins: Record<string, string>;
  fileOrigins: Record<string, string>;
}

const emptyRecord = (): Record<string, string> => Object.create(null) as Record<string, string>;

export const snapshotPathKey = (path: string[]): string => JSON.stringify(path);

const canonicalRef = (ref: ContentRef): ContentRef =>
  typeof ref === 'string' ? ref : 'asset' in ref ? { asset: ref.asset } : { url: ref.url };

/**
 * Stable compatibility fingerprint for an authored asset manifest.
 *
 * This is deliberately not an authenticity primitive; signed `.xpspack`
 * manifests provide that guarantee. Snapshots use it only to detect that an
 * unread reference is being restored against a different pack revision.
 */
export const fingerprintAssetManifest = (
  assets: Record<string, ContentRef> | undefined
): string => {
  const canonical = Object.fromEntries(
    Object.entries(assets ?? {})
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, ref]) => [key, canonicalRef(ref)])
  );
  const bytes = new TextEncoder().encode(JSON.stringify(canonical));
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `manifest-v1-fnv1a64:${hash.toString(16).padStart(16, '0')}`;
};

const recordFileOrigins = (
  nodes: Record<string, FileNode>,
  packId: string,
  parentPath: string[],
  origins: Record<string, string>
): void => {
  for (const [key, node] of Object.entries(nodes)) {
    const path = [...parentPath, key];
    if (isFileContentNode(node) && node.contentRef) {
      origins[snapshotPathKey(path)] = packId;
    }
    if (isContainerNode(node)) recordFileOrigins(node.children, packId, path, origins);
  }
};

export const buildContentPackSnapshotCatalog = (
  packs: ContentPack[]
): ContentPackSnapshotCatalog => {
  const catalog: ContentPackSnapshotCatalog = {
    packFingerprints: emptyRecord(),
    assetOrigins: emptyRecord(),
    fileOrigins: emptyRecord(),
  };
  for (const pack of packs) {
    catalog.packFingerprints[pack.id] = fingerprintAssetManifest(pack.assets);
    for (const asset of Object.keys(pack.assets ?? {})) catalog.assetOrigins[asset] = pack.id;
    recordFileOrigins(pack.files ?? {}, pack.id, [], catalog.fileOrigins);
  }
  return catalog;
};
