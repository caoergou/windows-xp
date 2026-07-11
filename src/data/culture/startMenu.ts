import { normalizeCultureLang, StartMenuApp, StartMenuProfile } from './types';

/**
 * 开始菜单左侧“所有程序”下方的应用列表文化包。
 *
 * 这些是高频/彩蛋性质的应用，按语言展示不同的 2000s 记忆符号。
 */
const START_MENU_BY_LOCALE: Record<string, StartMenuProfile> = {
  zh: {
    pinned: [
      {
        id: 'internet-explorer',
        action: 'InternetExplorer',
        nameKey: 'startMenu.apps.internetExplorer',
        icon: 'ie',
      },
      { id: 'qq', action: 'QQ', nameKey: 'startMenu.apps.qq', icon: 'qq' },
    ],
    recent: [
      { id: 'qqmail', action: 'QQMail', nameKey: 'startMenu.apps.qqMail', icon: 'email' },
      { id: 'wps', action: 'WPSOffice', nameKey: 'startMenu.apps.wpsOffice', icon: 'wps' },
      {
        id: 'baofeng',
        action: 'BaofengPlayer',
        nameKey: 'startMenu.apps.baofeng',
        icon: 'baofeng',
      },
      { id: 'thunder', action: 'Thunder', nameKey: 'startMenu.apps.thunder', icon: 'thunder' },
      {
        id: '360safe',
        action: 'SafeGuard360',
        nameKey: 'startMenu.apps.safeGuard',
        icon: '360safe',
      },
      { id: 'kugou', action: 'KugouMusic', nameKey: 'startMenu.apps.kugou', icon: 'kugou' },
    ],
  },
  en: {
    pinned: [
      {
        id: 'internet-explorer',
        action: 'InternetExplorer',
        nameKey: 'startMenu.apps.internetExplorer',
        icon: 'ie',
      },
      {
        id: 'media-player',
        action: 'WindowsMediaPlayer',
        nameKey: 'apps.mediaPlayer',
        icon: 'media_player',
      },
    ],
    recent: [
      { id: 'notepad', action: 'Notepad', nameKey: 'apps.notepad', icon: 'file' },
      { id: 'paint', action: 'MicrosoftPaint', nameKey: 'apps.paint', icon: 'paint' },
      { id: 'calculator', action: 'Calculator', nameKey: 'apps.calculator', icon: 'calculator' },
      {
        id: 'minesweeper',
        action: 'Minesweeper',
        nameKey: 'apps.minesweeper',
        icon: 'minesweeper',
      },
      { id: 'solitaire', action: 'Solitaire', nameKey: 'apps.solitaire', icon: 'solitaire' },
    ],
  },
};

export const getStartMenuApps = (lang: string): StartMenuApp[] => {
  return getStartMenuProfile(lang).recent;
};

export const getStartMenuProfile = (lang: string): StartMenuProfile =>
  START_MENU_BY_LOCALE[normalizeCultureLang(lang)] ?? START_MENU_BY_LOCALE.en;
