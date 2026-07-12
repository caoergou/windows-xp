/**
 * Deep-link URL ⇆ path utilities (#136).
 */
import { describe, it, expect } from 'vitest';
import {
  parseOpenPath,
  serializeOpenPath,
  resolveRoutes,
  toOpenList,
} from '../src/utils/deepLink';

describe('parseOpenPath / serializeOpenPath (#136)', () => {
  it('splits a "/"-joined key path into segments', () => {
    expect(parseOpenPath('我的文档/readme.txt')).toEqual(['我的文档', 'readme.txt']);
    expect(parseOpenPath('Notepad')).toEqual(['Notepad']);
  });

  it('trims and drops empty segments (leading/trailing/double slashes)', () => {
    expect(parseOpenPath('/a//b/')).toEqual(['a', 'b']);
    expect(parseOpenPath('')).toEqual([]);
  });

  it('serializes segments URL-encoded, keeping "/" as the separator', () => {
    expect(serializeOpenPath(['My Documents', 'a b.txt'])).toBe('My%20Documents/a%20b.txt');
  });

  it('round-trips a path through serialize → decode → parse', () => {
    const path = ['我的文档', 'read me.txt'];
    const query = serializeOpenPath(path);
    // Simulate the browser decoding the query value before we parse it.
    const decoded = new URLSearchParams(`open=${query}`).get('open')!;
    expect(parseOpenPath(decoded)).toEqual(path);
  });
});

describe('toOpenList (#136)', () => {
  it('normalizes undefined / string / string[] to a list', () => {
    expect(toOpenList(undefined)).toEqual([]);
    expect(toOpenList('a')).toEqual(['a']);
    expect(toOpenList(['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('resolveRoutes (#136)', () => {
  const routes = {
    '/blog/:slug': (p: Record<string, string>) => ({ open: `D:/posts/${p.slug}.md` }),
    '/about': () => ({ open: ['我的文档', 'about.txt'].join('/') }),
    '/multi': () => ({ open: ['a', 'b'] }),
  };

  it('matches a :param pattern and passes the captured value to the handler', () => {
    expect(resolveRoutes(routes, '/blog/hello')).toEqual(['D:/posts/hello.md']);
  });

  it('matches a literal pattern', () => {
    expect(resolveRoutes(routes, '/about')).toEqual(['我的文档/about.txt']);
  });

  it('supports a route that opens several files', () => {
    expect(resolveRoutes(routes, '/multi')).toEqual(['a', 'b']);
  });

  it('returns [] when nothing matches (wrong length or literal mismatch)', () => {
    expect(resolveRoutes(routes, '/blog/a/b')).toEqual([]);
    expect(resolveRoutes(routes, '/unknown')).toEqual([]);
  });

  it('decodes percent-encoded param segments', () => {
    expect(resolveRoutes(routes, '/blog/hello%20world')).toEqual(['D:/posts/hello world.md']);
  });
});
