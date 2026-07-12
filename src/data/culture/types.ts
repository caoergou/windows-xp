/**
 * Cultural Localization（文化本地化）类型定义。
 *
 * 通用 UI 文本继续走 i18n；具有强烈时代/地域属性的内容（桌面快捷方式、
 * 便签、开始菜单应用等）使用本模块按语言隔离为“文化包”。
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
}

/**
 * 开机后自动弹出的托盘气泡通知（#118）。
 *
 * 取代原先 AntivirusPopup 里硬编码的 zh-only 判断：内容随文化包提供，
 * 只有配置了 startupNotification 的文化包才会在登录后弹出气泡。
 */
export interface StartupNotification {
  /** XPIcon key */
  icon?: string;
  /** i18n key，用于标题；优先于 title */
  titleKey?: string;
  /** 直接给出的标题文本 */
  title?: string;
  /** i18n key，用于正文；优先于 body */
  bodyKey?: string;
  /** 直接给出的正文文本 */
  body?: string;
  /** 登录后延迟多少毫秒弹出，默认 3000 */
  delay?: number;
  /** 气泡显示时长（毫秒），0 表示常驻 */
  timeout?: number;
  /**
   * 常驻托盘图标（XPIcon key）。设置后会在托盘常驻该图标，气泡的尾巴对准它，
   * 点击图标或气泡打开 {@link app}。留空则气泡从通知区域（右侧）弹出。
   */
  trayIcon?: string;
  /** 点击托盘图标 / 气泡时打开的应用 ID（APP_REGISTRY key） */
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

/** 判断某个语言是否匹配文化包 */
export const cultureMatchesLocale = (pkg: CulturePackage, lang: string): boolean => {
  const lowerLang = lang.toLowerCase();
  return pkg.locales.some(locale => {
    const lowerLocale = locale.toLowerCase();
    return lowerLocale === lowerLang || lowerLang.startsWith(lowerLocale + '-');
  });
};

/** 为给定语言选择最佳匹配的文化包 */
export const resolveCulture = (
  cultures: CulturePackage[],
  lang: string
): CulturePackage | undefined => {
  if (!cultures.length) return undefined;

  // 1. 精确匹配
  const exact = cultures.find(pkg => cultureMatchesLocale(pkg, lang));
  if (exact) return exact;

  // 2. 按语言前缀匹配，如 'en-US'  fallback 到 'en'
  const baseLang = lang.split('-')[0].toLowerCase();
  const baseMatch = cultures.find(pkg =>
    pkg.locales.some(locale => locale.toLowerCase() === baseLang)
  );
  if (baseMatch) return baseMatch;

  // 3. 返回第一个默认文化包（通常是 en）
  return cultures.find(pkg => pkg.id === 'en') ?? cultures[0];
};
