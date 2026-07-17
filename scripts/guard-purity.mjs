/**
 * guard:purity - engine purity guard (#143 platformization prep; rules in AGENTS.md red lines 11/12,
 * details in docs/DEVELOPMENT.md §7/§8). Seven checks:
 *
 *  1. Engine directories must contain zero color values: the mechanism layer (context/hooks/utils/events/snapshot)
 *     must not contain color literals - "mechanism" and "what XP looks like" are layered, so in Phase B the mechanism layer becomes the engine as-is.
 *  2. xp.css is only allowed to be imported by the theme layer (src/themes/): it feeds `OSTheme.css`
 *     as an `?inline` string and entries mount it at runtime via `mountThemeCss` (#213 B1) —
 *     no entry hardcodes the skin anymore.
 *  3. Inline hex ratchet (#213: baseline 0): outside the theme token layer and the declared
 *     brand-palette blocks there are NO inline color literals in src/ — and it stays that way.
 *  4. Engine directories must not import the theme layer (src/themes): themes are selected above the engine (#135 theme contract).
 *  5. Engine directories must not import asset files (images/cursors/audio): look and sound reach
 *     the mechanism layer via theme registries / runtime injection only (#213).
 *  6. brand-palette markers only appear in allow-listed files, balanced (#213 batch 4).
 *  7. Apps/components/devtools must not import `themes/xp` directly (#213 B1 end-state): XP
 *     tokens/fonts/assets/skin reach them only through the theme context / contract.
 *
 * Counting is performed after stripping comments (issue references like #116 often appear in comments and are the main noise source).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** src/ inline hex color value stock baseline: only decrease. Update this value after lowering. */
// #213 end-state: ZERO inline hexes outside the two sanctioned stores — the theme token
// layer (src/themes, ratchet-exempt) and the allow-listed brand-palette marker blocks.
// New chrome colours go into src/themes/xp/tokens.ts; new app-identity colours go into a
// declared brand-palette block. There is no third place.
const HEX_BASELINE = 0; // 2026-07-16: #213 batch 4 — 1482 → 0 (theme layer + declared brand palettes are the only colour sources)

/** Mechanism layer: directories/files that must keep zero color values and zero xp.css dependencies. */
const ENGINE_PURE = ['src/context', 'src/hooks', 'src/utils', 'src/events.ts', 'src/snapshot.ts'];

/**
 * Hex ratchet exemptions (#213 accounting):
 *  - src/site: the marketing landing page (#160) is a **consumer layer** with its own
 *    deliberately non-XP design system (COLORS does not apply).
 *  - src/themes: the sanctioned token layer — colour literals are the POINT of this layer
 *    (THEMING.md); tokens.ts is the single source the rest of src/ references, so its
 *    contents are the ledger, not debt. Everything outside it stays ratcheted.
 */
const RATCHET_EXCLUDE = ['src/site', 'src/themes'];

/**
 * Brand-palette marker exemption (#213 batch 4): culture/era apps and app-content palettes
 * keep their period identity as **centrally declared local constants** — they must NOT
 * follow the OS theme (QQ 2006 stays QQ 2006 when the theme is swapped, #143). Hexes are
 * exempt from the ratchet ONLY inside a `brand-palette:start`…`brand-palette:end` block,
 * and only in the files allow-listed here; inline hexes outside the block still count,
 * and markers anywhere else fail the guard.
 */
const BRAND_PALETTE_FILES = new Set([
  'src/apps/QQ/styles.ts',
  'src/apps/SafeGuard360.tsx',
  'src/apps/Thunder.tsx',
  'src/apps/KugouMusic.tsx',
  'src/apps/BaofengPlayer.tsx',
  'src/apps/WPSOffice.tsx',
  'src/apps/Winamp.tsx',
  'src/apps/ITunes.tsx',
  'src/apps/UTorrent.tsx',
  'src/apps/MicrosoftOffice.tsx',
  'src/apps/NortonAntiVirus.tsx',
  'src/apps/BrowserPlugins.tsx',
  'src/apps/InternetExplorer/components/SearchEnginePage.tsx',
  'src/apps/MicrosoftPaint/constants.ts',
  'src/apps/CommandPrompt/constants.ts',
  'src/apps/Solitaire.tsx',
  'src/apps/WindowsMediaPlayer.tsx',
  'src/apps/Calculator.tsx',
  'src/components/StickyNote.tsx',
  'src/components/ErrorBoundary.tsx',
]);
const BRAND_START = 'brand-palette:start';
const BRAND_END = 'brand-palette:end';

/**
 * xp.css (the npm skin table) may only be imported by the theme layer
 * (src/themes/) — as an `?inline` string feeding `OSTheme.css`; entries mount
 * it at runtime via `mountThemeCss` (#213 B1). Nothing else imports it.
 */
const XPCSS_THEME_LAYER = 'src/themes/';

/**
 * #213 B1 end-state (check 7): app/component/devtool code reaches XP tokens,
 * fonts, assets and the skin ONLY through the theme context / contract — a
 * direct `themes/xp` import re-couples the consumer to one OS package.
 * Allow-list: the composition root, which binds the default OS package
 * (lifts out when the package splits into engine + os-xp, #143/B5).
 */
const XP_IMPORT_BAN_DIRS = ['src/apps', 'src/components', 'src/devtools'];
const XP_IMPORT_ALLOW = new Set(['src/components/AppProviders.tsx']);

const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const XPCSS_IMPORT_RE = /(?:import\s+['"]|from\s+['"])xp\.css/;
// #213: the mechanism layer must not bind look/sound assets either — images, cursors and
// audio reach the engine through runtime registries (theme assets / soundManager.register).
const ASSET_IMPORT_RE = /from\s+['"][^'"]+\.(?:png|jpe?g|gif|webp|svg|cur|ico|wav|mp3|ogg)['"]/;
// #135: the engine (mechanism) must never import the theme layer (src/themes).
// A theme is picked above the engine; the engine stays look-agnostic.
const THEMES_IMPORT_RE = /(?:from|import)\s+['"](?:\.\.?\/)+themes\//;
// #213 B1 end-state: app/component code must not import the XP package directly
// (themes/xp) — only the contract/accessors (themes/contract, themes/useOSTheme).
const XP_PACKAGE_IMPORT_RE = /(?:from|import)\s+['"](?:\.\.?\/)+themes\/xp(?:[/'"])/;

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
  const raw = readFileSync(file, 'utf8');
  const rawLines = raw.split('\n');
  const lines = stripComments(raw).split('\n');

  const isEnginePure = ENGINE_PURE.some(p => posix === p || posix.startsWith(p + '/'));
  const isRatchetExcluded = RATCHET_EXCLUDE.some(p => posix === p || posix.startsWith(p + '/'));
  const brandAllowed = BRAND_PALETTE_FILES.has(posix);
  const isXpImportBanned =
    XP_IMPORT_BAN_DIRS.some(p => posix.startsWith(p + '/')) && !XP_IMPORT_ALLOW.has(posix);

  // Brand-palette markers live in comments — track them on the RAW lines.
  let inBrand = false;
  lines.forEach((line, i) => {
    const rawLine = rawLines[i] ?? '';
    if (rawLine.includes(BRAND_START)) {
      if (!brandAllowed) {
        failures.push(
          `brand-palette 标记出现在未登记文件 ${posix}:${i + 1}（豁免仅限 scripts/guard-purity.mjs 的 BRAND_PALETTE_FILES 白名单）`
        );
      } else if (inBrand) {
        failures.push(`brand-palette 标记嵌套/未闭合 ${posix}:${i + 1}`);
      } else {
        inBrand = true;
      }
    }

    const hexes = line.match(HEX_RE);
    if (hexes) {
      if (!isRatchetExcluded && !(inBrand && brandAllowed)) totalHex += hexes.length;
      if (isEnginePure) {
        failures.push(
          `引擎目录出现色值 ${posix}:${i + 1} → ${hexes.join(' ')}（红线 11：机制层禁止 XP 皮肤细节）`
        );
      }
    }
    if (XPCSS_IMPORT_RE.test(line) && !posix.startsWith(XPCSS_THEME_LAYER)) {
      failures.push(
        `主题层之外引入 xp.css ${posix}:${i + 1}（xp.css 仅允许 src/themes/ 以 ?inline 引入，经 OSTheme.css + mountThemeCss 运行期挂载）`
      );
    }
    if (isXpImportBanned && XP_PACKAGE_IMPORT_RE.test(line)) {
      failures.push(
        `直接引入 themes/xp ${posix}:${i + 1}（#213 终态：仅经 theme 上下文/契约到达 XP；组合根例外见 guard 文件 XP_IMPORT_ALLOW）`
      );
    }
    if (isEnginePure && THEMES_IMPORT_RE.test(line)) {
      failures.push(
        `引擎目录引入主题层 ${posix}:${i + 1}（红线 11：机制层禁止依赖 src/themes——主题在引擎之上选定）`
      );
    }
    if (isEnginePure && ASSET_IMPORT_RE.test(line)) {
      failures.push(
        `引擎目录直接引入资产文件 ${posix}:${i + 1}（#213：图像/光标/音频经主题资产注册表或运行时注入到达引擎）`
      );
    }

    if (rawLine.includes(BRAND_END)) {
      if (inBrand) inBrand = false;
      else if (brandAllowed) failures.push(`brand-palette 结束标记缺少起始 ${posix}:${i + 1}`);
    }
  });
  if (inBrand) failures.push(`brand-palette 标记未闭合（文件末尾仍在豁免块内）: ${posix}`);
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
    `guard OK: 引擎目录零色值；xp.css 仅主题层引入；内联 hex ${totalHex}/${HEX_BASELINE}；apps/components/devtools 对 themes/xp 零直引。`
  );
}
