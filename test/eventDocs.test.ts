/**
 * Event reference drift guard (#130).
 *
 * `src/events.ts` is the single source of truth for the XPEvent catalog; the
 * reference table on the docs site (docs-site/guide/events.md) is generated from
 * it by scripts/gen-events-doc.mjs.
 * This test runs the generator's `--check` path so a new/renamed event can never
 * merge without its documentation being regenerated (mirrors the doc-examples
 * import guard, #75).
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
const SCRIPT = join(ROOT, 'scripts', 'gen-events-doc.mjs');

describe('event reference docs', () => {
  it('docs event table is in sync with src/events.ts (run `npm run docs:events`)', () => {
    let ok = true;
    let output = '';
    try {
      output = execFileSync('node', [SCRIPT, '--check'], { cwd: ROOT, encoding: 'utf8' });
    } catch (e) {
      ok = false;
      output = (e as { stderr?: string; stdout?: string }).stderr || (e as { stdout?: string }).stdout || String(e);
    }
    expect(ok, output).toBe(true);
  });
});
