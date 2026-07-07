import { StartMenuApp } from './types';

/**
 * 开始菜单左侧“所有程序”下方的应用列表文化包。
 *
 * 这些是高频/彩蛋性质的应用，按语言展示不同的 2000s 记忆符号。
 */
const START_MENU_APPS_BY_LOCALE: Record<string, StartMenuApp[]> = {
  zh: [
    { id: 'qqmail', action: 'QQMail', nameKey: 'startMenu.apps.qqMail', icon: 'email' },
    { id: 'wps', action: 'DummyApp', nameKey: 'startMenu.apps.wpsOffice', icon: 'wps' },
    { id: 'baofeng', action: 'BaofengPlayer', nameKey: 'startMenu.apps.baofeng', icon: 'baofeng' },
    { id: 'thunder', action: 'DummyApp', nameKey: 'startMenu.apps.thunder', icon: 'thunder' },
    { id: '360safe', action: 'DummyApp', nameKey: 'startMenu.apps.safeGuard', icon: '360safe' },
    { id: 'kugou', action: 'KugouMusic', nameKey: 'startMenu.apps.kugou', icon: 'kugou' },
  ],
  en: [
    { id: 'msn', action: 'DummyApp', nameKey: 'startMenu.apps.msn', icon: 'email' },
    { id: 'office', action: 'DummyApp', nameKey: 'startMenu.apps.microsoftOffice', icon: 'wps' },
    { id: 'winamp', action: 'DummyApp', nameKey: 'startMenu.apps.winamp', icon: 'baofeng' },
    { id: 'utorrent', action: 'DummyApp', nameKey: 'startMenu.apps.utorrent', icon: 'thunder' },
    { id: 'norton', action: 'DummyApp', nameKey: 'startMenu.apps.norton', icon: '360safe' },
    { id: 'itunes', action: 'DummyApp', nameKey: 'startMenu.apps.itunes', icon: 'kugou' },
  ],
};

export const getStartMenuApps = (lang: string): StartMenuApp[] => {
  const normalized = lang?.startsWith('zh') ? 'zh' : 'en';
  return START_MENU_APPS_BY_LOCALE[normalized] ?? START_MENU_APPS_BY_LOCALE.zh;
};
