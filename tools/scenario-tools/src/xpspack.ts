import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  sign as signBytes,
  verify as verifyBytes,
  type KeyObject,
} from 'node:crypto';
import { promisify } from 'node:util';
import {
  brotliCompress as brotliCompressCallback,
  brotliDecompress as brotliDecompressCallback,
  constants as zlibConstants,
  gunzip as gunzipCallback,
  gzip as gzipCallback,
} from 'node:zlib';
import type { ContentPack } from '../../../src/content/types';
import {
  canonicalizeXpspackChunkAad,
  canonicalizeXpspackManifest,
  type XpspackChunk,
  type XpspackCompression,
  type XpspackManifestV1,
} from './distribution';
import { validateContentPackSchema, validateXpspackManifest } from './schema';

const gzip = promisify(gzipCallback);
const gunzip = promisify(gunzipCallback);
const brotliCompress = promisify(brotliCompressCallback);
const brotliDecompress = promisify(brotliDecompressCallback);
const textDecoder = new TextDecoder('utf-8', { fatal: true });

interface ZipEntry {
  path: string;
  bytes: Uint8Array;
}

interface CentralEntry extends ZipEntry {
  crc: number;
  offset: number;
}

export type XpspackErrorCode =
  | 'xpspack-zip-invalid'
  | 'xpspack-size-limit'
  | 'xpspack-manifest-missing'
  | 'xpspack-manifest-invalid'
  | 'xpspack-manifest-noncanonical'
  | 'xpspack-entry-set'
  | 'xpspack-signature-required'
  | 'xpspack-signature-missing'
  | 'xpspack-signature-untrusted'
  | 'xpspack-signature-invalid'
  | 'xpspack-signing-key'
  | 'xpspack-root-chunk'
  | 'xpspack-encryption-unsupported'
  | 'xpspack-chunk-size'
  | 'xpspack-chunk-hash'
  | 'xpspack-chunk-invalid'
  | 'xpspack-asset-size'
  | 'xpspack-asset-hash'
  | 'xpspack-asset-invalid'
  | 'xpspack-key-unavailable'
  | 'xpspack-decryption-failed'
  | 'xpspack-pack-invalid'
  | 'xpspack-pack-id';

export class XpspackError extends Error {
  readonly code: XpspackErrorCode;
  readonly cause?: unknown;

  constructor(code: XpspackErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'XpspackError';
    this.code = code;
    this.cause = cause;
  }
}

const fail = (code: XpspackErrorCode, message: string, cause?: unknown): never => {
  throw new XpspackError(code, message, cause);
};

const attempt = <T>(code: XpspackErrorCode, message: string, operation: () => T): T => {
  try {
    return operation();
  } catch (error) {
    if (error instanceof XpspackError) throw error;
    return fail(code, message, error);
  }
};

const attemptAsync = async <T>(
  code: XpspackErrorCode,
  message: string,
  operation: () => Promise<T>
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof XpspackError) throw error;
    return fail(code, message, error);
  }
};

const ZIP_LOCAL = 0x04034b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_END = 0x06054b50;
const ZIP_UTF8 = 0x0800;
const ZIP_DATE_1980_01_01 = 0x0021;
const ZIP_VERSION = 20;
const ZIP_UNIX_VERSION = (3 << 8) | ZIP_VERSION;
const ZIP_FILE_MODE = 0o100644 << 16;
const MAX_STORED_BYTES = 512 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 1024 * 1024 * 1024;
const MAX_EXPANSION_RATIO = 100;
const XPSPACK_FORMAT_VERSION = 1 as const;

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1)
    value = (value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1) >>> 0;
  return value;
});

const crc32 = (bytes: Uint8Array): number => {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};

const concatBytes = (parts: Uint8Array[]): Uint8Array => {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.byteLength, 0));
  let offset = 0;
  parts.forEach(part => {
    output.set(part, offset);
    offset += part.byteLength;
  });
  return output;
};

const header = (size: number): { bytes: Uint8Array; view: DataView } => {
  const bytes = new Uint8Array(size);
  return { bytes, view: new DataView(bytes.buffer) };
};

const safeZipPath = (value: string): boolean =>
  !value.startsWith('/') &&
  !value.includes('\\') &&
  !value.includes('\0') &&
  value.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..');

/** Creates the deterministic ZIP STORE container used by xpspack v1. */
export const createDeterministicZip = (entries: ZipEntry[]): Uint8Array => {
  if (entries.length > 0xffff) throw new Error('xpspack archive has too many entries for ZIP v1');
  const rank = (entry: ZipEntry): number =>
    entry.path === 'manifest.json' ? 0 : entry.path === 'manifest.sig' ? 1 : 2;
  const orderedEntries = [...entries].sort((left, right) => {
    const rankDifference = rank(left) - rank(right);
    if (rankDifference) return rankDifference;
    return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
  });
  const localParts: Uint8Array[] = [];
  const centralEntries: CentralEntry[] = [];
  const seen = new Set<string>();
  let offset = 0;
  orderedEntries.forEach(entry => {
    if (!safeZipPath(entry.path)) throw new Error(`unsafe xpspack archive path: ${entry.path}`);
    if (seen.has(entry.path)) throw new Error(`duplicate xpspack archive path: ${entry.path}`);
    seen.add(entry.path);
    const name = new TextEncoder().encode(entry.path);
    if (name.byteLength > 0xffff || entry.bytes.byteLength > 0xffffffff)
      throw new Error(`xpspack entry exceeds ZIP v1 limits: ${entry.path}`);
    const crc = crc32(entry.bytes);
    const local = header(30);
    local.view.setUint32(0, ZIP_LOCAL, true);
    local.view.setUint16(4, ZIP_VERSION, true);
    local.view.setUint16(6, ZIP_UTF8, true);
    local.view.setUint16(8, 0, true);
    local.view.setUint16(10, 0, true);
    local.view.setUint16(12, ZIP_DATE_1980_01_01, true);
    local.view.setUint32(14, crc, true);
    local.view.setUint32(18, entry.bytes.byteLength, true);
    local.view.setUint32(22, entry.bytes.byteLength, true);
    local.view.setUint16(26, name.byteLength, true);
    local.view.setUint16(28, 0, true);
    localParts.push(local.bytes, name, entry.bytes);
    centralEntries.push({ ...entry, crc, offset });
    offset += local.bytes.byteLength + name.byteLength + entry.bytes.byteLength;
  });

  const centralOffset = offset;
  const centralParts = centralEntries.flatMap(entry => {
    const name = new TextEncoder().encode(entry.path);
    const central = header(46);
    central.view.setUint32(0, ZIP_CENTRAL, true);
    central.view.setUint16(4, ZIP_UNIX_VERSION, true);
    central.view.setUint16(6, ZIP_VERSION, true);
    central.view.setUint16(8, ZIP_UTF8, true);
    central.view.setUint16(10, 0, true);
    central.view.setUint16(12, 0, true);
    central.view.setUint16(14, ZIP_DATE_1980_01_01, true);
    central.view.setUint32(16, entry.crc, true);
    central.view.setUint32(20, entry.bytes.byteLength, true);
    central.view.setUint32(24, entry.bytes.byteLength, true);
    central.view.setUint16(28, name.byteLength, true);
    central.view.setUint16(30, 0, true);
    central.view.setUint16(32, 0, true);
    central.view.setUint16(34, 0, true);
    central.view.setUint16(36, 0, true);
    central.view.setUint32(38, ZIP_FILE_MODE, true);
    central.view.setUint32(42, entry.offset, true);
    return [central.bytes, name];
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
  if (centralOffset > 0xffffffff || centralSize > 0xffffffff)
    throw new Error('xpspack archive exceeds ZIP v1 limits');
  const end = header(22);
  end.view.setUint32(0, ZIP_END, true);
  end.view.setUint16(4, 0, true);
  end.view.setUint16(6, 0, true);
  end.view.setUint16(8, orderedEntries.length, true);
  end.view.setUint16(10, orderedEntries.length, true);
  end.view.setUint32(12, centralSize, true);
  end.view.setUint32(16, centralOffset, true);
  end.view.setUint16(20, 0, true);
  return concatBytes([...localParts, ...centralParts, end.bytes]);
};

const requireRange = (bytes: Uint8Array, offset: number, length: number, label: string): void => {
  if (offset < 0 || length < 0 || offset + length > bytes.byteLength)
    throw new Error(`invalid xpspack ZIP ${label}`);
};

/** Reads the restricted ZIP STORE profile and checks local headers and CRCs. */
export const readDeterministicZip = (bytes: Uint8Array): Map<string, Uint8Array> => {
  if (bytes.byteLength < 22) throw new Error('invalid xpspack ZIP: missing end record');
  if (bytes.byteLength > MAX_STORED_BYTES)
    throw new Error('xpspack ZIP exceeds the stored size limit');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOffset = bytes.byteLength - 22;
  if (view.getUint32(endOffset, true) !== ZIP_END || view.getUint16(endOffset + 20, true) !== 0)
    throw new Error('invalid xpspack ZIP: unsupported end record');
  const entriesOnDisk = view.getUint16(endOffset + 8, true);
  const entryCount = view.getUint16(endOffset + 10, true);
  const centralSize = view.getUint32(endOffset + 12, true);
  const centralOffset = view.getUint32(endOffset + 16, true);
  if (
    entriesOnDisk !== entryCount ||
    entryCount > 10_000 ||
    centralOffset + centralSize !== endOffset
  )
    throw new Error('invalid xpspack ZIP central directory');
  const output = new Map<string, Uint8Array>();
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    requireRange(bytes, cursor, 46, 'central header');
    if (view.getUint32(cursor, true) !== ZIP_CENTRAL)
      throw new Error('invalid xpspack ZIP central header');
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const crc = view.getUint32(cursor + 16, true);
    const storedSize = view.getUint32(cursor + 20, true);
    const expandedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    requireRange(bytes, cursor + 46, nameLength + extraLength + commentLength, 'central entry');
    if (
      flags !== ZIP_UTF8 ||
      method !== 0 ||
      storedSize !== expandedSize ||
      extraLength ||
      commentLength
    )
      throw new Error('unsupported xpspack ZIP entry');
    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    const name = textDecoder.decode(nameBytes);
    if (!safeZipPath(name) || output.has(name))
      throw new Error(`unsafe or duplicate xpspack path: ${name}`);
    requireRange(bytes, localOffset, 30, 'local header');
    if (view.getUint32(localOffset, true) !== ZIP_LOCAL)
      throw new Error(`invalid xpspack local header: ${name}`);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    requireRange(bytes, localOffset + 30, localNameLength + localExtraLength, 'local entry');
    requireRange(bytes, dataOffset, storedSize, 'entry payload');
    if (localExtraLength || localOffset >= centralOffset || dataOffset + storedSize > centralOffset)
      throw new Error(`unsupported xpspack local entry: ${name}`);
    const localName = textDecoder.decode(
      bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength)
    );
    if (
      localName !== name ||
      view.getUint16(localOffset + 6, true) !== flags ||
      view.getUint16(localOffset + 8, true) !== method ||
      view.getUint32(localOffset + 14, true) !== crc ||
      view.getUint32(localOffset + 18, true) !== storedSize ||
      view.getUint32(localOffset + 22, true) !== expandedSize
    )
      throw new Error(`xpspack local and central entry mismatch: ${name}`);
    const payload = bytes.slice(dataOffset, dataOffset + storedSize);
    if (crc32(payload) !== crc) throw new Error(`xpspack CRC mismatch: ${name}`);
    output.set(name, payload);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== endOffset) throw new Error('invalid xpspack ZIP central directory size');
  return output;
};

export const compressXpspackPayload = async (
  bytes: Uint8Array,
  compression: XpspackCompression
): Promise<Uint8Array> => {
  if (compression === 'none') return bytes;
  // Node emits reproducible gzip headers with mtime 0 and no filename/comment.
  if (compression === 'gzip') {
    const compressed = new Uint8Array(await gzip(bytes, { level: 9 }));
    compressed[9] = 255;
    return compressed;
  }
  return brotliCompress(bytes, {
    params: {
      [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_GENERIC,
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      [zlibConstants.BROTLI_PARAM_LGWIN]: 22,
    },
  });
};

const decompressXpspackPayload = async (
  bytes: Uint8Array,
  compression: XpspackCompression
): Promise<Uint8Array> => {
  if (compression === 'none') return bytes;
  return compression === 'gzip' ? gunzip(bytes) : brotliDecompress(bytes);
};

const suffix = (compression: XpspackCompression): string =>
  compression === 'none' ? '' : compression === 'gzip' ? '.gz' : '.br';

export interface BuiltXpspack {
  bytes: Uint8Array;
  manifest: XpspackManifestV1;
}

export interface XpspackSigningOptions {
  keyId: string;
  privateKey: KeyObject | string | Buffer;
}

export interface XpspackAssetInput {
  /** Logical key in ContentPack.assets. */
  id: string;
  bytes: Uint8Array;
  mediaType: string;
}

export interface XpspackChunkInput {
  id: string;
  pack: ContentPack;
  compression?: XpspackCompression;
  encryption?: {
    keyId: string;
    /** Raw 32-byte AES-256 key. The builder never serializes or returns it. */
    key: Uint8Array;
  };
}

const assetManifestId = (id: string): string => `asset:${id}`;
const assetPlaceholder = (id: string): { url: string } => ({ url: `xpspack-asset:${id}` });
const assetPath = (id: string): string =>
  `assets/${createHash('sha256').update(id).digest('hex').slice(0, 24)}.bin`;
const assetDataUrl = (mediaType: string, bytes: Uint8Array): string =>
  `data:${mediaType};base64,${Buffer.from(bytes).toString('base64')}`;
const base64url = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64url');
const fromBase64url = (value: string): Uint8Array =>
  new Uint8Array(Buffer.from(value, 'base64url'));

const encryptChunk = (
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  aad: Uint8Array
): Uint8Array => {
  if (key.byteLength !== 32)
    fail('xpspack-key-unavailable', 'xpspack AES-256-GCM key must be exactly 32 bytes');
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(aad);
  return new Uint8Array(
    Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()])
  );
};

export const buildXpspack = async (
  pack: ContentPack,
  compression: XpspackCompression = 'none',
  signing?: XpspackSigningOptions,
  assets: XpspackAssetInput[] = [],
  chunks: XpspackChunkInput[] = []
): Promise<BuiltXpspack> => {
  const assetIds = new Set<string>();
  for (const asset of assets) {
    if (!asset.id || assetIds.has(asset.id))
      fail('xpspack-asset-invalid', `xpspack asset id is empty or duplicated: ${asset.id}`);
    if (!asset.mediaType.trim())
      fail('xpspack-asset-invalid', `xpspack asset media type is empty: ${asset.id}`);
    assetIds.add(asset.id);
  }
  const archivedPack: ContentPack = assets.length
    ? {
        ...pack,
        assets: {
          ...pack.assets,
          ...Object.fromEntries(assets.map(asset => [asset.id, assetPlaceholder(asset.id)])),
        },
      }
    : pack;
  const plaintext = new TextEncoder().encode(JSON.stringify(archivedPack));
  const stored = await compressXpspackPayload(plaintext, compression);
  const chunkPath = `chunks/public.json${suffix(compression)}`;
  const chunkIds = new Set(['public']);
  const storedChunks: Array<{ manifest: XpspackChunk; bytes: Uint8Array }> = [];
  for (const chunk of [...chunks].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  )) {
    if (!chunk.id || chunkIds.has(chunk.id))
      fail('xpspack-chunk-invalid', `xpspack chunk id is empty or duplicated: ${chunk.id}`);
    chunkIds.add(chunk.id);
    const chunkCompression = chunk.compression ?? compression;
    const chunkPlaintext = new TextEncoder().encode(JSON.stringify(chunk.pack));
    const compressed = await compressXpspackPayload(chunkPlaintext, chunkCompression);
    const encrypted = Boolean(chunk.encryption);
    const path = `chunks/${createHash('sha256').update(chunk.id).digest('hex').slice(0, 24)}.json${suffix(chunkCompression)}${encrypted ? '.enc' : ''}`;
    const nonce = chunk.encryption ? randomBytes(12) : undefined;
    const encryption = chunk.encryption
      ? {
          algorithm: 'AES-256-GCM' as const,
          keyId: chunk.encryption.keyId,
          nonce: base64url(nonce as Uint8Array),
        }
      : null;
    if (chunk.encryption && !chunk.encryption.keyId.trim())
      fail('xpspack-key-unavailable', `xpspack chunk keyId is empty: ${chunk.id}`);
    const chunkStored = chunk.encryption
      ? encryptChunk(
          compressed,
          chunk.encryption.key,
          nonce as Uint8Array,
          canonicalizeXpspackChunkAad({
            algorithm: 'AES-256-GCM',
            compression: chunkCompression,
            id: chunk.id,
            keyId: chunk.encryption.keyId,
            nonce: base64url(nonce as Uint8Array),
            packId: pack.id,
            path,
          })
        )
      : compressed;
    storedChunks.push({
      bytes: chunkStored,
      manifest: {
        id: chunk.id,
        path,
        sha256: createHash('sha256').update(chunkStored).digest('hex'),
        storedBytes: chunkStored.byteLength,
        uncompressedBytes: chunkPlaintext.byteLength,
        compression: chunkCompression,
        encryption,
      },
    });
  }
  const storedAssets = [...assets]
    .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
    .map(asset => ({
      input: asset,
      manifest: {
        id: assetManifestId(asset.id),
        path: assetPath(asset.id),
        sha256: createHash('sha256').update(asset.bytes).digest('hex'),
        storedBytes: asset.bytes.byteLength,
        uncompressedBytes: asset.bytes.byteLength,
        compression: 'none' as const,
        encryption: null,
        mediaType: asset.mediaType,
      },
    }));
  const manifest: XpspackManifestV1 = {
    formatVersion: XPSPACK_FORMAT_VERSION,
    packId: pack.id,
    rootChunk: 'public',
    chunks: [
      {
        id: 'public',
        path: chunkPath,
        sha256: createHash('sha256').update(stored).digest('hex'),
        storedBytes: stored.byteLength,
        uncompressedBytes: plaintext.byteLength,
        compression,
        encryption: null,
      },
      ...storedChunks.map(chunk => chunk.manifest),
    ],
    assets: storedAssets.map(asset => asset.manifest),
    signature: signing
      ? {
          algorithm: 'Ed25519',
          keyId: signing.keyId,
          path: 'manifest.sig',
        }
      : null,
  };
  const manifestBytes = canonicalizeXpspackManifest(manifest);
  const signatureBytes = signing
    ? attempt('xpspack-signing-key', 'xpspack private signing key is invalid', () => {
        if (!signing.keyId.trim()) fail('xpspack-signing-key', 'xpspack signing keyId is empty');
        return new Uint8Array(signBytes(null, manifestBytes, signing.privateKey));
      })
    : undefined;
  if (signatureBytes) {
    if (signatureBytes.byteLength !== 64)
      fail('xpspack-signing-key', 'xpspack Ed25519 signature must be 64 bytes');
  }
  return {
    bytes: createDeterministicZip([
      { path: 'manifest.json', bytes: manifestBytes },
      ...(signatureBytes ? [{ path: 'manifest.sig', bytes: signatureBytes }] : []),
      { path: chunkPath, bytes: stored },
      ...storedChunks.map(chunk => ({ path: chunk.manifest.path, bytes: chunk.bytes })),
      ...storedAssets.map(asset => ({ path: asset.manifest.path, bytes: asset.input.bytes })),
    ]),
    manifest,
  };
};

export interface LoadedXpspack {
  manifest: XpspackManifestV1;
  pack: ContentPack;
  loadChunk(id: string): Promise<ContentPack>;
}

export interface XpspackReadOptions {
  trustedSigningKeys?: Record<string, KeyObject | string | Buffer>;
  requireSignature?: boolean;
  keyProvider?: (request: {
    packId: string;
    chunkId: string;
    keyId: string;
  }) => Promise<Uint8Array>;
}

export const readXpspack = async (
  bytes: Uint8Array,
  options: XpspackReadOptions = {}
): Promise<LoadedXpspack> => {
  const entries = attempt('xpspack-zip-invalid', 'invalid xpspack ZIP container', () =>
    readDeterministicZip(bytes)
  );
  const manifestBytes =
    entries.get('manifest.json') ??
    fail('xpspack-manifest-missing', 'xpspack is missing manifest.json');
  const manifest = attempt(
    'xpspack-manifest-invalid',
    'xpspack manifest is not valid UTF-8 JSON',
    () => JSON.parse(textDecoder.decode(manifestBytes)) as XpspackManifestV1
  );
  const manifestDiagnostics = validateXpspackManifest(manifest);
  if (manifestDiagnostics.length)
    fail('xpspack-manifest-invalid', `invalid xpspack manifest: ${manifestDiagnostics[0].message}`);
  const canonicalManifest = canonicalizeXpspackManifest(manifest);
  if (
    canonicalManifest.byteLength !== manifestBytes.byteLength ||
    canonicalManifest.some((byte, index) => byte !== manifestBytes[index])
  )
    fail('xpspack-manifest-noncanonical', 'xpspack manifest is not canonically encoded');
  const expectedPaths = new Set([
    'manifest.json',
    ...(manifest.signature ? [manifest.signature.path] : []),
    ...manifest.chunks.map(item => item.path),
    ...manifest.assets.map(item => item.path),
  ]);
  if (
    entries.size !== expectedPaths.size ||
    [...entries.keys()].some(entry => !expectedPaths.has(entry))
  )
    fail('xpspack-entry-set', 'xpspack contains missing or unlisted entries');
  if (manifest.signature) {
    const signature =
      entries.get(manifest.signature.path) ??
      fail('xpspack-signature-missing', 'xpspack Ed25519 signature is missing');
    if (signature.byteLength !== 64)
      fail('xpspack-signature-missing', 'xpspack Ed25519 signature is missing or malformed');
    const trustedKey =
      options.trustedSigningKeys?.[manifest.signature.keyId] ??
      fail(
        'xpspack-signature-untrusted',
        `xpspack publisher key is not trusted: ${manifest.signature.keyId}`
      );
    let valid = false;
    try {
      valid = verifyBytes(null, manifestBytes, trustedKey, signature);
    } catch (error) {
      fail(
        'xpspack-signature-untrusted',
        `xpspack trusted publisher key is invalid: ${manifest.signature.keyId}`,
        error
      );
    }
    if (!valid)
      fail(
        'xpspack-signature-invalid',
        `xpspack signature verification failed: ${manifest.signature.keyId}`
      );
  } else if (options.requireSignature) {
    fail('xpspack-signature-required', 'xpspack must be signed by a trusted publisher');
  }
  const loadChunk = async (id: string): Promise<ContentPack> => {
    const chunk =
      manifest.chunks.find(item => item.id === id) ??
      fail('xpspack-chunk-invalid', `xpspack chunk is missing from manifest: ${id}`);
    const stored =
      entries.get(chunk.path) ??
      fail('xpspack-chunk-size', `xpspack chunk is missing: ${chunk.path}`);
    if (stored.byteLength !== chunk.storedBytes)
      fail('xpspack-chunk-size', `xpspack chunk size mismatch: ${chunk.path}`);
    if (
      chunk.uncompressedBytes > MAX_EXPANDED_BYTES ||
      (chunk.storedBytes === 0
        ? chunk.uncompressedBytes !== 0
        : chunk.uncompressedBytes > chunk.storedBytes * MAX_EXPANSION_RATIO)
    )
      fail('xpspack-size-limit', `xpspack chunk exceeds expansion limits: ${chunk.path}`);
    if (createHash('sha256').update(stored).digest('hex') !== chunk.sha256)
      fail('xpspack-chunk-hash', `xpspack chunk hash mismatch: ${chunk.path}`);
    let compressed = stored;
    if (chunk.encryption) {
      const encryption = chunk.encryption;
      const provider =
        options.keyProvider ??
        fail('xpspack-key-unavailable', `xpspack chunk requires a host key: ${chunk.id}`);
      const key = await attemptAsync(
        'xpspack-key-unavailable',
        `xpspack host did not provide a usable key: ${encryption.keyId}`,
        () => provider({ packId: manifest.packId, chunkId: chunk.id, keyId: encryption.keyId })
      );
      if (key.byteLength !== 32)
        fail('xpspack-key-unavailable', 'xpspack AES-256-GCM key must be exactly 32 bytes');
      compressed = attempt(
        'xpspack-decryption-failed',
        `xpspack chunk authentication failed: ${chunk.id}`,
        () => {
          if (stored.byteLength < 16)
            fail('xpspack-decryption-failed', `xpspack ciphertext is truncated: ${chunk.id}`);
          const nonce = fromBase64url(encryption.nonce);
          if (nonce.byteLength !== 12)
            fail('xpspack-decryption-failed', `xpspack nonce is invalid: ${chunk.id}`);
          const decipher = createDecipheriv('aes-256-gcm', key, nonce);
          decipher.setAAD(
            canonicalizeXpspackChunkAad({
              algorithm: encryption.algorithm,
              compression: chunk.compression,
              id: chunk.id,
              keyId: encryption.keyId,
              nonce: encryption.nonce,
              packId: manifest.packId,
              path: chunk.path,
            })
          );
          decipher.setAuthTag(stored.subarray(stored.byteLength - 16));
          return new Uint8Array(
            Buffer.concat([
              decipher.update(stored.subarray(0, stored.byteLength - 16)),
              decipher.final(),
            ])
          );
        }
      );
    }
    const plaintext = await attemptAsync(
      'xpspack-chunk-invalid',
      `xpspack chunk decompression failed: ${chunk.path}`,
      () => decompressXpspackPayload(compressed, chunk.compression)
    );
    if (plaintext.byteLength !== chunk.uncompressedBytes)
      fail('xpspack-chunk-size', `xpspack chunk expanded size mismatch: ${chunk.path}`);
    const loaded = attempt(
      'xpspack-chunk-invalid',
      `xpspack chunk is not valid UTF-8 JSON: ${chunk.path}`,
      () => JSON.parse(textDecoder.decode(plaintext)) as ContentPack
    );
    const diagnostics = validateContentPackSchema(loaded);
    if (diagnostics.length)
      fail('xpspack-pack-invalid', `invalid xpspack ContentPack: ${diagnostics[0].message}`);
    return loaded;
  };
  const root =
    manifest.chunks.find(chunk => chunk.id === manifest.rootChunk) ??
    fail('xpspack-root-chunk', `xpspack root chunk is missing: ${manifest.rootChunk}`);
  if (root.encryption) fail('xpspack-root-chunk', 'xpspack root chunk must remain public');
  const pack = await loadChunk(root.id);
  if (pack.id !== manifest.packId)
    fail('xpspack-pack-id', 'xpspack packId does not match its root ContentPack');
  const restoredAssets = { ...pack.assets };
  for (const asset of manifest.assets) {
    if (asset.encryption)
      fail(
        'xpspack-encryption-unsupported',
        `encrypted xpspack asset is not implemented: ${asset.path}`
      );
    const key = asset.id.startsWith('asset:') ? asset.id.slice('asset:'.length) : '';
    if (!key || JSON.stringify(restoredAssets[key]) !== JSON.stringify(assetPlaceholder(key)))
      fail(
        'xpspack-asset-invalid',
        `xpspack asset is not linked from its ContentPack: ${asset.id}`
      );
    const storedAsset =
      entries.get(asset.path) ??
      fail('xpspack-asset-size', `xpspack asset is missing: ${asset.path}`);
    if (storedAsset.byteLength !== asset.storedBytes)
      fail('xpspack-asset-size', `xpspack asset size mismatch: ${asset.path}`);
    if (asset.compression !== 'none' || asset.uncompressedBytes !== asset.storedBytes)
      fail('xpspack-asset-invalid', `compressed xpspack assets are not implemented: ${asset.path}`);
    if (createHash('sha256').update(storedAsset).digest('hex') !== asset.sha256)
      fail('xpspack-asset-hash', `xpspack asset hash mismatch: ${asset.path}`);
    restoredAssets[key] = { url: assetDataUrl(asset.mediaType, storedAsset) };
  }
  if (manifest.assets.length) pack.assets = restoredAssets;
  return {
    manifest,
    pack,
    loadChunk: id => (id === root.id ? Promise.resolve(pack) : loadChunk(id)),
  };
};
