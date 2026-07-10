/**
 * Package size guard (issue #72).
 *
 * Fails the build if the library output regresses back toward the old
 * 17MB package: every JS chunk must stay under CHUNK_LIMIT and the
 * total dist size under TOTAL_LIMIT. Run after `npm run build:lib`.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname;
const CHUNK_LIMIT = 1 * 1024 * 1024; // 1MB per JS chunk
const TOTAL_LIMIT = 6 * 1024 * 1024; // 6MB dist total (npm pack ~3MB gzipped)

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
for (const f of files) {
  if (!['.js', '.mjs', '.cjs'].includes(extname(f))) continue;
  const size = statSync(f).size;
  if (size > CHUNK_LIMIT) {
    console.error(`FAIL: ${f.replace(DIST + '/', '')} is ${fmt(size)} (limit ${fmt(CHUNK_LIMIT)}) — assets are probably being inlined as base64 again`);
    failed = true;
  }
}
if (total > TOTAL_LIMIT) {
  console.error(`FAIL: dist totals ${fmt(total)} (limit ${fmt(TOTAL_LIMIT)})`);
  failed = true;
}

if (failed) process.exit(1);
console.log(`size check OK: dist ${fmt(total)}, ${files.length} files, largest JS chunk ${fmt(Math.max(...files.filter(f => ['.js', '.mjs', '.cjs'].includes(extname(f))).map(f => statSync(f).size)))}`);
