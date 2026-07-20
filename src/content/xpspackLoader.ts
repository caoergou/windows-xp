import Ajv from 'ajv';
import contentPackSchema from './content-pack.schema.json';
import type { ContentPack } from './types';
import {
  canonicalizeXpspackChunkAad,
  canonicalizeXpspackManifest,
  type XpspackCompression,
  type XpspackManifestV1,
  type XpspackStoredEntry,
} from './xpspackManifest';

export type ContentPackLoadErrorCode =
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
  | 'xpspack-root-chunk'
  | 'xpspack-encryption-unsupported'
  | 'xpspack-compression-unsupported'
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

export class ContentPackLoadError extends Error {
  readonly code: ContentPackLoadErrorCode;
  readonly cause?: unknown;

  constructor(code: ContentPackLoadErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ContentPackLoadError';
    this.code = code;
    this.cause = cause;
  }
}

const fail = (code: ContentPackLoadErrorCode, message: string, cause?: unknown): never => {
  throw new ContentPackLoadError(code, message, cause);
};

const attempt = <T>(code: ContentPackLoadErrorCode, message: string, operation: () => T): T => {
  try {
    return operation();
  } catch (error) {
    if (error instanceof ContentPackLoadError) throw error;
    return fail(code, message, error);
  }
};

const attemptAsync = async <T>(
  code: ContentPackLoadErrorCode,
  message: string,
  operation: () => Promise<T>
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ContentPackLoadError) throw error;
    return fail(code, message, error);
  }
};

const MAX_STORED_BYTES = 512 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 1024 * 1024 * 1024;
const MAX_EXPANSION_RATIO = 100;
const ZIP_LOCAL = 0x04034b50;
const ZIP_CENTRAL = 0x02014b50;
const ZIP_END = 0x06054b50;
const ZIP_UTF8 = 0x0800;
const textDecoder = new TextDecoder('utf-8', { fatal: true });
const validateContentPack = new Ajv({
  allErrors: true,
  strict: false,
  allowUnionTypes: true,
}).compile(contentPackSchema);

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

const safePath = (value: string): boolean =>
  !value.startsWith('/') &&
  !value.includes('\\') &&
  !value.includes('\0') &&
  value.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..');

const requireRange = (bytes: Uint8Array, offset: number, length: number): void => {
  if (offset < 0 || length < 0 || offset + length > bytes.byteLength)
    fail('xpspack-zip-invalid', 'xpspack ZIP contains an out-of-range entry');
};

const readArchive = (input: Uint8Array): Map<string, Uint8Array> => {
  if (input.byteLength < 22) fail('xpspack-zip-invalid', 'xpspack ZIP is missing its end record');
  if (input.byteLength > MAX_STORED_BYTES)
    fail('xpspack-size-limit', 'xpspack ZIP exceeds the stored size limit');
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  const endOffset = input.byteLength - 22;
  if (view.getUint32(endOffset, true) !== ZIP_END || view.getUint16(endOffset + 20, true) !== 0)
    fail('xpspack-zip-invalid', 'xpspack ZIP has an unsupported end record');
  const entryCount = view.getUint16(endOffset + 10, true);
  const centralSize = view.getUint32(endOffset + 12, true);
  const centralOffset = view.getUint32(endOffset + 16, true);
  if (
    view.getUint16(endOffset + 8, true) !== entryCount ||
    entryCount > 10_000 ||
    centralOffset + centralSize !== endOffset
  )
    fail('xpspack-zip-invalid', 'xpspack ZIP central directory is invalid');

  const output = new Map<string, Uint8Array>();
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    requireRange(input, cursor, 46);
    if (view.getUint32(cursor, true) !== ZIP_CENTRAL)
      fail('xpspack-zip-invalid', 'xpspack ZIP central entry is invalid');
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const crc = view.getUint32(cursor + 16, true);
    const storedSize = view.getUint32(cursor + 20, true);
    const expandedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    requireRange(input, cursor + 46, nameLength + extraLength + commentLength);
    if (
      flags !== ZIP_UTF8 ||
      method !== 0 ||
      storedSize !== expandedSize ||
      extraLength ||
      commentLength
    )
      fail('xpspack-zip-invalid', 'xpspack ZIP entry uses unsupported features');
    const name = textDecoder.decode(input.subarray(cursor + 46, cursor + 46 + nameLength));
    if (!safePath(name) || output.has(name))
      fail('xpspack-zip-invalid', `xpspack ZIP path is unsafe or duplicated: ${name}`);
    requireRange(input, localOffset, 30);
    if (view.getUint32(localOffset, true) !== ZIP_LOCAL)
      fail('xpspack-zip-invalid', `xpspack ZIP local entry is invalid: ${name}`);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    requireRange(input, localOffset + 30, localNameLength + localExtraLength);
    requireRange(input, dataOffset, storedSize);
    const localName = textDecoder.decode(
      input.subarray(localOffset + 30, localOffset + 30 + localNameLength)
    );
    if (
      localName !== name ||
      localExtraLength ||
      localOffset >= centralOffset ||
      dataOffset + storedSize > centralOffset ||
      view.getUint16(localOffset + 6, true) !== flags ||
      view.getUint16(localOffset + 8, true) !== method ||
      view.getUint32(localOffset + 14, true) !== crc ||
      view.getUint32(localOffset + 18, true) !== storedSize ||
      view.getUint32(localOffset + 22, true) !== expandedSize
    )
      fail('xpspack-zip-invalid', `xpspack ZIP local and central entries differ: ${name}`);
    const payload = input.slice(dataOffset, dataOffset + storedSize);
    if (crc32(payload) !== crc)
      fail('xpspack-zip-invalid', `xpspack ZIP CRC does not match: ${name}`);
    output.set(name, payload);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== endOffset)
    fail('xpspack-zip-invalid', 'xpspack ZIP central directory size does not match');
  return output;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireRecord = (value: unknown, message: string): Record<string, unknown> =>
  isRecord(value) ? value : fail('xpspack-manifest-invalid', message);

const hasOnly = (value: Record<string, unknown>, allowed: string[]): boolean =>
  Object.keys(value).every(key => allowed.includes(key));

const parseStoredEntry = (value: unknown, asset: boolean): XpspackStoredEntry => {
  const entry = requireRecord(value, 'xpspack entry must be an object');
  const allowed = [
    'id',
    'path',
    'sha256',
    'storedBytes',
    'uncompressedBytes',
    'compression',
    'encryption',
    ...(asset ? ['mediaType'] : []),
  ];
  if (!hasOnly(entry, allowed))
    fail('xpspack-manifest-invalid', 'xpspack entry contains an unknown field');
  if (
    typeof entry.id !== 'string' ||
    !entry.id ||
    typeof entry.path !== 'string' ||
    !safePath(entry.path) ||
    !(asset ? entry.path.startsWith('assets/') : entry.path.startsWith('chunks/')) ||
    typeof entry.sha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(entry.sha256) ||
    !Number.isSafeInteger(entry.storedBytes) ||
    (entry.storedBytes as number) < 0 ||
    !Number.isSafeInteger(entry.uncompressedBytes) ||
    (entry.uncompressedBytes as number) < 0 ||
    !['none', 'gzip', 'brotli'].includes(entry.compression as string) ||
    (asset && (typeof entry.mediaType !== 'string' || !entry.mediaType))
  )
    fail('xpspack-manifest-invalid', 'xpspack entry has an invalid field');
  if (entry.encryption !== null) {
    const encryption = requireRecord(entry.encryption, 'xpspack encryption metadata is invalid');
    if (
      !hasOnly(encryption, ['algorithm', 'keyId', 'nonce']) ||
      encryption.algorithm !== 'AES-256-GCM' ||
      typeof encryption.keyId !== 'string' ||
      !encryption.keyId ||
      typeof encryption.nonce !== 'string' ||
      !/^[A-Za-z0-9_-]{16}$/.test(encryption.nonce)
    )
      fail('xpspack-manifest-invalid', 'xpspack encryption metadata is invalid');
  }
  return entry as unknown as XpspackStoredEntry;
};

const parseManifest = (bytes: Uint8Array): XpspackManifestV1 => {
  let value: unknown;
  try {
    value = JSON.parse(textDecoder.decode(bytes));
  } catch (error) {
    fail('xpspack-manifest-invalid', 'xpspack manifest is not valid UTF-8 JSON', error);
  }
  const record = requireRecord(value, 'xpspack manifest shape is invalid');
  if (
    !hasOnly(record, ['formatVersion', 'packId', 'rootChunk', 'chunks', 'assets', 'signature']) ||
    record.formatVersion !== 1
  )
    fail('xpspack-manifest-invalid', 'xpspack manifest shape is invalid');
  const packId =
    typeof record.packId === 'string' && record.packId
      ? record.packId
      : fail('xpspack-manifest-invalid', 'xpspack packId is invalid');
  const rootChunk =
    typeof record.rootChunk === 'string' && record.rootChunk
      ? record.rootChunk
      : fail('xpspack-manifest-invalid', 'xpspack rootChunk is invalid');
  const chunkValues = Array.isArray(record.chunks)
    ? record.chunks
    : fail('xpspack-manifest-invalid', 'xpspack chunks must be an array');
  if (chunkValues.length === 0)
    fail('xpspack-manifest-invalid', 'xpspack must contain at least one chunk');
  const assetValues = Array.isArray(record.assets)
    ? record.assets
    : fail('xpspack-manifest-invalid', 'xpspack assets must be an array');
  const chunks = chunkValues.map(item => parseStoredEntry(item, false));
  const assets = assetValues.map(item => parseStoredEntry(item, true));
  let signature: XpspackManifestV1['signature'] = null;
  if (record.signature !== null) {
    const signatureValue = requireRecord(record.signature, 'xpspack signature metadata is invalid');
    if (
      !hasOnly(signatureValue, ['algorithm', 'keyId', 'path']) ||
      signatureValue.algorithm !== 'Ed25519' ||
      signatureValue.path !== 'manifest.sig'
    )
      fail('xpspack-manifest-invalid', 'xpspack signature metadata is invalid');
    const keyId =
      typeof signatureValue.keyId === 'string' && signatureValue.keyId
        ? signatureValue.keyId
        : fail('xpspack-manifest-invalid', 'xpspack signature keyId is invalid');
    signature = {
      algorithm: 'Ed25519',
      keyId,
      path: 'manifest.sig',
    };
  }
  const manifest: XpspackManifestV1 = {
    formatVersion: 1,
    packId,
    rootChunk,
    chunks,
    assets: assets as XpspackManifestV1['assets'],
    signature,
  };
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const entry of [...chunks, ...assets]) {
    if (ids.has(entry.id) || paths.has(entry.path))
      fail('xpspack-manifest-invalid', 'xpspack entry id or path is duplicated');
    ids.add(entry.id);
    paths.add(entry.path);
  }
  if (chunks.filter(chunk => chunk.id === manifest.rootChunk).length !== 1)
    fail('xpspack-root-chunk', 'xpspack rootChunk must identify exactly one chunk');
  return manifest;
};

const equalBytes = (left: Uint8Array, right: Uint8Array): boolean =>
  left.byteLength === right.byteLength && left.every((byte, index) => byte === right[index]);

const bufferSource = (bytes: Uint8Array): ArrayBuffer => bytes.slice().buffer as ArrayBuffer;

const hex = (bytes: ArrayBuffer): string =>
  [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64 = (bytes: Uint8Array): string => {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    output += BASE64[first >> 2];
    output += BASE64[((first & 3) << 4) | ((second ?? 0) >> 4)];
    output += second === undefined ? '=' : BASE64[((second & 15) << 2) | ((third ?? 0) >> 6)];
    output += third === undefined ? '=' : BASE64[third & 63];
  }
  return output;
};

const fromBase64url = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const output: number[] = [];
  for (let index = 0; index < normalized.length; index += 4) {
    const first = BASE64.indexOf(normalized[index]);
    const second = BASE64.indexOf(normalized[index + 1]);
    const third = BASE64.indexOf(normalized[index + 2] ?? '=');
    const fourth = BASE64.indexOf(normalized[index + 3] ?? '=');
    if (
      first < 0 ||
      second < 0 ||
      (third < 0 && normalized[index + 2] !== undefined) ||
      (fourth < 0 && normalized[index + 3] !== undefined)
    )
      fail('xpspack-decryption-failed', 'xpspack nonce is not valid base64url');
    output.push((first << 2) | (second >> 4));
    if (normalized[index + 2] !== undefined) output.push(((second & 15) << 4) | (third >> 2));
    if (normalized[index + 3] !== undefined) output.push(((third & 3) << 6) | fourth);
  }
  return new Uint8Array(output);
};

const assetPlaceholder = (id: string): { url: string } => ({ url: `xpspack-asset:${id}` });

export interface XpspackDecompressionRequest {
  compression: Exclude<XpspackCompression, 'none'>;
  bytes: Uint8Array;
  expectedBytes: number;
}

export interface ContentPackLoadOptions {
  trustedSigningKeys?: Record<string, CryptoKey>;
  requireSignature?: boolean;
  crypto?: SubtleCrypto;
  decompress?: (request: XpspackDecompressionRequest) => Promise<Uint8Array>;
  keyProvider?: (request: { packId: string; chunkId: string; keyId: string }) => Promise<CryptoKey>;
}

export interface LoadedContentPack {
  manifest: XpspackManifestV1;
  pack: ContentPack;
  loadChunk(id: string): Promise<ContentPack>;
}

const decompressWithStream = async (bytes: Uint8Array): Promise<Uint8Array> => {
  if (typeof DecompressionStream === 'undefined')
    fail('xpspack-compression-unsupported', 'gzip decompression is unavailable in this host');
  const source = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bufferSource(bytes));
      controller.close();
    },
  });
  const stream = source.pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    total += result.value.byteLength;
    if (total > MAX_EXPANDED_BYTES) {
      await reader.cancel();
      fail('xpspack-size-limit', 'xpspack decompressed payload exceeds the size limit');
    }
    chunks.push(result.value);
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
};

/** Loads and verifies an xpspack without importing Node or authoring-tool code. */
export const loadContentPackFromXpspack = async (
  input: Uint8Array | ArrayBuffer,
  options: ContentPackLoadOptions = {}
): Promise<LoadedContentPack> => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const entries = readArchive(bytes);
  const manifestBytes =
    entries.get('manifest.json') ??
    fail('xpspack-manifest-missing', 'xpspack is missing manifest.json');
  const manifest = parseManifest(manifestBytes);
  if (!equalBytes(canonicalizeXpspackManifest(manifest), manifestBytes))
    fail('xpspack-manifest-noncanonical', 'xpspack manifest is not canonically encoded');
  const expected = new Set([
    'manifest.json',
    ...(manifest.signature ? [manifest.signature.path] : []),
    ...manifest.chunks.map(chunk => chunk.path),
    ...manifest.assets.map(asset => asset.path),
  ]);
  if (entries.size !== expected.size || [...entries.keys()].some(path => !expected.has(path)))
    fail('xpspack-entry-set', 'xpspack contains missing or unlisted entries');

  const subtle = options.crypto ?? globalThis.crypto?.subtle;
  if (manifest.signature) {
    const signature =
      entries.get(manifest.signature.path) ??
      fail('xpspack-signature-missing', 'xpspack signature is missing');
    if (signature.byteLength !== 64)
      fail('xpspack-signature-missing', 'xpspack Ed25519 signature is malformed');
    const trustedKey =
      options.trustedSigningKeys?.[manifest.signature.keyId] ??
      fail(
        'xpspack-signature-untrusted',
        `xpspack publisher key is not trusted: ${manifest.signature.keyId}`
      );
    if (!subtle)
      fail('xpspack-signature-untrusted', 'Web Crypto is unavailable for signature verification');
    let valid = false;
    try {
      valid = await subtle.verify(
        'Ed25519',
        trustedKey,
        bufferSource(signature),
        bufferSource(manifestBytes)
      );
    } catch (error) {
      fail('xpspack-signature-untrusted', 'xpspack trusted publisher key is invalid', error);
    }
    if (!valid) fail('xpspack-signature-invalid', 'xpspack signature verification failed');
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
      fail('xpspack-chunk-size', `xpspack chunk size does not match: ${chunk.path}`);
    if (
      chunk.uncompressedBytes > MAX_EXPANDED_BYTES ||
      (chunk.storedBytes === 0
        ? chunk.uncompressedBytes !== 0
        : chunk.uncompressedBytes > chunk.storedBytes * MAX_EXPANSION_RATIO)
    )
      fail('xpspack-size-limit', `xpspack chunk exceeds expansion limits: ${chunk.path}`);
    if (!subtle) fail('xpspack-chunk-hash', 'Web Crypto is unavailable for chunk verification');
    const digest = await subtle.digest('SHA-256', bufferSource(stored));
    if (hex(digest) !== chunk.sha256)
      fail('xpspack-chunk-hash', `xpspack chunk hash does not match: ${chunk.path}`);
    let compressed = stored;
    if (chunk.encryption) {
      const encryption = chunk.encryption;
      const provider =
        options.keyProvider ??
        fail('xpspack-key-unavailable', `xpspack chunk requires a host key: ${chunk.id}`);
      const key = await attemptAsync(
        'xpspack-key-unavailable',
        `xpspack host did not provide a usable key: ${encryption.keyId}`,
        () =>
          provider({
            packId: manifest.packId,
            chunkId: chunk.id,
            keyId: encryption.keyId,
          })
      );
      const nonce = fromBase64url(encryption.nonce);
      if (nonce.byteLength !== 12)
        fail('xpspack-decryption-failed', `xpspack nonce is invalid: ${chunk.id}`);
      compressed = await attemptAsync(
        'xpspack-decryption-failed',
        `xpspack chunk authentication failed: ${chunk.id}`,
        async () =>
          new Uint8Array(
            await subtle.decrypt(
              {
                name: 'AES-GCM',
                iv: bufferSource(nonce),
                additionalData: bufferSource(
                  canonicalizeXpspackChunkAad({
                    algorithm: encryption.algorithm,
                    compression: chunk.compression,
                    id: chunk.id,
                    keyId: encryption.keyId,
                    nonce: encryption.nonce,
                    packId: manifest.packId,
                    path: chunk.path,
                  })
                ),
                tagLength: 128,
              },
              key,
              bufferSource(stored)
            )
          )
      );
    }
    const plaintext = await attemptAsync(
      'xpspack-chunk-invalid',
      `xpspack chunk decompression failed: ${chunk.path}`,
      async () => {
        if (chunk.compression === 'none') return compressed;
        else if (options.decompress)
          return options.decompress({
            compression: chunk.compression,
            bytes: compressed,
            expectedBytes: chunk.uncompressedBytes,
          });
        else if (chunk.compression === 'gzip') return decompressWithStream(compressed);
        else
          fail(
            'xpspack-compression-unsupported',
            'brotli decompression requires a host decompression adapter'
          );
        return compressed;
      }
    );
    if (plaintext.byteLength !== chunk.uncompressedBytes)
      fail('xpspack-chunk-size', `xpspack chunk expanded size does not match: ${chunk.path}`);
    const loaded = attempt(
      'xpspack-chunk-invalid',
      `xpspack chunk is not valid UTF-8 JSON: ${chunk.path}`,
      () => JSON.parse(textDecoder.decode(plaintext)) as ContentPack
    );
    if (!validateContentPack(loaded)) {
      const detail =
        validateContentPack.errors?.[0]?.message ?? 'does not match ContentPack schema';
      fail('xpspack-pack-invalid', `xpspack chunk is not a valid ContentPack: ${detail}`);
    }
    return loaded;
  };
  const root =
    manifest.chunks.find(chunk => chunk.id === manifest.rootChunk) ??
    fail('xpspack-root-chunk', 'xpspack root chunk is missing');
  if (root.encryption) fail('xpspack-root-chunk', 'xpspack root chunk must remain public');
  const pack = await loadChunk(root.id);
  if (pack.id !== manifest.packId)
    fail('xpspack-pack-id', 'xpspack packId does not match its root ContentPack');
  const restoredAssets = { ...pack.assets };
  for (const asset of manifest.assets) {
    if (asset.encryption)
      fail(
        'xpspack-encryption-unsupported',
        `encrypted xpspack asset is unsupported: ${asset.path}`
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
      fail('xpspack-asset-size', `xpspack asset size does not match: ${asset.path}`);
    if (asset.compression !== 'none' || asset.uncompressedBytes !== asset.storedBytes)
      fail('xpspack-asset-invalid', `compressed xpspack assets are unsupported: ${asset.path}`);
    const assetDigest = await subtle.digest('SHA-256', bufferSource(storedAsset));
    if (hex(assetDigest) !== asset.sha256)
      fail('xpspack-asset-hash', `xpspack asset hash does not match: ${asset.path}`);
    restoredAssets[key] = { url: `data:${asset.mediaType};base64,${base64(storedAsset)}` };
  }
  if (manifest.assets.length) pack.assets = restoredAssets;
  return {
    manifest,
    pack,
    loadChunk: id => (id === root.id ? Promise.resolve(pack) : loadChunk(id)),
  };
};
