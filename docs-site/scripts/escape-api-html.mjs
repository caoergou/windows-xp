#!/usr/bin/env node
/**
 * TypeDoc renders JSDoc comment text verbatim into Markdown, so a comment like
 * "render native <button> elements" or a bare generic `Ref<T>` becomes a raw
 * `<button>` / `<T>` in the page. VitePress compiles Markdown as a Vue SFC and
 * reads those as (unclosed) HTML tags → "Element is missing end tag".
 *
 * Escape `<` / `>` to HTML entities in the generated API pages, but ONLY in
 * prose — never inside fenced ``` blocks or inline `code` spans, where the angle
 * brackets are meaningful and already safe. Runs after `typedoc` (#214).
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'api');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

const escapeProse = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Escape angle brackets in `text`, leaving inline `code` spans untouched. */
function escapeLineOutsideInlineCode(line) {
  return line
    .split(/(`[^`]*`)/)
    .map((seg) => (seg.startsWith('`') && seg.endsWith('`') ? seg : escapeProse(seg)))
    .join('');
}

function processFile(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let inFence = false;
  const out = lines.map((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    return escapeLineOutsideInlineCode(line);
  });
  writeFileSync(file, out.join('\n'));
}

let files;
try {
  files = walk(API_DIR);
} catch {
  console.error('escape-api-html: no api/ dir — run `typedoc` first.');
  process.exit(0);
}
files.forEach(processFile);
console.log(`escape-api-html: sanitized ${files.length} generated API page(s).`);
