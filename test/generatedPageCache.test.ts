// fake-indexeddb/auto must be imported BEFORE storage.ts so that the
// module-level `indexedDB` capture in storage.ts sees the fake factory.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeCacheUrl, createGeneratedPageCache } from '../src/content/generatedPageCache';
import { createStorage } from '../src/utils/storage';
import type { GeneratedPage } from '../src/providers/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let prefixCounter = 0;

function freshCache(opts?: { maxPages?: number; maxBytes?: number }) {
  const storage = createStorage(`gpc_test${++prefixCounter}_`, 'none');
  return createGeneratedPageCache(storage, opts);
}

const makePage = (html: string, title?: string): GeneratedPage => ({
  html,
  ...(title ? { title } : {}),
});

// ---------------------------------------------------------------------------
// normalizeCacheUrl
// ---------------------------------------------------------------------------

describe('normalizeCacheUrl', () => {
  it('strips the protocol', () => {
    expect(normalizeCacheUrl('https://example.com/path')).toBe('example.com/path');
    expect(normalizeCacheUrl('http://example.com/path')).toBe('example.com/path');
  });

  it('strips www. prefix', () => {
    expect(normalizeCacheUrl('https://www.example.com/path')).toBe('example.com/path');
  });

  it('strips trailing slash', () => {
    expect(normalizeCacheUrl('https://example.com/')).toBe('example.com/');
    expect(normalizeCacheUrl('https://example.com/page/')).toBe('example.com/page');
  });

  it('strips fragment (#hash)', () => {
    expect(normalizeCacheUrl('https://example.com/page#section')).toBe('example.com/page');
  });

  it('preserves query string', () => {
    expect(normalizeCacheUrl('https://example.com/search?q=test')).toBe(
      'example.com/search?q=test'
    );
  });

  it('normalizes to lowercase hostname', () => {
    expect(normalizeCacheUrl('https://Example.COM/Path')).toBe('example.com/Path');
  });

  it('handles protocol-relative URLs', () => {
    expect(normalizeCacheUrl('//www.example.com/page')).toBe('example.com/page');
  });
});

// ---------------------------------------------------------------------------
// Cache operations
// ---------------------------------------------------------------------------

describe('createGeneratedPageCache: basic operations', () => {
  let cache: ReturnType<typeof createGeneratedPageCache>;

  beforeEach(() => {
    cache = freshCache();
  });

  it('cache miss returns null', async () => {
    const result = await cache.get('https://nonexistent.com');
    expect(result).toBeNull();
  });

  it('put + get returns the stored page', async () => {
    const page = makePage('<h1>Hello</h1>', 'Hello Page');
    const ok = await cache.put('https://example.com/hello', page);
    expect(ok).toBe(true);

    const retrieved = await cache.get('https://example.com/hello');
    expect(retrieved).toEqual(page);
  });

  it('revisit returns identical page (cache hit)', async () => {
    const page = makePage('<p>cached</p>', 'Cached');
    await cache.put('https://example.com/cached', page);

    const first = await cache.get('https://example.com/cached');
    const second = await cache.get('https://example.com/cached');
    expect(first).toEqual(second);
    expect(first).toEqual(page);
  });

  it('URL normalization: same page is returned for equivalent URLs', async () => {
    const page = makePage('<p>norm</p>');
    await cache.put('https://www.example.com/page/', page);

    // Different form of the same URL should hit the cache.
    const result = await cache.get('http://example.com/page');
    expect(result).toEqual(page);
  });
});

// ---------------------------------------------------------------------------
// Budget enforcement
// ---------------------------------------------------------------------------

describe('createGeneratedPageCache: budget', () => {
  it('put fails when maxPages is exceeded', async () => {
    const cache = freshCache({ maxPages: 2 });

    expect(await cache.put('https://a.com', makePage('a'))).toBe(true);
    expect(await cache.put('https://b.com', makePage('b'))).toBe(true);
    // Third page exceeds the budget.
    expect(await cache.put('https://c.com', makePage('c'))).toBe(false);

    // The rejected page is not stored.
    expect(await cache.get('https://c.com')).toBeNull();
    // Existing pages are still there.
    expect(await cache.get('https://a.com')).toEqual(makePage('a'));
  });

  it('put fails when maxBytes is exceeded', async () => {
    // Set a very small byte budget.
    const cache = freshCache({ maxBytes: 100 });

    const smallPage = makePage('x');
    expect(await cache.put('https://small.com', smallPage)).toBe(true);

    // A large page that pushes past the byte budget.
    const largePage = makePage('y'.repeat(200));
    expect(await cache.put('https://large.com', largePage)).toBe(false);
    expect(await cache.get('https://large.com')).toBeNull();
  });

  it('re-putting an existing URL succeeds (update, not new entry)', async () => {
    const cache = freshCache({ maxPages: 1 });

    await cache.put('https://a.com', makePage('v1'));
    // Same URL should succeed even though we are at maxPages.
    const ok = await cache.put('https://a.com', makePage('v2'));
    expect(ok).toBe(true);
    expect(await cache.get('https://a.com')).toEqual(makePage('v2'));
  });
});

// ---------------------------------------------------------------------------
// hasCapacity
// ---------------------------------------------------------------------------

describe('createGeneratedPageCache: hasCapacity', () => {
  it('returns true when budget is not full', async () => {
    const cache = freshCache({ maxPages: 5 });
    expect(await cache.hasCapacity()).toBe(true);
  });

  it('returns false when maxPages is reached', async () => {
    const cache = freshCache({ maxPages: 1 });
    await cache.put('https://only.com', makePage('only'));
    expect(await cache.hasCapacity()).toBe(false);
  });

  it('returns false when maxBytes is reached', async () => {
    // JSON.stringify({ html: 'x'.repeat(39) }) is exactly 50 bytes.
    // put succeeds (0 + 50 is NOT > 50), then hasCapacity sees bytes == maxBytes.
    const cache = freshCache({ maxPages: 100, maxBytes: 50 });
    const ok = await cache.put('https://fill.com', makePage('x'.repeat(39)));
    expect(ok).toBe(true);
    expect(await cache.hasCapacity()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// stats
// ---------------------------------------------------------------------------

describe('createGeneratedPageCache: stats', () => {
  it('reports correct count and budget', async () => {
    const cache = freshCache({ maxPages: 10, maxBytes: 5000 });
    await cache.put('https://a.com', makePage('aaa'));
    await cache.put('https://b.com', makePage('bbb'));

    const s = await cache.stats();
    expect(s.count).toBe(2);
    expect(s.bytes).toBeGreaterThan(0);
    expect(s.maxPages).toBe(10);
    expect(s.maxBytes).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// clear
// ---------------------------------------------------------------------------

describe('createGeneratedPageCache: clear', () => {
  it('resets the cache: get returns null, stats show zero', async () => {
    const cache = freshCache();
    await cache.put('https://a.com', makePage('a'));
    await cache.put('https://b.com', makePage('b'));

    await cache.clear();

    expect(await cache.get('https://a.com')).toBeNull();
    expect(await cache.get('https://b.com')).toBeNull();

    const s = await cache.stats();
    expect(s.count).toBe(0);
    expect(s.bytes).toBe(0);
  });

  it('hasCapacity returns true after clear', async () => {
    const cache = freshCache({ maxPages: 1 });
    await cache.put('https://full.com', makePage('full'));
    expect(await cache.hasCapacity()).toBe(false);

    await cache.clear();
    expect(await cache.hasCapacity()).toBe(true);
  });
});
