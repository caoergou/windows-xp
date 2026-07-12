/**
 * App-build first-paint budget guard (#210).
 *
 * The site/demo build (`npm run build`) is what marketing/404-egg visitors load
 * first, so first-paint bytes are the product (docs/USE-CASES.md S3). This guard
 * fails CI if any JS chunk in `dist/assets/` exceeds CHUNK_BUDGET — the same
 * 500 kB line Vite only *warns* about — so the AppProviders chunk can't quietly
 * regress toward the old 734 kB (it was base64-inlining ~270 kB of icon PNGs).
 *
 * Run after `npm run build`. The library build has its own guard (check-size.mjs).
 */
import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ASSETS = new URL('../dist/assets', import.meta.url).pathname;
const CHUNK_BUDGET = 500 * 1024; // 500 kB minified per chunk (Vite's warn line, here a hard fail)

let files;
try {
  files = readdirSync(ASSETS).map(n => join(ASSETS, n));
} catch {
  console.error(`FAIL: ${ASSETS} not found — run \`npm run build\` first.`);
  process.exit(1);
}

const js = files.filter(f => ['.js', '.mjs'].includes(extname(f)));
const fmt = n => `${(n / 1024).toFixed(1)} kB`;

let failed = false;
for (const f of js) {
  const size = statSync(f).size;
  if (size > CHUNK_BUDGET) {
    console.error(
      `FAIL: ${f.replace(ASSETS + '/', '')} is ${fmt(size)} (budget ${fmt(CHUNK_BUDGET)}). ` +
        `Split it (manualChunks) or lazy-load; check for base64-inlined assets (assetsInlineLimit).`
    );
    failed = true;
  }
}

if (failed) process.exit(1);

const largest = js.reduce((a, f) => Math.max(a, statSync(f).size), 0);
console.log(`app bundle OK: ${js.length} JS chunks, largest ${fmt(largest)} (budget ${fmt(CHUNK_BUDGET)}).`);
