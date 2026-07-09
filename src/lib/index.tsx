import React from 'react';
import { AppProviders } from '../components/AppProviders';
import { FileNode } from '../types';
import '../i18n';
import 'xp.css/dist/XP.css';
import '../index.css';

export interface WindowsXPProps {
  /** Default username for the login screen. */
  username?: string;
  /** Default password for authentication. */
  password?: string;
  /** Initial language (`'en'` or `'zh'`). */
  language?: 'en' | 'zh';
  /** Custom file system structure merged on top of the defaults. */
  customFileSystem?: Record<string, FileNode>;
  /** Skip the boot animation on first load. */
  skipBoot?: boolean;
  /** Automatically log the user in without showing the login screen. */
  autoLogin?: boolean;
  /** Namespace prefix for localStorage / IndexedDB keys (default: `'xp_'`). */
  storagePrefix?: string;
  /** Disable the global right-click context menu block. */
  disableContextMenuBlock?: boolean;
  /** Disable blocking of F12 / Ctrl+Shift+I/J/C / Ctrl+U. */
  disableDevToolsBlock?: boolean;
  /** Disable the idle screensaver. */
  disableScreenSaver?: boolean;
}

/**
 * WindowsXP Component
 *
 * A complete Windows XP desktop simulator component.
 *
 * @example
 * ```jsx
 * import { WindowsXP } from '@caoergou/windows-xp';
 * import '@caoergou/windows-xp/style.css';
 *
 * function App() {
 *   return <WindowsXP />;
 * }
 * ```
 */
export const WindowsXP: React.FC<WindowsXPProps> = ({
  username = 'User',
  password = 'forthe2000s',
  language = 'en',
  customFileSystem = null,
  skipBoot = false,
  autoLogin = false,
  storagePrefix,
  disableContextMenuBlock,
  disableDevToolsBlock,
  disableScreenSaver,
}) => {
  return (
    <AppProviders
      username={username}
      password={password}
      language={language}
      customFileSystem={customFileSystem || undefined}
      skipBoot={skipBoot}
      autoLogin={autoLogin}
      storagePrefix={storagePrefix}
      disableContextMenuBlock={disableContextMenuBlock}
      disableDevToolsBlock={disableDevToolsBlock}
      disableScreenSaver={disableScreenSaver}
    />
  );
};

// Re-export providers for advanced composition.
export { AppProviders } from '../components/AppProviders';
export { FileSystemProvider } from '../context/FileSystemContext';
export { WindowManagerProvider } from '../context/WindowManagerContext';
export { UserSessionProvider } from '../context/UserSessionContext';
export { ModalProvider } from '../context/ModalContext';
export { TrayProvider } from '../context/TrayContext';

// Re-export hooks.
export { useFileSystem } from '../context/FileSystemContext';
export { useWindowManager } from '../context/WindowManagerContext';
export { useUserSession } from '../context/UserSessionContext';
export { useModal } from '../context/ModalContext';
export { useTray } from '../context/TrayContext';
export { useApp } from '../hooks/useApp';

// Re-export commonly used types.
export type {
  FileNode,
  RootNode,
  FolderNode,
  DriveNode,
  FileContentNode,
  AppShortcutNode,
  FileProperties,
  SearchResult,
  WindowState,
  WindowProps,
  AppRegistryEntry,
  AppAssociation,
  AppLifecycle,
  UserSession,
  ClipboardItem,
  MenuItem,
} from '../types';
