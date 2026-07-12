import { describe, it, expect } from 'vitest';
import en from '../src/i18n/locales/en.json';
import zh from '../src/i18n/locales/zh.json';

/**
 * Windows access-key mnemonics must render in the project's `File(F)` style,
 * never as a raw ampersand marker like `Mute(&M)` (#223 bug 3). A stray `&`
 * leaked into the tray volume popup's mute label in both locales; this guards
 * against any i18n value shipping the `&`-mnemonic spelling again.
 */
function collectStrings(obj: unknown, path: string, out: Array<[string, string]>): void {
  if (typeof obj === 'string') {
    out.push([path, obj]);
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      collectStrings(v, path ? `${path}.${k}` : k, out);
    }
  }
}

// Matches a Windows mnemonic ampersand before a letter (e.g. `&M`, `(&F)`),
// but not HTML entities like `&amp;` / `&#39;` / `&nbsp;`.
const MNEMONIC_AMP = /&(?!amp;|nbsp;|#\d)[A-Za-z]/;

describe('i18n mnemonics (#223)', () => {
  for (const [name, dict] of [
    ['en', en],
    ['zh', zh],
  ] as const) {
    it(`${name}.json has no raw \`&\` access-key mnemonics`, () => {
      const strings: Array<[string, string]> = [];
      collectStrings(dict, '', strings);
      const offenders = strings.filter(([, value]) => MNEMONIC_AMP.test(value));
      expect(offenders).toEqual([]);
    });
  }
});
