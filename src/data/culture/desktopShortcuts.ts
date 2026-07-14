import { FileNode } from '../../types';
import { DesktopShortcut } from './types';

/**
 * Desktop shortcut culture package.
 *
 * The Chinese context shows software familiar to Chinese netizens of the 2000s;
 * the English context shows representative Western software from the same era.
 */
const DESKTOP_SHORTCUTS_BY_LOCALE: Record<string, DesktopShortcut[]> = {
  zh: [
    { id: 'qq', name: 'QQ', app: 'QQ', icon: 'qq' },
    { id: '360safe', name: '360安全卫士', app: 'SafeGuard360', icon: '360safe' },
    { id: 'baofeng', name: '暴风影音', app: 'BaofengPlayer', icon: 'baofeng' },
    { id: 'thunder', name: '迅雷', app: 'Thunder', icon: 'thunder' },
    { id: 'wps', name: 'WPS Office', app: 'WPSOffice', icon: 'wps' },
    { id: 'kugou', name: '酷狗音乐', app: 'KugouMusic', icon: 'kugou' },
  ],
  // Western 2000s software (#123). Names match the smoke-test assertions;
  // icons are original parody artwork (no ripped brand logos, DEVELOPMENT.md §6).
  en: [
    { id: 'winamp', name: 'Winamp', app: 'Winamp', icon: 'winamp' },
    { id: 'norton', name: 'Norton AntiVirus', app: 'NortonAntiVirus', icon: 'nav' },
    { id: 'utorrent', name: 'uTorrent', app: 'UTorrent', icon: 'utorrent' },
    { id: 'itunes', name: 'iTunes', app: 'ITunes', icon: 'itunes' },
    { id: 'ms-office', name: 'Microsoft Office', app: 'MicrosoftOffice', icon: 'msoffice' },
    {
      id: 'media-player',
      name: 'Windows Media Player',
      app: 'WindowsMediaPlayer',
      icon: 'media_player',
    },
  ],
};

export const getDesktopShortcuts = (lang: string): DesktopShortcut[] => {
  const normalized = lang?.startsWith('zh') ? 'zh' : 'en';
  return DESKTOP_SHORTCUTS_BY_LOCALE[normalized] ?? DESKTOP_SHORTCUTS_BY_LOCALE.zh;
};

/** Convert the desktop-shortcut culture package into a FileNode map mergeable by FileSystemContext */
export const getDesktopShortcutNodes = (lang: string): Record<string, FileNode> => {
  const shortcuts = getDesktopShortcuts(lang);
  return Object.fromEntries(
    shortcuts.map(s => [
      s.name,
      {
        type: 'app_shortcut',
        name: s.name,
        app: s.app,
        icon: s.icon,
        managedByCulture: true,
        cultureId: s.id,
      } as FileNode,
    ])
  );
};

export const getAllCultureShortcutNames = (): string[] => [
  ...new Set(
    Object.values(DESKTOP_SHORTCUTS_BY_LOCALE).flatMap(shortcuts =>
      shortcuts.map(shortcut => shortcut.name)
    )
  ),
];
