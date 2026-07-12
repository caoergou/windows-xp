import type { CulturePackage } from './types';
import { localeMatchesItem } from './types';

/**
 * Culture authoring factory (#129).
 *
 * `defineCulture()` is an identity function over {@link CulturePackage} that,
 * in dev builds, validates the package and warns (naming the offending field)
 * instead of letting authoring mistakes fail silently at click time:
 *
 *  - a `startMenu` item's `nameKey` that the package's own `i18n` doesn't define
 *    (built-ins may still provide it, so this is a hint, not an error);
 *  - a desktop shortcut / start-menu item whose `locales` don't overlap the
 *    package `locales` (it would never show);
 *  - duplicate item ids;
 *  - empty `desktopShortcuts[].app`.
 *
 * App-id-vs-registry checks happen at registration (they must respect the
 * `apps` prop), not here.
 */
const IS_DEV = import.meta.env?.DEV ?? true;

const warn = (msg: string) => console.warn(`[windows-xp] defineCulture: ${msg}`);

function validate(pkg: CulturePackage): void {
  const label = pkg.id || '(no id)';
  if (!pkg.id) warn('`id` is required.');
  if (!pkg.displayName) warn(`"${label}": \`displayName\` is required.`);
  if (!pkg.locales?.length) warn(`"${label}": \`locales\` must list at least one language code.`);

  const seenIds = new Set<string>();
  const packageMatchesItemLocales = (locales?: string[]) =>
    !locales || pkg.locales?.some(l => localeMatchesItem(locales, l));

  for (const s of pkg.desktopShortcuts ?? []) {
    if (seenIds.has(s.id)) warn(`"${label}": duplicate item id "${s.id}".`);
    seenIds.add(s.id);
    if (!s.app) warn(`"${label}": desktop shortcut "${s.id}" has an empty \`app\`.`);
    if (!packageMatchesItemLocales(s.locales)) {
      warn(
        `"${label}": desktop shortcut "${s.id}" locales [${s.locales?.join(', ')}] ` +
          `don't match the package locales [${pkg.locales?.join(', ')}] — it will never show.`
      );
    }
  }

  const ownKeys = new Set<string>();
  for (const bundle of Object.values(pkg.i18n ?? {})) {
    for (const key of Object.keys(bundle)) ownKeys.add(key);
  }
  const startItems = [...(pkg.startMenu?.pinned ?? []), ...(pkg.startMenu?.recent ?? [])];
  for (const item of startItems) {
    if (item.nameKey && pkg.i18n && !ownKeys.has(item.nameKey)) {
      warn(
        `"${label}": start-menu item "${item.id}" nameKey "${item.nameKey}" is not in this ` +
          `package's i18n; it will render as the raw key unless a built-in provides it.`
      );
    }
    if (!packageMatchesItemLocales(item.locales)) {
      warn(
        `"${label}": start-menu item "${item.id}" locales [${item.locales?.join(', ')}] ` +
          `don't match the package locales — it will never show.`
      );
    }
  }
}

/**
 * Define a culture package with author-time validation.
 *
 * @example
 * ```ts
 * const jpRetro = defineCulture({
 *   id: 'jp-retro',
 *   displayName: '日本 2000s',
 *   locales: ['ja', 'ja-JP'],
 *   desktopShortcuts: [{ id: 'nico', name: 'ニコニコ動画', app: 'InternetExplorer', icon: 'ie' }],
 *   i18n: { ja: { 'apps.notepad': 'メモ帳' } },
 * });
 * ```
 */
export function defineCulture(config: CulturePackage): CulturePackage {
  if (IS_DEV) validate(config);
  return config;
}
