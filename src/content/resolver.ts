/**
 * ContentRef resolver (#241).
 *
 * Turns a {@link ContentRef} into its text, handling the three sources:
 * - inline `string` → returned as-is (no I/O),
 * - `{ url }` → fetched once and cached,
 * - `{ asset }` → looked up in the pack's `assets` manifest, then resolved.
 *
 * Resolution is **lazy** (a URL is fetched only on first access) and **cached**
 * (subsequent reads are synchronous-ish — one awaited cache hit). The cache is
 * pluggable: the default is an in-memory `Map`, but a host can pass an
 * IndexedDB-backed cache (see {@link storageContentCache}) so a fetched page
 * survives reloads and can be captured into a snapshot (#117 / PR-B).
 *
 * Failures degrade gracefully: {@link ContentResolver.resolveOrNull} returns
 * `null` (and logs) instead of throwing, so a missing asset or a dead URL can't
 * crash the desktop. {@link ContentResolver.resolve} throws a named error — the
 * caller that wants strictness (a lint pass, a pack-integrity check) uses it.
 */
import type { ContentRef } from './types';
import { isAssetRef, isInlineRef, isUrlRef } from './types';
import type { Storage } from '../utils/storage';

/**
 * A cache backend keyed by an opaque string. Both sync and async
 * implementations are allowed (the resolver always `await`s). The default is
 * in-memory; {@link storageContentCache} adapts an instance's {@link Storage}
 * handle so cached content persists.
 */
export interface ContentCache {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string): Promise<void> | void;
}

/** In-memory {@link ContentCache} — the default; scoped to one resolver. */
export function memoryContentCache(): ContentCache {
  const map = new Map<string, string>();
  return {
    get: key => (map.has(key) ? map.get(key)! : null),
    set: (key, value) => void map.set(key, value),
  };
}

/**
 * Adapt an instance {@link Storage} handle into a {@link ContentCache}. Cached
 * content lives in the same IndexedDB store as file content, under a reserved
 * `__contentref__` path prefix, so it stays isolated per instance (#95) and
 * survives reloads. In a `'none'` persistence instance this is just the handle's
 * in-memory backend, so it's still safe.
 */
export function storageContentCache(storage: Storage): ContentCache {
  return {
    get: key => storage.getFileContent(['__contentref__', key]),
    set: (key, value) => storage.saveFileContent(['__contentref__', key], value),
  };
}

/** Options for {@link createContentResolver}. */
export interface ResolverOptions {
  /** The pack's `assets` manifest (logical key → source) for `{ asset }` refs. */
  assets?: Record<string, ContentRef>;
  /** Fetches a URL's text. Defaults to the global `fetch`; SSR-safe (throws a clear error if none). */
  fetcher?: (url: string) => Promise<string>;
  /** Cache backend. Defaults to a private in-memory cache. */
  cache?: ContentCache;
  /** Pack id — namespaces cache keys so two packs' `{ asset: 'x' }` never collide. */
  packId?: string;
}

/** A resolver bound to one pack's assets/cache/fetcher. */
export interface ContentResolver {
  /** Resolve a ref to its text; throws {@link ContentResolveError} on failure. */
  resolve(ref: ContentRef): Promise<string>;
  /** Resolve a ref, returning `null` (and logging) on any failure. */
  resolveOrNull(ref: ContentRef): Promise<string | null>;
}

/** Thrown by {@link ContentResolver.resolve} when a ref can't be resolved. */
export class ContentResolveError extends Error {
  constructor(
    message: string,
    /** The ref that failed. */
    readonly ref: ContentRef,
    /** The underlying cause, if any. */
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ContentResolveError';
  }
}

const defaultFetcher = async (url: string): Promise<string> => {
  if (typeof fetch === 'undefined') {
    throw new Error('no global fetch available; pass a `fetcher` to createContentResolver');
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
};

// Guards an asset manifest that (mis)points one key at another; a small depth
// budget is enough — assets are meant to be concrete sources, not chains.
const MAX_ASSET_DEPTH = 8;

/**
 * Create a {@link ContentResolver} for a pack's assets. The resolver caches URL
 * (and resolved-asset) reads so repeated access is cheap, and namespaces cache
 * keys by `packId` when given.
 */
export function createContentResolver(options: ResolverOptions = {}): ContentResolver {
  const { assets = {}, fetcher = defaultFetcher, cache = memoryContentCache(), packId } = options;
  const ns = packId ? `${packId}::` : '';

  const resolveUrl = async (url: string, ref: ContentRef): Promise<string> => {
    const key = `${ns}url:${url}`;
    const cached = await cache.get(key);
    if (cached !== null && cached !== undefined) return cached;
    let text: string;
    try {
      text = await fetcher(url);
    } catch (cause) {
      throw new ContentResolveError(`failed to fetch content url "${url}"`, ref, cause);
    }
    await cache.set(key, text);
    return text;
  };

  const resolveRef = async (ref: ContentRef, depth: number): Promise<string> => {
    if (isInlineRef(ref)) return ref;
    if (isUrlRef(ref)) return resolveUrl(ref.url, ref);
    if (isAssetRef(ref)) {
      if (depth > MAX_ASSET_DEPTH) {
        throw new ContentResolveError(`asset reference chain too deep at "${ref.asset}"`, ref);
      }
      const source = assets[ref.asset];
      if (source === undefined) {
        throw new ContentResolveError(`unknown asset key "${ref.asset}"`, ref);
      }
      return resolveRef(source, depth + 1);
    }
    throw new ContentResolveError('unrecognized content reference', ref);
  };

  const resolve = (ref: ContentRef): Promise<string> => resolveRef(ref, 0);

  const resolveOrNull = async (ref: ContentRef): Promise<string | null> => {
    try {
      return await resolve(ref);
    } catch (err) {
      console.warn('[windows-xp] content resolve failed:', err);
      return null;
    }
  };

  return { resolve, resolveOrNull };
}
