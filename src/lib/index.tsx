import React from 'react';
import { AppProviders } from '../components/AppProviders';
import { FileNode, AppRegistryEntry } from '../types';
import { CulturePackage } from '../data/culture';
import '../i18n';
import 'xp.css/dist/XP.css';
import '../scoped.css';

export interface WindowsXPProps {
  /** Default username for the login screen. */
  username?: string;
  /** Default password for authentication. */
  password?: string;
  /** Initial language (`'en'` or `'zh'`). */
  language?: 'en' | 'zh';
  /** Custom file system structure merged on top of the defaults. */
  customFileSystem?: Record<string, FileNode>;
  /** Custom culture packages that extend or override the built-in en/zh cultures. */
  cultures?: CulturePackage[];
  /** Custom applications that extend or override the built-in APP_REGISTRY. */
  apps?: AppRegistryEntry[];
  /** Skip the boot animation on first load. */
  skipBoot?: boolean;
  /** Automatically log the user in without showing the login screen. */
  autoLogin?: boolean;
  /** Namespace prefix for localStorage / IndexedDB keys (default: `'xp_'`). */
  storagePrefix?: string;
  /**
   * Integration mode. `'fullscreen'` (default) keeps the classic kiosk
   * behavior. `'embedded'` makes the component a well-behaved guest inside a
   * host application: the right-click block, devtools block, global shortcuts
   * (Alt+F4 / Alt+Tab / BSOD) and the idle screensaver are all disabled by
   * default. Individual `disable*` props still override these defaults.
   */
  mode?: 'fullscreen' | 'embedded';
  /** Disable the global right-click context menu block. */
  disableContextMenuBlock?: boolean;
  /** Disable blocking of F12 / Ctrl+Shift+I/J/C / Ctrl+U. */
  disableDevToolsBlock?: boolean;
  /** Disable global shortcuts like Alt+F4, Alt+Tab and the BSOD easter egg. */
  disableGlobalShortcuts?: boolean;
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
  cultures,
  apps,
  skipBoot = false,
  autoLogin = false,
  storagePrefix,
  mode = 'fullscreen',
  disableContextMenuBlock,
  disableDevToolsBlock,
  disableGlobalShortcuts,
  disableScreenSaver,
}) => {
  const embedded = mode === 'embedded';
  return (
    <AppProviders
      username={username}
      password={password}
      language={language}
      customFileSystem={customFileSystem || undefined}
      cultures={cultures}
      apps={apps}
      skipBoot={skipBoot}
      autoLogin={autoLogin}
      storagePrefix={storagePrefix}
      disableContextMenuBlock={disableContextMenuBlock ?? embedded}
      disableDevToolsBlock={disableDevToolsBlock ?? embedded}
      disableGlobalShortcuts={disableGlobalShortcuts ?? embedded}
      disableScreenSaver={disableScreenSaver ?? embedded}
    />
  );
};

// Re-export providers for advanced composition.
export { AppProviders } from '../components/AppProviders';
export { AppRegistryProvider } from '../context/AppRegistryContext';
export { CultureProvider } from '../context/CultureContext';
export { FileSystemProvider } from '../context/FileSystemContext';
export { WindowManagerProvider } from '../context/WindowManagerContext';
export { UserSessionProvider } from '../context/UserSessionContext';
export { ModalProvider } from '../context/ModalContext';
export { TrayProvider } from '../context/TrayContext';

// Re-export hooks.
export { useAppRegistry } from '../context/AppRegistryContext';
export { useCulture } from '../context/CultureContext';
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
export type { CulturePackage } from '../data/culture';
