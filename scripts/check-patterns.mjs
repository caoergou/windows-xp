/* eslint-disable no-console -- CI check output is the script's public interface. */
/**
 * Pattern-library fixture check (#239) — "AI drafts, deterministic tools adjudicate",
 * applied to the pattern library itself.
 *
 * Every fenced ```json block in docs/SCENARIO-PATTERNS.md is required to be a
 * complete scenario / puzzle graph / content pack that passes the real
 * authoring lint (the same `xp-scenario lint` adjudicator authors run). This
 * script extracts each block and lints it, so a schema or event-catalog change
 * that invalidates a documented recipe fails CI instead of rotting silently.
 * ```jsonc blocks are illustrative fragments / anti-examples and are skipped.
 *
 * Unlike user scenarios (where lint warnings stay advisory), the curated
 * library must lint clean: warnings fail the check too, so every recipe keeps
 * modelling best practice.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createJiti } from 'jiti';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = path.join(root, 'docs', 'SCENARIO-PATTERNS.md');

/** Extract fenced ```json blocks (strict info string) with their section heading. */
const extractFixtures = markdown => {
  const fixtures = [];
  let heading = '(preamble)';
  let fence = null; // { line, body: string[] }
  const lines = markdown.split('\n');
  lines.forEach((line, index) => {
    if (fence) {
      if (line.trim() === '```') {
        fixtures.push({ heading, line: fence.line, source: fence.body.join('\n') });
        fence = null;
      } else {
        fence.body.push(line);
      }
      return;
    }
    const head = line.match(/^#{1,3}\s+(.*)$/);
    if (head) heading = head[1].trim();
    if (line.trim() === '```json') fence = { line: index + 1, body: [] };
  });
  return fixtures;
};

const markdown = await readFile(DOC, 'utf8');
const fixtures = extractFixtures(markdown);
if (fixtures.length === 0) {
  console.error(`check-patterns: no \`\`\`json fixtures found in ${path.relative(root, DOC)}`);
  process.exit(1);
}

// Load the real adjudicator through jiti (the tools are TypeScript sources).
const jiti = createJiti(pathToFileURL(path.join(root, 'scripts', '_')).href, {
  interopDefault: false,
});
const { lintValue } = await jiti.import(path.join(root, 'tools/scenario-tools/src/lint.ts'));
const { detectKind } = await jiti.import(path.join(root, 'tools/scenario-tools/src/loader.ts'));

let errorCount = 0;
let warningCount = 0;
for (const fixture of fixtures) {
  const label = `${path.relative(root, DOC)}:${fixture.line} (${fixture.heading})`;
  let value;
  try {
    value = JSON.parse(fixture.source);
  } catch (error) {
    errorCount += 1;
    console.error(`FAIL ${label}\n  invalid JSON: ${error.message}`);
    continue;
  }
  let kind;
  try {
    kind = detectKind(value);
  } catch (error) {
    errorCount += 1;
    console.error(`FAIL ${label}\n  ${error.message}`);
    continue;
  }
  const result = await lintValue(kind, value, { baseDir: path.dirname(DOC) });
  const errors = result.diagnostics.filter(item => item.level === 'error');
  const warnings = result.diagnostics.filter(item => item.level === 'warning');
  warningCount += warnings.length;
  if (errors.length > 0) {
    errorCount += errors.length;
    console.error(`FAIL ${label} [${kind}]`);
    errors.forEach(item =>
      console.error(`  ERROR [${item.code}]${item.path ? ` (${item.path})` : ''}: ${item.message}`)
    );
  } else {
    console.log(`ok   ${label} [${kind}]`);
  }
  warnings.forEach(item =>
    console.log(`  warning [${item.code}]${item.path ? ` (${item.path})` : ''}: ${item.message}`)
  );
}

console.log(
  `check-patterns: ${fixtures.length} fixture(s), ${errorCount} error(s), ${warningCount} warning(s)`
);
if (errorCount > 0 || warningCount > 0) {
  console.error('check-patterns: the pattern library must lint clean (zero errors AND warnings)');
  process.exit(1);
}
