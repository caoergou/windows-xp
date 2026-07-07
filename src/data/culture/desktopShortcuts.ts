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
    { id: '360safe', name: '360 Safe Guard', app: 'SafeGuard360', icon: '360safe' },
    { id: 'baofeng', name: 'Baofeng Media Player', app: 'DummyApp', icon: 'baofeng' },
    { id: 'thunder', name: 'Thunder', app: 'Thunder', icon: 'thunder' },
    { id: 'wps', name: 'WPS Office', app: 'DummyApp', icon: 'wps' },
    { id: 'kugou', name: 'Kugou Music', app: 'DummyApp', icon: 'kugou' },
  ],
  en: [
    { id: 'norton', name: 'Norton AntiVirus', app: 'DummyApp', icon: '360safe' },
    { id: 'winamp', name: 'Winamp', app: 'DummyApp', icon: 'baofeng' },
    { id: 'utorrent', name: 'uTorrent', app: 'DummyApp', icon: 'thunder' },
    { id: 'office', name: 'Microsoft Office', app: 'DummyApp', icon: 'wps' },
    { id: 'itunes', name: 'iTunes', app: 'DummyApp', icon: 'kugou' },
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
      } as FileNode,
    ])
  );
};
