/**
 * guard:purity — 引擎纯净性护栏（#143 平台化预备，规则见 AGENTS.md 红线 11/12，
 * 细则见 docs/DEVELOPMENT.md §八）。四项检查：
 *
 *  1. 引擎目录零色值：机制层（context/hooks/utils/events/snapshot）不得出现
 *     颜色字面量——「机制」与「XP 的样子」分层，Phase B 时机制层原样成为引擎。
 *  2. xp.css 只允许入口文件引入：引擎/组件不得直接依赖 XP 皮肤表。
 *  3. 内联 hex 棘轮：src/ 全量内联色值只减不增（存量 ≈ FIDELITY §K STY-03 /
 *     #135 的 token 化欠账）。降到基线以下时按提示下调 HEX_BASELINE。
 *  4. 引擎目录禁止引入主题层（src/themes）：主题在引擎之上选定（#135 主题契约）。
 *
 * 计数在剥离注释后进行（issue 引用如 `#116` 常出现在注释里，是主要噪音源）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** src/ 内联 hex 色值存量基线：只许减少。降低后请同步更新此值。 */
const HEX_BASELINE = 1491; // 2026-07-12：#224 音量/sndvol32 混音器重建，内联 hex 换成 COLORS token 后下调；token 化欠账见 #135

/** 机制层：必须保持零色值、零 xp.css 依赖的目录/文件。 */
const ENGINE_PURE = ['src/context', 'src/hooks', 'src/utils', 'src/events.ts', 'src/snapshot.ts'];

/**
 * hex 棘轮豁免：营销落地页（#160）是构建在引擎之上的**消费层**，自带一套刻意
 * 非 XP Luna 的暗色/青色设计系统（COLORS token 不适用），不计入引擎的 token 化
 * 欠账。棘轮仍治理引擎与组件库代码。
 */
const RATCHET_EXCLUDE = ['src/site'];

/** 允许引入 xp.css 的入口文件（皮肤在入口挂载，不在模块内部渗透）。 */
const XPCSS_ENTRIES = new Set([
  'src/lib/index.tsx',
  // Multi-page site entries (#160) — the old src/main.tsx router was split into these.
  'src/demo/mountDemo.tsx',
  'src/gallery/gallery-main.tsx',
  'src/site/landing-main.tsx',
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
        failures.push(`引擎目录出现色值 ${posix}:${i + 1} → ${hexes.join(' ')}（红线 11：机制层禁止 XP 皮肤细节）`);
      }
    }
    if (XPCSS_IMPORT_RE.test(line) && !XPCSS_ENTRIES.has(posix)) {
      failures.push(`非入口文件引入 xp.css ${posix}:${i + 1}（仅允许：${[...XPCSS_ENTRIES].join(', ')}）`);
    }
    if (isEnginePure && THEMES_IMPORT_RE.test(line)) {
      failures.push(`引擎目录引入主题层 ${posix}:${i + 1}（红线 11：机制层禁止依赖 src/themes——主题在引擎之上选定）`);
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
  console.log(`guard OK: 引擎目录零色值；xp.css 仅入口引入；内联 hex ${totalHex}/${HEX_BASELINE}。`);
}
