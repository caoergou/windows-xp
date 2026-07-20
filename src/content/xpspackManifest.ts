export const XPSPACK_FORMAT_VERSION = 1 as const;

export type XpspackCompression = 'none' | 'gzip' | 'brotli';

export interface XpspackEncryption {
  algorithm: 'AES-256-GCM';
  keyId: string;
  /** A unique 12-byte nonce encoded as unpadded base64url. */
  nonce: string;
}

export interface XpspackStoredEntry {
  id: string;
  path: string;
  sha256: string;
  storedBytes: number;
  uncompressedBytes: number;
  compression: XpspackCompression;
  encryption: XpspackEncryption | null;
}

export type XpspackChunk = XpspackStoredEntry;

export interface XpspackAsset extends XpspackStoredEntry {
  mediaType: string;
}

export interface XpspackManifestV1 {
  formatVersion: 1;
  packId: string;
  rootChunk: string;
  chunks: XpspackChunk[];
  assets: XpspackAsset[];
  signature: {
    algorithm: 'Ed25519';
    keyId: string;
    path: 'manifest.sig';
  } | null;
}

export interface XpspackChunkAad {
  algorithm: 'AES-256-GCM';
  compression: XpspackCompression;
  id: string;
  keyId: string;
  nonce: string;
  packId: string;
  path: string;
}

const canonicalValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalValue(child)])
    );
  }
  return value;
};

/** The exact UTF-8 bytes covered by an xpspack v1 Ed25519 signature. */
export const canonicalizeXpspackManifest = (manifest: XpspackManifestV1): Uint8Array =>
  new TextEncoder().encode(JSON.stringify(canonicalValue(manifest)));

/** Canonical additional authenticated data for an encrypted xpspack chunk. */
export const canonicalizeXpspackChunkAad = (value: XpspackChunkAad): Uint8Array =>
  new TextEncoder().encode(JSON.stringify(canonicalValue(value)));
