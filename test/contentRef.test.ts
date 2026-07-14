/**
 * ContentRef / ContentPack model (#241): type guards, the three-source resolver
 * (inline / url / asset) with lazy caching + graceful degradation, URL
 * normalization for the IE site registry, and pack merging.
 */
// fake-indexeddb/auto before storage.ts so the module-level capture sees the fake.
import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import {
  isInlineRef,
  isUrlRef,
  isAssetRef,
  isContentRef,
  type ContentRef,
  type ContentPack,
} from '../src/content/types';
import {
  createContentResolver,
  memoryContentCache,
  storageContentCache,
  ContentResolveError,
} from '../src/content/resolver';
import {
  normalizeSiteUrl,
  buildSiteRegistry,
  lookupSite,
  mergeContentPacks,
} from '../src/content/pack';
import { createStorage } from '../src/utils/storage';

describe('ContentRef type guards (#241)', () => {
  it('discriminates the three shapes', () => {
    const inline: ContentRef = 'hello';
    const url: ContentRef = { url: 'https://x.dev/a.html' };
    const asset: ContentRef = { asset: 'letter' };

    expect(isInlineRef(inline)).toBe(true);
    expect(isInlineRef(url)).toBe(false);

    expect(isUrlRef(url)).toBe(true);
    expect(isUrlRef(inline)).toBe(false);
    expect(isUrlRef(asset)).toBe(false);

    expect(isAssetRef(asset)).toBe(true);
    expect(isAssetRef(url)).toBe(false);
  });

  it('isContentRef accepts refs and rejects junk', () => {
    expect(isContentRef('x')).toBe(true);
    expect(isContentRef({ url: 'u' })).toBe(true);
    expect(isContentRef({ asset: 'a' })).toBe(true);
    expect(isContentRef({ nope: 1 })).toBe(false);
    expect(isContentRef(null)).toBe(false);
    expect(isContentRef(42)).toBe(false);
  });
});

describe('createContentResolver (#241)', () => {
  it('returns an inline ref verbatim without I/O', async () => {
    const fetcher = vi.fn();
    const r = createContentResolver({ fetcher });
    expect(await r.resolve('inline body')).toBe('inline body');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fetches a url ref once and caches it', async () => {
    const fetcher = vi.fn(async (u: string) => `<html>${u}</html>`);
    const r = createContentResolver({ fetcher });
    const ref: ContentRef = { url: 'https://x.dev/page.html' };

    expect(await r.resolve(ref)).toBe('<html>https://x.dev/page.html</html>');
    expect(await r.resolve(ref)).toBe('<html>https://x.dev/page.html</html>');
    expect(fetcher).toHaveBeenCalledTimes(1); // cached on the second read
  });

  it('resolves an asset ref through the manifest', async () => {
    const r = createContentResolver({
      assets: { letter: 'Dear player,', page: { url: 'https://x.dev/p.html' } },
      fetcher: async () => '<p>fetched</p>',
    });
    expect(await r.resolve({ asset: 'letter' })).toBe('Dear player,');
    expect(await r.resolve({ asset: 'page' })).toBe('<p>fetched</p>');
  });

  it('throws a named error for an unknown asset key', async () => {
    const r = createContentResolver({ assets: {} });
    await expect(r.resolve({ asset: 'missing' })).rejects.toBeInstanceOf(ContentResolveError);
  });

  it('resolveOrNull degrades to null on failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = createContentResolver({
      fetcher: async () => {
        throw new Error('network down');
      },
    });
    expect(await r.resolveOrNull({ url: 'https://x.dev/dead' })).toBeNull();
    expect(await r.resolveOrNull({ asset: 'nope' })).toBeNull();
    warn.mockRestore();
  });

  it('guards against an asset chain that never bottoms out', async () => {
    // a → b → a … the resolver must give up rather than recurse forever.
    const r = createContentResolver({
      assets: { a: { asset: 'b' }, b: { asset: 'a' } },
    });
    await expect(r.resolve({ asset: 'a' })).rejects.toBeInstanceOf(ContentResolveError);
  });

  it('namespaces cache keys by packId so two packs never collide', async () => {
    const cache = memoryContentCache();
    const a = createContentResolver({ packId: 'packA', cache, fetcher: async () => 'A' });
    const b = createContentResolver({ packId: 'packB', cache, fetcher: async () => 'B' });
    const ref: ContentRef = { url: 'https://x.dev/shared' };
    expect(await a.resolve(ref)).toBe('A');
    expect(await b.resolve(ref)).toBe('B'); // not served packA's cached 'A'
  });

  it('persists fetched content through a storage-backed cache', async () => {
    const storage = createStorage('ctest_', 'local');
    const fetcher = vi.fn(async () => '<html>persisted</html>');
    const ref: ContentRef = { url: 'https://x.dev/persist.html' };

    const first = createContentResolver({ cache: storageContentCache(storage), fetcher });
    expect(await first.resolve(ref)).toBe('<html>persisted</html>');

    // A fresh resolver over the same storage-backed cache reads without refetching.
    const second = createContentResolver({ cache: storageContentCache(storage), fetcher });
    expect(await second.resolve(ref)).toBe('<html>persisted</html>');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe('normalizeSiteUrl (#149/#241)', () => {
  it('collapses protocol, www, trailing slash, fragment and case', () => {
    expect(normalizeSiteUrl('https://www.Example.com/')).toBe('example.com');
    expect(normalizeSiteUrl('http://example.com')).toBe('example.com');
    expect(normalizeSiteUrl('example.com#top')).toBe('example.com');
    expect(normalizeSiteUrl('  HTTP://WWW.FOO.COM/bar/  ')).toBe('foo.com/bar');
  });

  it('keeps the query string (a results page is not the home page)', () => {
    expect(normalizeSiteUrl('https://baidu.com/s?wd=x')).toBe('baidu.com/s?wd=x');
  });
});

describe('buildSiteRegistry / lookupSite (#241)', () => {
  it('keys sites by normalized url and looks them up tolerantly', () => {
    const reg = buildSiteRegistry({
      'https://www.myschool.edu/': { html: '<h1>School</h1>', title: 'School' },
    });
    expect(reg['myschool.edu']).toBeTruthy();
    expect(lookupSite(reg, 'http://myschool.edu')?.title).toBe('School');
    expect(lookupSite(reg, 'https://www.MYSCHOOL.edu/')?.title).toBe('School');
    expect(lookupSite(reg, 'https://other.com')).toBeUndefined();
  });

  it('reports a normalization collision to onConflict, last wins', () => {
    const conflicts: string[][] = [];
    const reg = buildSiteRegistry(
      {
        'http://foo.com': { html: 'first' },
        'https://www.foo.com/': { html: 'second' },
      },
      (norm, a, b) => conflicts.push([norm, a, b])
    );
    expect(conflicts).toEqual([['foo.com', 'http://foo.com', 'https://www.foo.com/']]);
    expect(reg['foo.com'].html).toBe('second');
  });
});

describe('mergeContentPacks (#241)', () => {
  const base: ContentPack = {
    id: 'base',
    assets: { logo: 'L1' },
    sites: { 'a.com': { html: 'A' } },
    files: {
      shared: {
        type: 'folder',
        name: 'shared',
        children: { 'x.txt': { type: 'file', name: 'x.txt', content: 'x' } },
      },
    },
    strings: { en: { greet: 'hi' }, zh: { greet: '你好' } },
  };
  const overlay: ContentPack = {
    id: 'overlay',
    assets: { logo: 'L2', extra: 'E' },
    sites: { 'b.com': { html: 'B' } },
    files: {
      shared: {
        type: 'folder',
        name: 'shared',
        children: { 'y.txt': { type: 'file', name: 'y.txt', content: 'y' } },
      },
    },
    strings: { en: { bye: 'bye' } },
  };

  it('merges assets/sites/strings (later wins) and deep-merges files', () => {
    const m = mergeContentPacks([base, overlay]);
    expect(m.ids).toEqual(['base', 'overlay']);
    expect(m.assets).toEqual({ logo: 'L2', extra: 'E' });
    expect(Object.keys(m.sites).sort()).toEqual(['a.com', 'b.com']);
    // Same folder key from both packs → children combined, not clobbered.
    const shared = m.files['shared'];
    expect(shared.type).toBe('folder');
    const children = (shared as { children: Record<string, unknown> }).children;
    expect(Object.keys(children).sort()).toEqual(['x.txt', 'y.txt']);
    expect(m.strings.en).toEqual({ greet: 'hi', bye: 'bye' });
    expect(m.strings.zh).toEqual({ greet: '你好' });
  });
});
