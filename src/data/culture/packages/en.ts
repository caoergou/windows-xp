import { CulturePackage } from '../types';

/**
 * 默认英文文化包：西方 2000s 互联网记忆。
 */
export const enCulture: CulturePackage = {
  id: 'en',
  displayName: 'English (US)',
  locales: ['en', 'en-US', 'en-GB'],
  browser: {
    homepage: 'http://www.msn.com',
  },
  desktopShortcuts: [
    {
      id: 'media-player',
      name: 'Windows Media Player',
      app: 'WindowsMediaPlayer',
      icon: 'media_player',
    },
  ],
  startMenu: {
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
  stickyNote: {
    id: 'default',
    title: 'Memo',
    content: `📁 Double-click to open {{docsPath}}

☑ PC password is configured
☐ Update Norton AntiVirus
☐ Download Winamp with uTorrent
☐ 8 PM LAN party for Counter-Strike

🔑 Password hint: for the 2000s (lowercase)

💡 Tip:
   Right-click desktop to refresh
   Check the Recycle Bin for old letters`,
  },
};
