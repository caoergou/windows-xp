/**
 * guard:purity - engine purity guard (#143 platformization prep; rules in AGENTS.md red lines 11/12,
 * details in docs/DEVELOPMENT.md §8). Four checks:
 *
 *  1. Engine directories must contain zero color values: the mechanism layer (context/hooks/utils/events/snapshot)
 *     must not contain color literals - "mechanism" and "what XP looks like" are layered, so in Phase B the mechanism layer becomes the engine as-is.
 *  2. xp.css is only allowed to be imported by entry files: engine/components must not directly depend on the XP skin table.
 *  3. Inline hex ratchet: total inline color values in src/ only decrease (current stock ~ FIDELITY §K STY-03 /
 *     #135 tokenization debt). When it drops below the baseline, lower HEX_BASELINE accordingly.
 *  4. Engine directories must not import the theme layer (src/themes): themes are selected above the engine (#135 theme contract).
 *
 * Counting is performed after stripping comments (issue references like #116 often appear in comments and are the main noise source).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** src/ inline hex color value stock baseline: only decrease. Update this value after lowering. */
const HEX_BASELINE = 1485; // 2026-07-13: lowered after refine-qq normalized the QQ skin palette (inline hex in styles.ts converged to C.* palette references); tokenization debt see #135

/** Mechanism layer: directories/files that must keep zero color values and zero xp.css dependencies. */
const ENGINE_PURE = ['src/context', 'src/hooks', 'src/utils', 'src/events.ts', 'src/snapshot.ts'];

/**
 * Hex ratchet exemption: the marketing landing page (#160) is a **consumer layer** built on top of the engine,
 * with its own deliberately non-XP Luna dark/cyan design system (COLORS token does not apply), so it is not counted
 * toward the engine's tokenization debt. The ratchet still governs engine and component library code.
 */
const RATCHET_EXCLUDE = ['src/site'];

/** Entry files allowed to import xp.css (skin is mounted at the entry, not leaked inside modules). */
const XPCSS_ENTRIES = new Set([
  'src/lib/index.tsx',
  // Multi-page site entries (#160) — the old src/main.tsx router was split into these.
  'src/demo/mountDemo.tsx',
  'src/gallery/gallery-main.tsx',
  'src/site/landing-main.tsx',
  'src/site/lab-main.tsx',
]);

const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const XPCSS_IMPORT_RE = /(?:import\s+['"]|from\s+['"])xp\.css/;
// #135: the engine (mechanism) must never import the theme layer (src/themes).
// A theme is picked above the engine; the engine stays look-agnostic.
const THEMES_IMPORT_RE = /(?:from|import)\s+['"](?:\.\.?\/)+themes\//;

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:"'`])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(ts|tsx)$/.test(name)) yield path;
  }
}

const failures = [];
let totalHex = 0;

for (const file of walk('src')) {
  const posix = file.split('\\').join('/');
  const stripped = stripComments(readFileSync(file, 'utf8'));
  const lines = stripped.split('\n');

  const isEnginePure = ENGINE_PURE.some(p => posix === p || posix.startsWith(p + '/'));
  const isRatchetExcluded = RATCHET_EXCLUDE.some(p => posix === p || posix.startsWith(p + '/'));

  lines.forEach((line, i) => {
    const hexes = line.match(HEX_RE);
    if (hexes) {
      if (!isRatchetExcluded) totalHex += hexes.length;
      if (isEnginePure) {
        failures.push(
          `引擎目录出现色值 ${posix}:${i + 1} → ${hexes.join(' ')}（红线 11：机制层禁止 XP 皮肤细节）`
        );
      }
    }
    if (XPCSS_IMPORT_RE.test(line) && !XPCSS_ENTRIES.has(posix)) {
      failures.push(
        `非入口文件引入 xp.css ${posix}:${i + 1}（仅允许：${[...XPCSS_ENTRIES].join(', ')}）`
      );
    }
    if (isEnginePure && THEMES_IMPORT_RE.test(line)) {
      failures.push(
        `引擎目录引入主题层 ${posix}:${i + 1}（红线 11：机制层禁止依赖 src/themes——主题在引擎之上选定）`
      );
    }
  });
}

if (process.argv.includes('--print-count')) {
  console.log(totalHex);
  process.exit(0);
}

if (totalHex > HEX_BASELINE) {
  failures.push(
    `内联 hex 色值 ${totalHex} 个，超过基线 ${HEX_BASELINE}（红线 12：只减不增）。` +
      `新代码请引用 src/constants.ts 的 COLORS / FIDELITY.md §K.1 token，勿写字面量。`
  );
}

if (failures.length) {
  console.error('guard:purity FAIL\n' + failures.map(f => '  - ' + f).join('\n'));
  process.exit(1);
}

if (totalHex < HEX_BASELINE) {
  console.log(
    `guard OK（可收紧）：内联 hex 已降至 ${totalHex}（基线 ${HEX_BASELINE}）。` +
      `请把 scripts/guard-purity.mjs 的 HEX_BASELINE 下调到 ${totalHex}，锁住战果。`
  );
} else {
  console.log(
    `guard OK: 引擎目录零色值；xp.css 仅入口引入；内联 hex ${totalHex}/${HEX_BASELINE}。`
  );
}
