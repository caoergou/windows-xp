/**
 * Cultural Localization type definitions.
 *
 * Generic UI text continues to use i18n; content with strong era / region attributes
 * (desktop shortcuts, sticky notes, start-menu apps, etc.) is isolated by language
 * into "culture packages" through this module.
 */

import { QQProfile } from '../qq/types';

export interface CulturalItem {
  /** Unique id within the package. */
  id: string;
  /** Language whitelist; omit to show in every language. Matched base-aware (see filterByLocale). */
  locales?: string[];
}

export interface DesktopShortcut extends CulturalItem {
  /** Display name (also the desktop icon's key). */
  name: string;
  /** App id in the registry to open — must be a registered app (built-in or via the `apps` prop). */
  app: string;
  /** `XPIcon` key. */
  icon: string;
}

export interface StickyNoteContent extends CulturalItem {
  /** Note title. */
  title: string;
  /** Note body; `\n` for line breaks. */
  content: string;
}

export interface StartMenuApp extends CulturalItem {
  /** Internal start-menu action id (the app/route it opens). */
  action: string;
  /** i18n key for the label — provide it in the package's `i18n` or it renders as the raw key. */
  nameKey: string;
  /** `XPIcon` key. */
  icon: string;
}

export interface StartMenuProfile {
  pinned: StartMenuApp[];
  recent: StartMenuApp[];
}

export interface BrowserCultureProfile {
  homepage: string;
  /** Era-appropriate prompt template for the WebContentProvider (#149). */
  eraPrompt?: string;
}

/**
 * Tray balloon notification that pops up automatically after boot (#118).
 *
 * Replaces the previously hardcoded zh-only check in AntivirusPopup: content is supplied
 * by the culture package, and only culture packages configured with startupNotification
 * will show a balloon after login.
 */
export interface StartupNotification {
  /** XPIcon key */
  icon?: string;
  /** i18n key for the title; takes precedence over title */
  titleKey?: string;
  /** Title text given directly */
  title?: string;
  /** i18n key for the body; takes precedence over body */
  bodyKey?: string;
  /** Body text given directly */
  body?: string;
  /** Delay in milliseconds before popping up after login; defaults to 3000 */
  delay?: number;
  /** Balloon display duration in milliseconds; 0 means persistent */
  timeout?: number;
  /**
   * Resident tray icon (XPIcon key). When set, the icon stays in the tray; the balloon tail points to it,
   * and clicking the icon or balloon opens {@link app}. Leaving it empty makes the balloon pop from the notification area (right side).
   */
  trayIcon?: string;
  /** App ID (APP_REGISTRY key) to open when clicking the tray icon / balloon */
  app?: string;
}

/**
 * A culture package — the era/region/language content of a desktop: shortcuts,
 * start menu, homepage, sticky note, wallpaper, i18n resources and more.
 *
 * Prefer the {@link defineCulture} factory, which validates the package (app-id
 * references, locale consistency, missing i18n keys) at author time.
 */
export interface CulturePackage {
  /** Unique id, e.g. `'en'`, `'zh'`, `'jp-retro'`. */
  id: string;
  /** Human-readable name for the culture picker. */
  displayName: string;
  /** Language codes this package activates for, e.g. `['ja', 'ja-JP']`. */
  locales: string[];
  /** App ids this package needs registered; used for a startup check. */
  requiredApps?: string[];
  /** Extra i18n resources merged into the windows-xp namespace (`{ lang: { key: value } }`). */
  i18n?: Record<string, Record<string, string>>;
  /** Desktop shortcuts. */
  desktopShortcuts?: DesktopShortcut[];
  /** Start-menu pinned/recent apps. */
  startMenu?: StartMenuProfile;
  /** Default browser homepage. */
  browser?: BrowserCultureProfile;
  /** Desktop sticky note. */
  stickyNote?: StickyNoteContent;
  /** Tray balloon shown after login (#118). */
  startupNotification?: StartupNotification;
  /** QQ Messenger profile — buddies / groups / scripted messages (#119), read by the QQ app. */
  qq?: QQProfile;
  /** Default wallpaper URL. */
  wallpaper?: string;
  /** Play the hourly chime on `time:hour` (off by default, #130). */
  hourlyChime?: boolean;
}

/**
 * The two built-in culture buckets. Used only for the built-in en/zh content
 * maps (start menu, browser, IE favorites) — NOT for filtering a package's own
 * items (see {@link filterByLocale}, which matches the real locale).
 */
export type CultureKey = 'en' | 'zh';

/** Collapse a language code to a built-in bucket. `zh*` → `'zh'`, else `'en'`. */
export const normalizeCultureLang = (lang: string): CultureKey => {
  if (!lang) return 'en';
  return lang.startsWith('zh') ? 'zh' : 'en';
};

/**
 * Whether an item's `locales` whitelist matches `lang`, base-aware and
 * case-insensitive: `['ja']` matches `ja` and `ja-JP`; `['en']` matches `en-US`.
 * This is FULL-locale matching (not the two-bucket collapse), so a third-
 * language package's item `locales` filter as the author wrote them (#129).
 */
export const localeMatchesItem = (itemLocales: string[], lang: string): boolean => {
  const lower = (lang || '').toLowerCase();
  const base = lower.split('-')[0];
  return itemLocales.some(loc => {
    const l = loc.toLowerCase();
    return l === lower || l.split('-')[0] === base;
  });
};

/**
 * Filter culture items (desktop shortcuts, start-menu apps, …) for a language.
 * An item with no `locales` is shown everywhere; otherwise it is kept only when
 * its `locales` match `lang` per {@link localeMatchesItem}.
 */
export const filterByLocale = <T extends CulturalItem>(items: T[], lang: string): T[] => {
  return items.filter(item => !item.locales || localeMatchesItem(item.locales, lang));
};

/** Determine whether a given language matches the culture package */
export const cultureMatchesLocale = (pkg: CulturePackage, lang: string): boolean => {
  const lowerLang = lang.toLowerCase();
  return pkg.locales.some(locale => {
    const lowerLocale = locale.toLowerCase();
    return lowerLocale === lowerLang || lowerLang.startsWith(lowerLocale + '-');
  });
};

/** Select the best-matching culture package for the given language */
export const resolveCulture = (
  cultures: CulturePackage[],
  lang: string
): CulturePackage | undefined => {
  if (!cultures.length) return undefined;

  // 1. Exact match
  const exact = cultures.find(pkg => cultureMatchesLocale(pkg, lang));
  if (exact) return exact;

  // 2. Match by language prefix, e.g. 'en-US' falls back to 'en'
  const baseLang = lang.split('-')[0].toLowerCase();
  const baseMatch = cultures.find(pkg =>
    pkg.locales.some(locale => locale.toLowerCase() === baseLang)
  );
  if (baseMatch) return baseMatch;

  // 3. Return the first default culture package (usually en)
  return cultures.find(pkg => pkg.id === 'en') ?? cultures[0];
};
