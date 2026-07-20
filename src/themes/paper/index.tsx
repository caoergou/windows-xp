import type React from 'react';
import type { OSTheme } from '../contract';
import { css } from 'styled-components';
import { defineOS } from '../../os/defineOS';
import { xpTheme } from '../xp';
import { ModalProvider } from '../../context/ModalContext';
import type { SystemDialogsProps } from '../../os/contract';
import {
  PaperBootScreen,
  PaperDock,
  PaperLoginScreen,
  PaperMenuBar,
  PaperWindowDecoration,
} from './components';

const PAPER_ICON =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Crect x="4" y="4" width="24" height="24" fill="white" stroke="black" stroke-width="2"/%3E%3Cpath d="M9 11h14M9 16h14M9 21h10" stroke="black"/%3E%3C/svg%3E';
const paperControl = css`
  border: 2px solid ${({ theme }) => theme.tokens.BLACK};
  border-radius: 0;
  background: ${({ theme }) => theme.tokens.WHITE};
  box-shadow: none;
`;
const PaperSystemDialogs: React.FC<SystemDialogsProps> = ({ children }) => (
  <ModalProvider>{children}</ModalProvider>
);

/** Minimal original OS used to dogfood the package contract without XP chrome. */
export const paperTheme: OSTheme = {
  ...xpTheme,
  id: 'paper',
  name: 'Paper OS',
  css: undefined,
  fonts: {
    UI: 'serif',
    TITLEBAR: 'serif',
    CLASSIC: 'serif',
    MONO: 'monospace',
    EDITOR: 'monospace',
    CONSOLE: 'monospace',
    BOOT: 'serif',
  },
  assets: {
    icons: Object.fromEntries(Object.keys(xpTheme.assets.icons).map(name => [name, PAPER_ICON])),
  },
  styles: {
    button: paperControl,
    scrollbar: paperControl,
    titleBar: paperControl,
    trackbar: paperControl,
  },
  tokens: {
    ...xpTheme.tokens,
    TITLE_BAR_GRADIENT: xpTheme.tokens.WHITE,
    TASKBAR_GRADIENT: xpTheme.tokens.SURFACE,
  },
  sounds: {},
};

export const paperOS = defineOS({
  id: 'paper',
  name: 'Paper OS',
  theme: paperTheme,
  chrome: {
    WindowDecoration: PaperWindowDecoration,
    shellSurfaces: [PaperDock],
    SystemDialogs: PaperSystemDialogs,
    BootScreen: PaperBootScreen,
    LoginScreen: PaperLoginScreen,
    MenuBar: PaperMenuBar,
  },
  behavior: {
    menuModel: 'global-bar',
    minimizeTarget: 'dock-icon',
    maximizeSemantics: 'zoom',
    primaryModifier: 'meta',
    windowAnimations: 'none',
    focusRules: 'click-to-focus',
    dialogModality: 'floating',
  },
  conventions: {
    pathStyle: 'unix',
    terminalDialect: 'posix',
    iconSizes: [16, 32],
  },
  appRoles: {
    files: 'Explorer',
    editor: 'Notepad',
    browser: 'InternetExplorer',
    terminal: 'CommandPrompt',
    media: 'WindowsMediaPlayer',
  },
});
