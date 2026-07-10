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
