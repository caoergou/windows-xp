// Notepad pure logic (#163/A+E) — extracted from the component so the editor's
// text operations are unit-testable without a DOM.

/** 1-based line/column of a caret index within `text` (for the status bar). */
export const getCursorPosition = (
  text: string,
  caretIndex: number
): { line: number; col: number } => {
  const before = text.slice(0, caretIndex);
  const line = before.split('\n').length;
  const lastNewline = before.lastIndexOf('\n');
  const col = caretIndex - (lastNewline === -1 ? 0 : lastNewline + 1) + 1;
  return { line, col };
};

// Notepad's Find/Replace are CASE-INSENSITIVE by default, matching real XP
// Notepad (which offers a "Match case" checkbox that is off by default). Search
// and replace therefore fold case; a future "Match case" toggle would make this
// configurable (#163 note).
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Index of the next `query` occurrence at/after `fromIndex`, wrapping to the
 * start once, case-insensitively. Returns -1 if not present (or `query` is
 * empty). Mirrors the classic Notepad "Find Next" wrap-around.
 */
export const findNextIndex = (text: string, query: string, fromIndex: number): number => {
  if (!query) return -1;
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  const idx = haystack.indexOf(needle, fromIndex);
  if (idx !== -1) return idx;
  return haystack.indexOf(needle, 0);
};

/** Count of non-overlapping `query` occurrences in `text` (case-insensitive). */
export const countOccurrences = (text: string, query: string): number => {
  if (!query) return 0;
  const matches = text.match(new RegExp(escapeRegExp(query), 'gi'));
  return matches ? matches.length : 0;
};

/** Replace every occurrence of `query` with `replaceWith` (case-insensitive). */
export const replaceAll = (text: string, query: string, replaceWith: string): string => {
  if (!query) return text;
  // `$` in the replacement is escaped so replaceWith is treated literally.
  return text.replace(new RegExp(escapeRegExp(query), 'gi'), () => replaceWith);
};

/** Whether two strings are equal ignoring case (for single Replace). */
export const equalsIgnoreCase = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();
