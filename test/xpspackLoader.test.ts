import { generateKeyPairSync, webcrypto } from 'node:crypto';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ContentPackLoadError, loadContentPackFromXpspack } from '../src/lib/content-pack-loader';
import {
  buildXpspack,
  createDeterministicZip,
  readDeterministicZip,
} from '../tools/scenario-tools/src/xpspack';
import { packDirectory } from '../tools/scenario-tools/src/pack';

const subtle = webcrypto.subtle as unknown as SubtleCrypto;

describe('browser xpspack loader', () => {
  it('loads verified uncompressed packs without Node imports', async () => {
    const normalized = await packDirectory(path.resolve('examples/reference-content-pack'), {
      check: true,
    });
    const artifact = await buildXpspack(normalized.pack, 'none');
    const loaded = await loadContentPackFromXpspack(artifact.bytes, { crypto: subtle });
    expect(loaded.pack).toEqual(normalized.pack);
  });

  it.each(['gzip', 'brotli'] as const)(
    'loads %s packs through a host decompression adapter',
    async compression => {
      const normalized = await packDirectory(path.resolve('examples/reference-content-pack'), {
        check: true,
      });
      const artifact = await buildXpspack(normalized.pack, compression);
      const loaded = await loadContentPackFromXpspack(artifact.bytes, {
        crypto: subtle,
        decompress: async request =>
          new Uint8Array(
            request.compression === 'gzip'
              ? gunzipSync(request.bytes)
              : brotliDecompressSync(request.bytes)
          ),
      });
      expect(loaded.pack).toEqual(normalized.pack);
    }
  );

  it('verifies Ed25519 only against host-provided Web Crypto keys', async () => {
    const normalized = await packDirectory(path.resolve('examples/reference-content-pack'), {
      check: true,
    });
    const publisher = generateKeyPairSync('ed25519');
    const attacker = generateKeyPairSync('ed25519');
    const signed = await buildXpspack(normalized.pack, 'none', {
      keyId: 'publisher-2026',
      privateKey: publisher.privateKey,
    });
    const importPublicKey = (der: ArrayBuffer): Promise<CryptoKey> =>
      subtle.importKey('spki', der, 'Ed25519', false, ['verify']);
    const publisherKey = await importPublicKey(
      publisher.publicKey.export({ type: 'spki', format: 'der' }).buffer as ArrayBuffer
    );
    const attackerKey = await importPublicKey(
      attacker.publicKey.export({ type: 'spki', format: 'der' }).buffer as ArrayBuffer
    );

    await expect(
      loadContentPackFromXpspack(signed.bytes, {
        crypto: subtle,
        trustedSigningKeys: { 'publisher-2026': publisherKey },
        requireSignature: true,
      })
    ).resolves.toMatchObject({ pack: normalized.pack });
    await expect(
      loadContentPackFromXpspack(signed.bytes, {
        crypto: subtle,
        trustedSigningKeys: { 'publisher-2026': attackerKey },
      })
    ).rejects.toMatchObject({ code: 'xpspack-signature-invalid' });
    await expect(
      loadContentPackFromXpspack(signed.bytes, { crypto: subtle })
    ).rejects.toBeInstanceOf(ContentPackLoadError);
  });

  it('verifies and materializes binary assets without Node or Blob URLs', async () => {
    const assetBytes = new Uint8Array([0, 255, 1, 128, 42]);
    const artifact = await buildXpspack(
      { id: 'browser-assets', assets: { picture: 'placeholder' } },
      'none',
      undefined,
      [{ id: 'picture', bytes: assetBytes, mediaType: 'image/png' }]
    );
    const loaded = await loadContentPackFromXpspack(artifact.bytes, { crypto: subtle });
    expect(loaded.pack.assets?.picture).toEqual({ url: 'data:image/png;base64,AP8BgCo=' });

    const archive = readDeterministicZip(artifact.bytes);
    const assetPath = artifact.manifest.assets[0].path;
    const corruptedAsset = archive.get(assetPath)?.slice();
    if (!corruptedAsset) throw new Error('binary asset was not written');
    corruptedAsset[0] ^= 0xff;
    archive.set(assetPath, corruptedAsset);
    const corrupted = createDeterministicZip(
      [...archive].map(([entryPath, bytes]) => ({ path: entryPath, bytes }))
    );
    await expect(loadContentPackFromXpspack(corrupted, { crypto: subtle })).rejects.toMatchObject({
      code: 'xpspack-asset-hash',
    });
  });

  it('decrypts authorized chunks lazily and fails closed for incorrect keys', async () => {
    const rawKey = new Uint8Array(32).fill(11);
    const wrongRawKey = new Uint8Array(32).fill(12);
    const artifact = await buildXpspack(
      { id: 'browser-encrypted' },
      'none',
      undefined,
      [],
      [
        {
          id: 'chapter-2',
          pack: { id: 'browser-chapter', strings: { en: { clue: 'verified' } } },
          encryption: { keyId: 'chapter-key', key: rawKey },
        },
      ]
    );
    const cryptoKey = await subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
    const wrongKey = await subtle.importKey('raw', wrongRawKey, 'AES-GCM', false, ['decrypt']);

    const locked = await loadContentPackFromXpspack(artifact.bytes, { crypto: subtle });
    await expect(locked.loadChunk('chapter-2')).rejects.toMatchObject({
      code: 'xpspack-key-unavailable',
    });
    const rejected = await loadContentPackFromXpspack(artifact.bytes, {
      crypto: subtle,
      keyProvider: async () => wrongKey,
    });
    await expect(rejected.loadChunk('chapter-2')).rejects.toMatchObject({
      code: 'xpspack-decryption-failed',
    });
    const accepted = await loadContentPackFromXpspack(artifact.bytes, {
      crypto: subtle,
      keyProvider: async request => {
        expect(request).toEqual({
          packId: 'browser-encrypted',
          chunkId: 'chapter-2',
          keyId: 'chapter-key',
        });
        return cryptoKey;
      },
    });
    await expect(accepted.loadChunk('chapter-2')).resolves.toMatchObject({
      id: 'browser-chapter',
    });
  });
});
