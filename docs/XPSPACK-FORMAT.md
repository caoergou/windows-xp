# `.xpspack` distribution format v1

Status: v1 format contract for issue #288. Deterministic export, none/gzip/brotli
chunk compression, separate binary assets, Ed25519 signing, and host-trusted
Node verification are implemented. The programmatic builder and isolated
browser/runtime loader support lazy AES-256-GCM chunks with host-provided keys,
Web Crypto Ed25519, verified asset materialization, and a host Brotli adapter.
CLI-authored chunk boundaries, hosted per-file fetching, asset compression, and
Scenario Studio export remain later phases.

## Goals and security boundary

`.xpspack` is a portable, deterministic distribution form of a validated
`ContentPack`. It supports transfer compression, host-controlled publisher
trust, and optional chapter encryption. It is not DRM. A player can inspect any
content and key already delivered to their browser.

Publisher trust and chapter authorization are host responsibilities. A public
key or symmetric key found inside the archive is never trusted. Scenario Studio
must not accept or persist private signing keys.

## Container and deployment forms

The offline artifact is a ZIP-compatible archive with the `.xpspack` suffix.
ZIP entries use the `STORE` method because payload compression is declared by
the manifest. A hosted deployment may expose the exact archive entries as
separate files under one base URL. This lets unreleased chunks remain
undownloaded and independently cacheable without defining a second format.

An archive contains only these paths:

```text
manifest.json
manifest.sig                 # present only when manifest.signature is non-null
chunks/<payload>
assets/<payload>
```

Paths are UTF-8, relative, slash-separated, and must not contain an empty
segment, `.` segment, `..` segment, backslash, drive prefix, leading slash, or
NUL. Every payload is listed exactly once in `manifest.json`; unlisted archive
entries and duplicate normalized paths are errors.

## Manifest v1

The normative machine-readable schema is
[`schema/xpspack-manifest.json`](../schema/xpspack-manifest.json). Unknown fields
are rejected so security-relevant metadata cannot be silently ignored.

- `formatVersion` is the integer `1`. Readers reject other versions before
  reading payloads. Backward-compatible additions require a new schema/version
  because v1 is closed.
- `packId` is the authored `ContentPack.id`.
- `rootChunk` names the chunk that contains the initial validated ContentPack.
- `chunks` contains JSON payloads. Chunk IDs and paths are unique, and
  `rootChunk` must resolve to exactly one item.
- `assets` contains binary or text asset payloads plus their media types. Asset
  IDs and paths are unique across all entries.
- `signature` is `null` for unsigned packs or identifies the host-trusted
  Ed25519 publisher key and the fixed `manifest.sig` path.

`sha256` is the lowercase hex digest of the exact stored payload bytes: after
compression and, when enabled, after encryption. `storedBytes` measures those
bytes; `uncompressedBytes` measures the plaintext before compression.

Content chunks use UTF-8 JSON. A local `{ url }` value in `ContentPack.assets`
becomes a separate byte-for-byte asset entry and is never coerced through UTF-8.
Its manifest ID is `asset:<logical-key>`; the root chunk carries an internal
`xpspack-asset:<logical-key>` placeholder so readers can reject unlinked or
mismatched entries. After size and SHA-256 verification, the offline readers
replace that placeholder with a media-type-preserving `data:` URL. Remote and
already-inline assets remain in the root chunk. This removes the packer's
text-only-inlining limitation without changing authored `ContentRef` semantics.

V1 writers currently store asset payloads with `compression: "none"` and
`encryption: null`. Readers reject other asset modes until their processing
order and host adapter contract are implemented.

## Canonical JSON and signature scope

`manifest.json` contains exactly the output of
`canonicalizeXpspackManifest()` with no BOM or trailing newline:

1. values are limited to JSON strings, booleans, null, arrays, objects, and
   non-negative safe integers allowed by the schema;
2. object keys are recursively sorted by ascending UTF-16 code units (all v1
   schema keys are ASCII);
3. array order is preserved;
4. encoding otherwise follows ECMAScript `JSON.stringify`;
5. the resulting string is encoded as UTF-8.

When signed, `manifest.sig` is the raw 64-byte Ed25519 signature over the exact
`manifest.json` bytes. The manifest includes only the signature algorithm,
`keyId`, and signature path—not the signature bytes or public key. Payload bytes
are covered transitively by their SHA-256 digests in the signed manifest. The
complete ZIP byte stream is not signed, so the same signed manifest works in
archive and expanded hosted deployments.

## Deterministic production

Given the same validated input and options, writers must produce identical
bytes.

- Sort payload entries by archive path using bytewise UTF-8 order; write
  `manifest.json`, optional `manifest.sig`, then the sorted payloads.
- Normalize ZIP timestamps to `1980-01-01T00:00:00` and omit platform-specific
  extra fields, comments, directory entries, and file ownership metadata.
- Set regular-file permissions to `0644` and the creator platform to Unix.
- Use ZIP `STORE`; ZIP64 is emitted only when required by size/count limits.
- `gzip`: level 9, `mtime = 0`, no filename or comment, OS byte 255.
- `brotli`: quality 11, generic mode, window 22, no size hint.
- `none`: store plaintext bytes unchanged.
- The root chunk is first; remaining chunks and all assets are sorted by `id`
  before canonicalization.

Encryption intentionally breaks reproducibility because every encryption must
use a fresh random nonce. Reproducibility applies to unencrypted builds. Tests
for encrypted builds must instead verify structure, integrity, and nonce
uniqueness; deterministic or caller-supplied production nonces are forbidden.

## Encryption

Optional chunks use AES-256-GCM with a fresh 96-bit nonce and a 128-bit tag.
Compression happens before encryption. The stored payload is ciphertext followed
by the authentication tag. `nonce` is unpadded base64url in the manifest.

Additional authenticated data is the UTF-8 encoding of this canonical JSON
object, which binds ciphertext to its declared role:

```json
{
  "algorithm": "AES-256-GCM",
  "compression": "brotli",
  "id": "chapter-2",
  "keyId": "chapter-2",
  "nonce": "mD_yqk6x8rN7vW0P",
  "packId": "example-story",
  "path": "chunks/chapter-2.json.br.enc"
}
```

The host receives `packId`, chunk `id`, and `keyId` through its asynchronous key
provider. Keys must not be written to artifacts, logs, snapshots, project files,
or persistent browser storage. A failed tag releases no plaintext.

## Verification and mounting order

Readers fail closed in this order:

1. enforce archive limits, safe paths, unique paths, and the fixed allowed path
   set while reading the central directory;
2. parse `manifest.json` with duplicate-key rejection, validate the v1 schema,
   and enforce cross-entry uniqueness and `rootChunk` resolution;
3. if signed, obtain the public key from host trust by `keyId` and verify
   `manifest.sig` over the exact manifest bytes;
4. require each declared payload and verify `storedBytes` and SHA-256 before
   decrypting or decompressing it;
5. obtain a chapter key only when that chunk is authorized, authenticate and
   decrypt it, then decompress it with output limits;
6. parse UTF-8 chunk JSON, validate its `ContentPack`, verify every linked asset,
   materialize its `data:` URL, and only then return the reconstructed pack.

Missing trust, a missing/extra entry, size/hash mismatch, invalid signature,
authentication failure, decompression limit, malformed JSON, or invalid pack is
a structured error. No partially verified pack is mounted.

Recommended defensive defaults are 10,000 entries, 512 MiB total stored bytes,
1 GiB total expanded bytes, and a 100:1 per-entry expansion ratio. Hosts may set
lower limits.

## Compatibility and key rotation

Existing JSON ContentPacks remain supported independently. The loader selects
JSON or xpspack explicitly or by validated content, never only by a filename
suffix.

Publisher key IDs are opaque host-controlled names. Rotation adds a new trusted
key ID and signs new packs with it. Hosts may keep the old public key for old
artifacts, then revoke it when those artifacts are retired. A compromised key ID
must be removed from host trust; embedding a replacement key in a pack does not
restore trust.

The CLI accepts private keys only through `--sign-key-env <name>` together with
`--sign-key-id <id>`. CI should populate that environment variable from its
secret manager. The value is parsed as an Ed25519 PEM private key and is never
printed, returned from `packDirectory()`, or written into the archive.

Node hosts pass trusted public keys directly to `readXpspack()`:

```ts
await readXpspack(bytes, {
  trustedSigningKeys: { 'publisher-2026': publicKey },
  requireSignature: true,
});
```

Browser hosts import the optional loader subpath so ZIP and crypto code never
enters the default engine bundle:

```ts
import { loadContentPackFromXpspack } from '@caoergou/windows-xp/content-pack-loader';

const { pack, loadChunk } = await loadContentPackFromXpspack(await response.arrayBuffer(), {
  trustedSigningKeys: { 'publisher-2026': publisherCryptoKey },
  requireSignature: true,
  keyProvider: async ({ packId, chunkId, keyId }) => fetchAuthorizedKey({ packId, chunkId, keyId }),
});

// No key is requested until the host authorizes and loads this chapter.
const chapter2 = await loadChunk('chapter-2');
```

The browser loader uses `DecompressionStream` for gzip. It verifies local binary
assets independently and materializes them as `data:` URLs without Blob URL
lifecycle or global state. Brotli support is
provided through the optional `decompress` callback because Brotli streaming is
not consistently exposed by the browser Compression Streams API. The callback
receives only stored bytes, the declared algorithm, and expected expanded size;
hash and size verification remain inside the loader. `loadChunk()` verifies the
stored hash, asks the host for a non-extractable AES-GCM `CryptoKey`, authenticates
the complete ciphertext, decompresses it, and validates the resulting
`ContentPack`. It does not persist the key or partial plaintext. Archive input is
decoded lazily but has already been downloaded; hosted per-file fetching remains
a separate transport phase.

Node verification failures use `XpspackError.code`, and browser failures use
`ContentPackLoadError.code`, including
`xpspack-signature-required`, `xpspack-signature-untrusted`,
`xpspack-signature-missing`, `xpspack-signature-invalid`, and
`xpspack-asset-hash`, `xpspack-key-unavailable`, and
`xpspack-decryption-failed`. Applications should localize these codes rather
than parsing English error messages.

## Fixture

`test/fixtures/xpspack/v1/` is the normative unsigned v1 fixture.
`manifest.json` is the reviewable logical manifest, while
`manifest.canonical.txt` records its exact archive bytes (the fixture file's
final newline is not part of those bytes). Tests verify schema validity,
canonical manifest bytes, and payload digests. Later phases will add signed,
compressed, corrupt, and encrypted fixtures without changing the v1 manifest
contract.
