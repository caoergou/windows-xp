/**
 * Documentation drift guard (issue #75).
 *
 * Extracts every `import { A, B } from '@caoergou/windows-xp[/subpath]'`
 * statement found in README.md / README.zh-CN.md / USAGE.md code blocks and
 * asserts each imported name is actually exported by the corresponding
 * module, so docs can never again advertise exports that do not exist.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as rootExports from '../src/lib';
import * as componentExports from '../src/lib/components';
import * as appExports from '../src/lib/apps';
import * as hookExports from '../src/lib/hooks';
import * as themeExports from '../src/lib/theme';
import * as registryExports from '../src/lib/registry';

const MODULES: Record<string, Record<string, unknown>> = {
  '': rootExports,
  '/components': componentExports,
  '/apps': appExports,
  '/hooks': hookExports,
  '/theme': themeExports,
  '/registry': registryExports,
};

const DOC_FILES = ['README.md', 'README.zh-CN.md', 'USAGE.md'];

interface DocImport {
  file: string;
  subpath: string;
  names: string[];
}

const collectDocImports = (): DocImport[] => {
  const results: DocImport[] = [];
  const importRe =
    /import\s*(?:type\s*)?\{([^}]+)\}\s*from\s*['"]@caoergou\/windows-xp(\/[\w-]+)?['"]/g;
  for (const file of DOC_FILES) {
    const content = readFileSync(join(__dirname, '..', file), 'utf8');
    for (const match of content.matchAll(importRe)) {
      const names = match[1]
        .split(',')
        .map(name => name.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean);
      results.push({ file, subpath: match[2] ?? '', names });
    }
  }
  return results;
};

describe('documentation import examples', () => {
  const docImports = collectDocImports();

  it('finds import examples to verify (sanity check)', () => {
    expect(docImports.length).toBeGreaterThan(0);
  });

  for (const { file, subpath, names } of docImports) {
    const moduleExports = MODULES[subpath];

    it(`${file}: '@caoergou/windows-xp${subpath}' is a documented subpath`, () => {
      expect(
        moduleExports,
        `docs reference unknown subpath '@caoergou/windows-xp${subpath}'`
      ).toBeDefined();
    });

    if (!moduleExports) continue;

    for (const name of names) {
      it(`${file}: '${name}' is exported from '@caoergou/windows-xp${subpath}'`, () => {
        expect(
          name in moduleExports,
          `${file} imports '${name}' from '@caoergou/windows-xp${subpath}' but the module does not export it`
        ).toBe(true);
      });
    }
  }
});
