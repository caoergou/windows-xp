import { CulturePackage } from '../types';

/**
 * Default English culture package: Western 2000s internet memories.
 */
export const enCulture: CulturePackage = {
  id: 'en',
  displayName: 'English (US)',
  locales: ['en', 'en-US', 'en-GB'],
  browser: {
    homepage: 'http://www.msn.com',
  },
  // Western 2000s software (#123). Names match the smoke-test assertions; icons
  // are original parody artwork (no ripped brand logos, DEVELOPMENT.md §6).
  desktopShortcuts: [
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
  startMenu: {
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
