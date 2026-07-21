import { CulturePackage } from '../types';
import { defaultQQProfile } from '../../qq/defaultProfile';

/**
 * Default Chinese culture package: 2000s Chinese netizen memories.
 */
export const zhCulture: CulturePackage = {
  id: 'zh',
  displayName: '简体中文',
  locales: ['zh', 'zh-CN', 'zh-TW', 'zh-HK'],
  browser: {
    homepage: 'http://www.hao123.com',
  },
  qq: defaultQQProfile,
  desktopShortcuts: [
    { id: 'qq', name: 'QQ', app: 'QQ', icon: 'qq' },
    { id: '360safe', name: '360安全卫士', app: 'SafeGuard360', icon: '360safe' },
    { id: 'baofeng', name: '暴风影音', app: 'BaofengPlayer', icon: 'baofeng' },
    { id: 'thunder', name: '迅雷', app: 'Thunder', icon: 'thunder' },
    { id: 'wps', name: 'WPS Office', app: 'WPSOffice', icon: 'wps' },
    { id: 'kugou', name: '酷狗音乐', app: 'KugouMusic', icon: 'kugou' },
  ],
  startMenu: {
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
  startupNotification: {
    icon: '360safe',
    titleKey: 'tray.safeGuardReminder',
    bodyKey: 'tray.safeGuardStatus',
    delay: 3000,
    trayIcon: '360safe',
    app: 'SafeGuard360',
  },
  stickyNote: {
    id: 'default',
    title: '备忘录',
    content: `📁 双击打开{{docsPath}}

☑ 电脑密码已设置
☐ 更新 360 安全卫士
☐ 用迅雷下载暴风影音
☐ 晚上 8 点网吧联机 CS

🔑 密码提示：为了 2000s（小写）

💡 小贴士：
   右键桌面可刷新
   回收站里还有几封旧信`,
  },
};
