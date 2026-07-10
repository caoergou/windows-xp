/**
 * Cultural Localization（文化本地化）类型定义。
 *
 * 通用 UI 文本继续走 i18n；具有强烈时代/地域属性的内容（桌面快捷方式、
 * 便签、开始菜单应用等）使用本模块按语言隔离为“文化包”。
 */

export interface CulturalItem {
  /** 唯一标识 */
  id: string;
  /** 指定语言白名单；未指定表示全语言通用 */
  locales?: string[];
}

export interface DesktopShortcut extends CulturalItem {
  /** 显示名称 */
  name: string;
  /** 对应 APP_REGISTRY 中的应用 ID */
  app: string;
  /** XPIcon key */
  icon: string;
}

export interface StickyNoteContent extends CulturalItem {
  /** 便签标题 */
  title: string;
  /** 便签正文，支持 \n 换行 */
  content: string;
}

export interface StartMenuApp extends CulturalItem {
  /** 开始菜单内部动作标识 */
  action: string;
  /** i18n key，用于显示名称 */
  nameKey: string;
  /** XPIcon key */
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
 * 文化包定义。
 *
 * 一个文化包描述某一语言/地域/时代下的桌面内容：
 * 桌面快捷方式、开始菜单、浏览器主页、便签、壁纸、i18n 资源等。
 */
export interface CulturePackage {
  /** 唯一标识，如 'en', 'zh', 'jp-retro' */
  id: string;
  /** 显示名称 */
  displayName: string;
  /** 匹配的语言代码列表，如 ['en', 'en-US'] */
  locales: string[];
  /** 该文化包依赖的应用 ID，用于启动前校验 */
  requiredApps?: string[];
  /** 该文化包补充的 i18n 资源（会合并进 windows-xp namespace） */
  i18n?: Record<string, Record<string, string>>;
  /** 桌面快捷方式 */
  desktopShortcuts?: DesktopShortcut[];
  /** 开始菜单配置 */
  startMenu?: StartMenuProfile;
  /** 浏览器默认主页 */
  browser?: BrowserCultureProfile;
  /** 桌面便签 */
  stickyNote?: StickyNoteContent;
  /** 默认壁纸 URL */
  wallpaper?: string;
}

/** 规范化语言代码为文化包 key */
export type CultureKey = 'en' | 'zh';

export const normalizeCultureLang = (lang: string): CultureKey => {
  if (!lang) return 'en';
  return lang.startsWith('zh') ? 'zh' : 'en';
};

/** 按当前语言过滤文化项 */
export const filterByLocale = <T extends CulturalItem>(items: T[], lang: string): T[] => {
  const normalized = normalizeCultureLang(lang);
  return items.filter(item => !item.locales || item.locales.includes(normalized));
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
