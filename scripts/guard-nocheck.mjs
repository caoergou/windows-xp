#!/usr/bin/env node
/**
 * @ts-nocheck guard (#82, extracted to a file in #163/D).
 *
 * Fails if any `@ts-nocheck` escape hatch reappears under `src/`. The type-debt
 * cleanup in #82 drove these to zero; this keeps them there. Replaces the old
 * multi-line inline `node -e "…"` in package.json so the logic is maintainable.
 */
import { execSync } from 'node:child_process';

try {
  const out = execSync('grep -rn @ts-nocheck src', { encoding: 'utf8' });
  console.error('FAIL: @ts-nocheck reappeared in src/ (#82):\n' + out);
  process.exit(1);
} catch (e) {
  // grep exits 1 when there are no matches — that's the success case here.
  if (e.status === 1) {
    console.log('guard OK: no @ts-nocheck in src/');
  } else {
    throw e;
  }
}
