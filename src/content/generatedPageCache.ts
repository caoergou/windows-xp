/**
 * Generated web page cache (#149).
 *
 * Caches LLM-generated pages into the instance's IndexedDB-backed storage,
 * keyed by normalized URL. A page is generated once, then static forever
 * (revisiting yields the identical page). Budget controls:
 * - Max pages (default 200)
 * - Max total bytes (default 2 MB)
 * Budget exceeded → the provider is not called; IE shows an error page
 * (fits the 2005 narrative — "pages always went down").
 */
import type { Storage } from '../utils/storage';
import type { GeneratedPage } from '../providers/types';

const CACHE_PREFIX = '__generated_web__';
const META_KEY = `${CACHE_PREFIX}__meta__`;

export interface GeneratedPageCacheOptions {
  maxPages?: number;
  maxBytes?: number;
}

interface CacheMeta {
  count: number;
  bytes: number;
  urls: string[];
}

const DEFAULT_MAX_PAGES = 200;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Normalize a URL for cache-key purposes: lowercase host, strip fragment,
 * strip trailing slash, drop default ports.
 */
export function normalizeCacheUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('//') ? `http:${url}` : url, 'http://localhost');
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    let path = parsed.pathname.replace(/\/+$/, '') || '/';
    const search = parsed.search;
    return `${host}${path}${search}`;
  } catch {
    return url
      .toLowerCase()
      .replace(/[#?].*$/, '')
      .replace(/\/+$/, '');
  }
}

export interface GeneratedPageCache {
  /** Look up a cached page. Returns null on cache miss. */
  get(url: string): Promise<GeneratedPage | null>;
  /** Store a generated page. Returns false if the budget is exceeded. */
  put(url: string, page: GeneratedPage): Promise<boolean>;
  /** Whether the budget allows one more page. */
  hasCapacity(): Promise<boolean>;
  /** Current cache stats. */
  stats(): Promise<{ count: number; bytes: number; maxPages: number; maxBytes: number }>;
  /** Clear all cached pages. */
  clear(): Promise<void>;
}

export function createGeneratedPageCache(
  storage: Storage,
  options: GeneratedPageCacheOptions = {}
): GeneratedPageCache {
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  async function getMeta(): Promise<CacheMeta> {
    const raw = await storage.getFileContent([META_KEY]);
    if (!raw) return { count: 0, bytes: 0, urls: [] };
    try {
      return JSON.parse(raw) as CacheMeta;
    } catch {
      return { count: 0, bytes: 0, urls: [] };
    }
  }

  async function setMeta(meta: CacheMeta): Promise<void> {
    await storage.saveFileContent([META_KEY], JSON.stringify(meta));
  }

  function cacheKey(normalizedUrl: string): string {
    return `${CACHE_PREFIX}${normalizedUrl}`;
  }

  return {
    async get(url: string): Promise<GeneratedPage | null> {
      const key = normalizeCacheUrl(url);
      const raw = await storage.getFileContent([cacheKey(key)]);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as GeneratedPage;
      } catch {
        return null;
      }
    },

    async put(url: string, page: GeneratedPage): Promise<boolean> {
      const key = normalizeCacheUrl(url);
      const serialized = JSON.stringify(page);
      const byteSize = new TextEncoder().encode(serialized).length;
      const meta = await getMeta();

      const existing = meta.urls.includes(key);
      if (!existing && (meta.count >= maxPages || meta.bytes + byteSize > maxBytes)) {
        return false;
      }

      await storage.saveFileContent([cacheKey(key)], serialized);

      if (!existing) {
        meta.count++;
        meta.bytes += byteSize;
        meta.urls.push(key);
      }
      await setMeta(meta);
      return true;
    },

    async hasCapacity(): Promise<boolean> {
      const meta = await getMeta();
      return meta.count < maxPages && meta.bytes < maxBytes;
    },

    async stats() {
      const meta = await getMeta();
      return { count: meta.count, bytes: meta.bytes, maxPages, maxBytes };
    },

    async clear(): Promise<void> {
      const meta = await getMeta();
      for (const url of meta.urls) {
        await storage.saveFileContent([cacheKey(url)], '');
      }
      await setMeta({ count: 0, bytes: 0, urls: [] });
    },
  };
}
