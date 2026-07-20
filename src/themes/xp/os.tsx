import type React from 'react';
import BootScreen from '../../components/BootScreen';
import LoginScreen from '../../components/LoginScreen';
import Taskbar from '../../components/Taskbar';
import { defineOS } from '../../os/defineOS';
import XPDataMenuBar from './chrome/MenuBar';
import XPWindowDecoration from './chrome/WindowDecoration';
import { xpTheme } from './index';
import { ModalProvider } from '../../context/ModalContext';
import type { SystemDialogsProps } from '../../os/contract';

const XPSystemDialogs: React.FC<SystemDialogsProps> = ({ children }) => (
  <ModalProvider>{children}</ModalProvider>
);

export const xpOS = defineOS({
  id: 'xp',
  name: 'Windows XP',
  theme: xpTheme,
  chrome: {
    WindowDecoration: XPWindowDecoration,
    shellSurfaces: [Taskbar],
    SystemDialogs: XPSystemDialogs,
    BootScreen,
    LoginScreen,
    MenuBar: XPDataMenuBar,
  },
  behavior: {
    menuModel: 'in-window',
    minimizeTarget: 'shell-button',
    maximizeSemantics: 'fill',
    primaryModifier: 'ctrl',
    windowAnimations: 'caption',
    focusRules: 'click-to-focus',
    dialogModality: 'floating',
  },
  conventions: {
    pathStyle: 'drive',
    terminalDialect: 'cmd',
    iconSizes: [16, 32, 48],
  },
  appRoles: {
    files: 'Explorer',
    editor: 'Notepad',
    browser: 'InternetExplorer',
    terminal: 'CommandPrompt',
    media: 'WindowsMediaPlayer',
  },
});
