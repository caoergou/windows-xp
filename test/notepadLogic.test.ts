/**
 * Notepad logic unit tests (#163/A+E).
 *
 * The editor's text operations were extracted from the 1313-line component into
 * pure functions; this exercises cursor positioning, find (with wrap-around),
 * and replace directly. The app previously had no unit coverage.
 */
import { describe, it, expect } from 'vitest';
import {
  getCursorPosition,
  findNextIndex,
  countOccurrences,
  replaceAll,
  equalsIgnoreCase,
} from '../src/apps/Notepad/logic';

describe('Notepad logic (#163)', () => {
  describe('getCursorPosition', () => {
    it('is line 1 col 1 at the start', () => {
      expect(getCursorPosition('hello', 0)).toEqual({ line: 1, col: 1 });
    });
    it('counts the column within the first line', () => {
      expect(getCursorPosition('hello', 3)).toEqual({ line: 1, col: 4 });
    });
    it('advances the line after each newline and resets the column', () => {
      const text = 'ab\ncde\nf';
      expect(getCursorPosition(text, 3)).toEqual({ line: 2, col: 1 }); // just after first \n
      expect(getCursorPosition(text, 6)).toEqual({ line: 2, col: 4 }); // end of 'cde'
      expect(getCursorPosition(text, 7)).toEqual({ line: 3, col: 1 }); // start of last line
    });
  });

  describe('findNextIndex', () => {
    const text = 'the cat sat on the mat';
    it('finds the next occurrence at or after the start index', () => {
      expect(findNextIndex(text, 'the', 0)).toBe(0);
      expect(findNextIndex(text, 'the', 1)).toBe(15);
    });
    it('wraps to the beginning when none remain after the start index', () => {
      expect(findNextIndex(text, 'the', 16)).toBe(0);
    });
    it('returns -1 for a missing query or an empty query', () => {
      expect(findNextIndex(text, 'dog', 0)).toBe(-1);
      expect(findNextIndex(text, '', 0)).toBe(-1);
    });
    it('is case-insensitive (XP default), matching regardless of case', () => {
      const mixed = 'Hello WORLD hello';
      expect(findNextIndex(mixed, 'hello', 0)).toBe(0); // matches "Hello"
      expect(findNextIndex(mixed, 'hello', 1)).toBe(12); // then "hello"
      expect(findNextIndex(mixed, 'WORLD', 0)).toBe(6);
      expect(findNextIndex(mixed, 'world', 0)).toBe(6); // lowercase query finds WORLD
    });
  });

  describe('countOccurrences / replaceAll', () => {
    it('counts non-overlapping matches', () => {
      expect(countOccurrences('a.b.c', '.')).toBe(2);
      expect(countOccurrences('aaa', 'aa')).toBe(1); // non-overlapping
      expect(countOccurrences('abc', 'x')).toBe(0);
      expect(countOccurrences('abc', '')).toBe(0);
    });
    it('replaces every occurrence', () => {
      expect(replaceAll('a.b.c', '.', '-')).toBe('a-b-c');
      expect(replaceAll('foo foo', 'foo', 'bar')).toBe('bar bar');
      expect(replaceAll('unchanged', 'zzz', 'x')).toBe('unchanged');
      expect(replaceAll('unchanged', '', 'x')).toBe('unchanged');
    });
    it('counts and replaces case-insensitively (XP default)', () => {
      expect(countOccurrences('Foo foo FOO', 'foo')).toBe(3);
      expect(replaceAll('Foo foo FOO', 'foo', 'X')).toBe('X X X');
    });
    it('treats regex-special queries literally', () => {
      expect(countOccurrences('a+b+c', '+')).toBe(2);
      expect(replaceAll('a+b+c', '+', '-')).toBe('a-b-c');
      // `$&` in the replacement must not be interpreted as a backreference.
      expect(replaceAll('a b', ' ', '$&')).toBe('a$&b');
    });
  });

  describe('equalsIgnoreCase', () => {
    it('compares ignoring case', () => {
      expect(equalsIgnoreCase('Hello', 'hello')).toBe(true);
      expect(equalsIgnoreCase('abc', 'abd')).toBe(false);
    });
  });
});
