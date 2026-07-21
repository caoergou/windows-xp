import { normalizeCultureLang, StartMenuApp, StartMenuProfile } from './types';

/**
 * Start-menu app-list culture package, located below "All Programs" on the left.
 *
 * These are high-frequency / easter-egg apps, showing different 2000s memory symbols per language.
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
      {
        id: 'ttplayer',
        action: 'TTPlayer',
        nameKey: 'startMenu.apps.ttplayer',
        icon: 'ttplayer',
      },
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
      { id: 'winamp', action: 'Winamp', nameKey: 'startMenu.apps.winamp', icon: 'winamp' },
      {
        id: 'media-player',
        action: 'WindowsMediaPlayer',
        nameKey: 'apps.mediaPlayer',
        icon: 'media_player',
      },
    ],
    recent: [
      { id: 'norton', action: 'NortonAntiVirus', nameKey: 'startMenu.apps.norton', icon: 'nav' },
      { id: 'itunes', action: 'ITunes', nameKey: 'startMenu.apps.itunes', icon: 'itunes' },
      { id: 'utorrent', action: 'UTorrent', nameKey: 'startMenu.apps.utorrent', icon: 'utorrent' },
      {
        id: 'ms-office',
        action: 'MicrosoftOffice',
        nameKey: 'startMenu.apps.microsoftOffice',
        icon: 'msoffice',
      },
      { id: 'notepad', action: 'Notepad', nameKey: 'apps.notepad', icon: 'file' },
      { id: 'solitaire', action: 'Solitaire', nameKey: 'apps.solitaire', icon: 'solitaire' },
    ],
  },
};

export const getStartMenuApps = (lang: string): StartMenuApp[] => {
  return getStartMenuProfile(lang).recent;
};

export const getStartMenuProfile = (lang: string): StartMenuProfile =>
  START_MENU_BY_LOCALE[normalizeCultureLang(lang)] ?? START_MENU_BY_LOCALE.en;
