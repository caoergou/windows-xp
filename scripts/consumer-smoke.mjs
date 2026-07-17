#!/usr/bin/env node
/**
 * consumer-smoke (#206) — consume the published package as a real npm user would.
 *
 * `#113` taught the lesson the hard way: a `sideEffects` field pointing at
 * non-existent `src/` paths implicitly declared the i18n-init entry side-effect
 * free, a time bomb only a real consumer project detonates. Nothing in CI ever
 * built *against the tarball* — `prepublishOnly` proves the artifacts exist, not
 * that they are usable. This does:
 *
 *   build:lib → npm pack → fresh Vite+React app → install the tarball →
 *   build the consumer → assert (render smoke, style.css, /components subpath,
 *   tree-shaking / i18n side-effect survival, React 18 + 19 type-check).
 *
 * Self-proving: break `sideEffects` (or the i18n init) and the render + bundle
 * assertions fail. Run with `node scripts/consumer-smoke.mjs`.
 */
import { execSync, spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONSUMER_TEMPLATE = path.join(REPO, 'scripts', 'consumer-smoke', 'consumer');

// Versions the package supports (peer range react 18||19). Pin the low end for
// the render build; the type-check step later swaps @types/react 18 ↔ 19.
const DEPS = ['react@18', 'react-dom@18', 'styled-components@6'];
const DEV_DEPS = ['vite@5', '@vitejs/plugin-react@4', 'typescript@5'];

// A distinctive translation only present if the i18n resources are bundled —
// the static half of the side-effect-survival proof.
const I18N_MARKER = 'This folder is encrypted. Enter the password to open it.';

let failures = 0;
const log = m => console.log(`\x1b[36m[consumer-smoke]\x1b[0m ${m}`);
const ok = m => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = m => {
  failures++;
  console.log(`  \x1b[31m✗ ${m}\x1b[0m`);
};
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const capture = (cmd, cwd) => execSync(cmd, { cwd, encoding: 'utf8' });

function collectJs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...collectJs(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function allFiles(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...allFiles(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

const globToRe = g =>
  new RegExp(
    '^' +
      g
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*\//g, '::GLOBSTAR::')
        .replace(/\*/g, '[^/]*')
        .replace(/::GLOBSTAR::/g, '(?:.*/)?') +
      '$'
  );

/**
 * The precise #113 guard: every path/glob in `sideEffects` (when it's an array)
 * MUST match at least one packaged file. #113's bomb was `sideEffects` pointing
 * at non-existent `src/` paths, which silently marks the real dist entries
 * side-effect free. `false`/`true` are valid explicit choices and skip the path
 * check (a real regression from them would trip the render/style assertions).
 */
function checkSideEffects(distFiles) {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
  const se = pkg.sideEffects;
  if (se === false || se === true || se === undefined) {
    ok(`sideEffects is ${JSON.stringify(se)} (no path claims to verify)`);
    return;
  }
  if (!Array.isArray(se))
    return bad(`sideEffects is neither boolean nor array: ${JSON.stringify(se)}`);
  for (const glob of se) {
    const re = globToRe(glob.replace(/^\.\//, ''));
    const hit = distFiles.some(f => re.test(f) || re.test(`dist/${f}`));
    if (hit) ok(`sideEffects entry "${glob}" matches packaged files`);
    else bad(`sideEffects entry "${glob}" matches NO packaged file — a #113-class dead path`);
  }
}

async function main() {
  // 1. Build the library and pack it exactly as `npm publish` would.
  log('building the library (build:lib)…');
  run('npm run build:lib', REPO);
  log('packing the tarball (npm pack)…');
  const packed = capture('npm pack --silent', REPO).trim().split('\n').pop().trim();
  const tarball = path.join(REPO, packed);
  if (!fs.existsSync(tarball)) throw new Error(`npm pack produced no tarball (${packed})`);
  ok(`packed ${packed}`);

  // sideEffects integrity — the deterministic #113 guard.
  checkSideEffects(allFiles(path.join(REPO, 'dist')));

  // 2. Scaffold a clean consumer in a temp dir and install the tarball + peers.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xp-consumer-'));
  log(`scaffolding consumer in ${tmp}`);
  fs.cpSync(CONSUMER_TEMPLATE, tmp, { recursive: true });
  try {
    run(`npm install --no-audit --no-fund ${DEPS.join(' ')} ${DEV_DEPS.join(' ')}`, tmp);
    run(`npm install --no-audit --no-fund "${tarball}"`, tmp);
    ok('installed tarball into a clean consumer');

    // 3. Build the consumer — proves `.`, `./components`, and `./style.css` all
    //    resolve from the published `exports` map.
    log('building the consumer app…');
    run('npm run build', tmp);
    ok('consumer production build succeeded (all export subpaths resolved)');

    const distDir = path.join(tmp, 'dist');
    const jsFiles = collectJs(distDir);
    const jsBlob = jsFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
    const cssFiles = fs.readdirSync(path.join(distDir, 'assets')).filter(f => f.endsWith('.css'));

    // 4. style.css actually shipped styles into the consumer build.
    if (cssFiles.length > 0) ok(`style.css emitted (${cssFiles.join(', ')})`);
    else bad('no CSS asset in the consumer build — style.css subpath did not ship styles');

    // 5. i18n side-effect survived tree-shaking (the #113 time bomb).
    if (jsBlob.includes(I18N_MARKER))
      ok('i18n resources present — init side-effect survived tree-shaking');
    else bad('i18n marker absent — the init side-effect was tree-shaken (check `sideEffects`)');

    // 6. Heavy apps stay code-split: no single chunk carries the whole app set
    //    into first paint. Solitaire's win logic is a good "heavy app" canary.
    const entry = jsFiles.find(f => /index|main/.test(path.basename(f)));
    const entrySrc = entry ? fs.readFileSync(entry, 'utf8') : jsBlob;
    if (!/Klondike|Solitaire win|foundationsComplete/i.test(entrySrc))
      ok('heavy apps are code-split (Solitaire not in the entry chunk)');
    else bad('a heavy app leaked into the entry chunk — lazy-loading regressed');

    // 7. Render smoke — the desktop paints and shows *translated* chrome. If the
    //    i18n init were dropped, these would be raw keys and this would fail.
    await renderSmoke(tmp);

    // 8. Types resolve against both supported React major type sets.
    typeCheck(tmp, '18');
    typeCheck(tmp, '19');
  } finally {
    fs.rmSync(tarball, { force: true });
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (failures > 0) {
    console.log(`\n\x1b[31mconsumer-smoke FAILED (${failures} check(s))\x1b[0m`);
    process.exit(1);
  }
  console.log('\n\x1b[32mconsumer-smoke OK — the package is consumable.\x1b[0m');
  process.exit(0);
}

async function renderSmoke(consumerDir) {
  log('render smoke (vite preview + Playwright)…');
  const preview = spawn('npm', ['run', 'preview'], {
    cwd: consumerDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Capture and log preview output so CI failures are actionable.
  let previewOut = '';
  preview.stdout.on('data', d => {
    const s = String(d);
    previewOut += s;
    process.stdout.write(`[preview:stdout] ${s}`);
  });
  preview.stderr.on('data', d => {
    const s = String(d);
    previewOut += s;
    process.stderr.write(`[preview:stderr] ${s}`);
  });
  preview.on('exit', (code, signal) => {
    log(`preview process exited with code ${code}, signal ${signal}`);
  });

  // Vite prints the bound URL (auto-picks a free port); parse it rather than
  // guessing, so a busy port never wedges the run. Give slow CI containers more
  // headroom than the original 20 s.
  //
  // Match on the ANSI-stripped *accumulated* output, not per chunk: CI forces
  // color and vite bolds the port, so the URL arrives split as
  // `http://localhost:\x1b[1m4173\x1b[22m/` (14 red main runs), and stdout
  // chunking may straddle the URL too.
  const PREVIEW_TIMEOUT_MS = 60000;
  const base = await new Promise(resolve => {
    // eslint-disable-next-line no-control-regex
    const ANSI_RE = /\x1b\[[0-9;]*m/g;
    const URL_RE = /https?:\/\/(?:localhost|127\.0\.0\.1):\d+\//;
    let scanned = '';
    const onData = d => {
      scanned += String(d).replace(ANSI_RE, '');
      const m = scanned.match(URL_RE);
      if (m) resolve(m[0]);
    };
    preview.stdout.on('data', onData);
    preview.stderr.on('data', onData);
    setTimeout(() => resolve(null), PREVIEW_TIMEOUT_MS);
  });

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  });
  try {
    if (!base) {
      preview.kill('SIGTERM');
      return bad(
        `consumer preview server never printed a URL within ${PREVIEW_TIMEOUT_MS}ms. Preview output:\n${previewOut.slice(-2000)}`
      );
    }
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    let up = false;
    for (let i = 0; i < 40 && !up; i++) {
      try {
        await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 1500 });
        up = true;
      } catch {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    if (!up) return bad(`consumer preview server never answered at ${base}`);

    await page.waitForSelector('[data-testid="taskbar"]', { timeout: 20000 });
    ok('WindowsXP rendered — taskbar present');

    const probe = page.locator('[data-testid="components-probe"]');
    const kind = await probe.getAttribute('data-kind');
    if (kind && kind !== 'undefined')
      ok(`/components subpath usable at runtime (StartButton is ${kind})`);
    else bad('/components subpath import did not resolve to a value');

    const body = await page.locator('body').innerText();
    if (/Recycle Bin|My Documents/.test(body))
      ok('desktop shows translated labels (i18n initialized)');
    else bad('no translated labels found — i18n did not initialize in the consumer');
  } finally {
    await browser.close();
    preview.kill('SIGTERM');
    // Give the preview process a grace period, then force-kill if it is still
    // alive. Without this the Node process can hang on open handles.
    await new Promise(r => setTimeout(r, 1000));
    if (!preview.killed) preview.kill('SIGKILL');
  }
}

function typeCheck(consumerDir, reactMajor) {
  log(`type-check against @types/react@${reactMajor}…`);
  try {
    run(
      `npm install --no-audit --no-fund @types/react@${reactMajor} @types/react-dom@${reactMajor}`,
      consumerDir
    );
    run('npx tsc -p tsconfig.json --noEmit', consumerDir);
    ok(`tsc passes with React ${reactMajor} types`);
  } catch {
    bad(`tsc failed against @types/react@${reactMajor} — published .d.ts not compatible`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
