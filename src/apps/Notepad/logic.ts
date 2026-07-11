// Notepad pure logic (#163/A+E) — extracted from the component so the editor's
// text operations are unit-testable without a DOM.

/** 1-based line/column of a caret index within `text` (for the status bar). */
export const getCursorPosition = (text: string, caretIndex: number): { line: number; col: number } => {
  const before = text.slice(0, caretIndex);
  const line = before.split('\n').length;
  const lastNewline = before.lastIndexOf('\n');
  const col = caretIndex - (lastNewline === -1 ? 0 : lastNewline + 1) + 1;
  return { line, col };
};

/**
 * Index of the next `query` occurrence at/after `fromIndex`, wrapping to the
 * start once. Returns -1 if not present (or `query` is empty). Mirrors the
 * classic Notepad "Find Next" wrap-around.
 */
export const findNextIndex = (text: string, query: string, fromIndex: number): number => {
  if (!query) return -1;
  const idx = text.indexOf(query, fromIndex);
  if (idx !== -1) return idx;
  return text.indexOf(query, 0);
};

/** Count of non-overlapping `query` occurrences in `text`. */
export const countOccurrences = (text: string, query: string): number => {
  if (!query) return 0;
  return text.split(query).length - 1;
};

/** Replace every occurrence of `query` with `replaceWith`. */
export const replaceAll = (text: string, query: string, replaceWith: string): string => {
  if (!query) return text;
  return text.split(query).join(replaceWith);
};
