import { FileNode } from '../../types';
import { DesktopShortcut } from './types';

/**
 * 桌面快捷方式文化包。
 *
 * 中文语境展示 2000s 中国网民熟悉的软件；
 * 英文语境展示同一时期具有代表性的西方软件。
 */
const DESKTOP_SHORTCUTS_BY_LOCALE: Record<string, DesktopShortcut[]> = {
  zh: [
    { id: 'qq', name: 'QQ', app: 'QQLogin', icon: 'qq' },
    { id: '360safe', name: '360安全卫士', app: 'SafeGuard360', icon: '360safe' },
    { id: 'baofeng', name: '暴风影音', app: 'BaofengPlayer', icon: 'baofeng' },
    { id: 'thunder', name: '迅雷', app: 'Thunder', icon: 'thunder' },
    { id: 'wps', name: 'WPS Office', app: 'WPSOffice', icon: 'wps' },
    { id: 'kugou', name: '酷狗音乐', app: 'KugouMusic', icon: 'kugou' },
  ],
  // Only expose applications with a real implementation and an authentic icon.
  en: [
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

/** 将桌面快捷方式文化包转为 FileSystemContext 可合并的 FileNode 映射 */
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
  ...Object.values(DESKTOP_SHORTCUTS_BY_LOCALE).flatMap(shortcuts =>
    shortcuts.map(shortcut => shortcut.name)
  ),
  'Norton AntiVirus',
  'Winamp',
  'uTorrent',
  'Microsoft Office',
  'iTunes',
];
