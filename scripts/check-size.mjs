/**
 * Package size guard (issue #72).
 *
 * Fails the build if the library output regresses back toward the old
 * 17MB package: every JS chunk must stay under CHUNK_LIMIT and the
 * total dist size under TOTAL_LIMIT. Run after `npm run build:lib`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname;
const CHUNK_LIMIT = 1 * 1024 * 1024; // 1MB per JS chunk
// Total dist ceiling. Raised 7 -> 10MB (#213) to leave deliberate growth room
// for complete OS packages and their public entries while remaining well below
// the historical 17MB package that #72 set out to prevent. The stricter 1MB
// per-chunk ceiling remains unchanged and still catches accidentally inlined
// assets or other concentrated bundle regressions.
const TOTAL_LIMIT = 10 * 1024 * 1024; // 10MB dist total

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(DIST);
const total = files.reduce((sum, f) => sum + statSync(f).size, 0);
const fmt = n => `${(n / 1024 / 1024).toFixed(2)}MB`;

let failed = false;
for (const entry of ['index.es.js', 'index.cjs.js']) {
  const source = readFileSync(join(DIST, entry), 'utf8');
  if (source.includes('manifest.sig') || source.includes('xpspack ZIP')) {
    console.error(`FAIL: ${entry} contains the optional xpspack loader`);
    failed = true;
  }
}
for (const f of files) {
  if (!['.js', '.mjs', '.cjs'].includes(extname(f))) continue;
  const size = statSync(f).size;
  if (size > CHUNK_LIMIT) {
    console.error(
      `FAIL: ${f.replace(DIST + '/', '')} is ${fmt(size)} (limit ${fmt(CHUNK_LIMIT)}) — assets are probably being inlined as base64 again`
    );
    failed = true;
  }
}
if (total > TOTAL_LIMIT) {
  console.error(`FAIL: dist totals ${fmt(total)} (limit ${fmt(TOTAL_LIMIT)})`);
  failed = true;
}

if (failed) process.exit(1);
console.log(
  `size check OK: dist ${fmt(total)}, ${files.length} files, largest JS chunk ${fmt(Math.max(...files.filter(f => ['.js', '.mjs', '.cjs'].includes(extname(f))).map(f => statSync(f).size)))}`
);
