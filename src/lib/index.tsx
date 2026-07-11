import React from 'react';
import { AppProviders } from '../components/AppProviders';
import { FileNode, AppRegistryEntry } from '../types';
import { CulturePackage } from '../data/culture';
import type { WallpaperItem } from '../data/wallpapers';
import type { XPEventListener } from '../events';
import type { XPHandle } from '../components/XPBridge';
import '../i18n';
import 'xp.css/dist/XP.css';
import '../scoped.css';

export interface WindowsXPProps {
  /** Default username for the login screen. */
  username?: string;
  /** Default password for authentication. */
  password?: string;
  /**
   * Initial language. `'en'` and `'zh'` ship built-in; any other code
   * (e.g. `'ja'`) requires a matching culture package that provides `i18n`
   * resources - missing keys fall back to English.
   */
  language?: string;
  /**
   * Custom file system structure combined with the defaults per
   * `fileSystemMode`. Applied at mount; later changes to this prop are not
   * re-read (the tree is owned by the persistence layer after load). Remount
   * with a different `storagePrefix` for a fresh tree.
   */
  customFileSystem?: Record<string, FileNode>;
  /**
   * How `customFileSystem` combines with the built-ins (#77). `'merge'`
   * (default) layers your content over the built-in desktop; `'replace'` keeps
   * only OS scaffolding (Recycle Bin + an empty My Computer) so your content is
   * the whole desktop — no built-in QQ/360/IE shortcuts.
   */
  fileSystemMode?: 'merge' | 'replace';
  /** Login/user avatar: an XPIcon id (e.g. `'user'`) or an image URL (#77). */
  avatar?: string;
  /** Extra wallpapers merged over the built-in list, for the picker + resolution (#77). */
  wallpapers?: WallpaperItem[];
  /** Initial wallpaper — a wallpaper id or a direct image URL — used until the user picks one (#77). */
  defaultWallpaper?: string;
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
  /** Subscribe to desktop events (app launches, file opens, session, cmd...). */
  onEvent?: XPEventListener;
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
export const WindowsXP = React.forwardRef<XPHandle, WindowsXPProps>(function WindowsXP(
  {
    username = 'User',
    password = 'forthe2000s',
    language = 'en',
    customFileSystem = null,
    fileSystemMode,
    avatar,
    wallpapers,
    defaultWallpaper,
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
    onEvent,
  },
  ref
) {
  const embedded = mode === 'embedded';
  return (
    <AppProviders
      username={username}
      password={password}
      language={language}
      customFileSystem={customFileSystem || undefined}
      fileSystemMode={fileSystemMode}
      avatar={avatar}
      wallpapers={wallpapers}
      defaultWallpaper={defaultWallpaper}
      cultures={cultures}
      apps={apps}
      skipBoot={skipBoot}
      autoLogin={autoLogin}
      storagePrefix={storagePrefix}
      onEvent={onEvent}
      handleRef={ref}
      disableContextMenuBlock={disableContextMenuBlock ?? embedded}
      disableDevToolsBlock={disableDevToolsBlock ?? embedded}
      disableGlobalShortcuts={disableGlobalShortcuts ?? embedded}
      disableScreenSaver={disableScreenSaver ?? embedded}
    />
  );
});

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
  JsonValue,
  ExifData,
} from '../types';
// Culture package + all its sub-types, so a custom CulturePackage can be
// authored type-safely without hand-copying types (#79).
export type {
  CulturePackage,
  CulturalItem,
  DesktopShortcut,
  StickyNoteContent,
  StartMenuApp,
  StartMenuProfile,
  BrowserCultureProfile,
  CultureKey,
} from '../data/culture';
export type { WallpaperItem } from '../data/wallpapers';
export type { FileSystemMode } from '../context/FileSystemContext';
export type { ModalContextType } from '../context/ModalContext';
export type { TrayItem, TrayContextType } from '../context/TrayContext';
export type { XPEvent, XPEventType, XPEventListener } from '../events';
export type {
  XPHandle,
  XPFsApi,
  XPSessionApi,
  XPAppearanceApi,
  XPWindowsApi,
  XPWindowInfo,
} from '../components/XPBridge';
export { useXPEvents, useXPEventBus } from '../context/EventBusContext';
export { EventBusProvider } from '../context/EventBusContext';
export { XPEventBus, createXPEventBus } from '../events';
export type { XPSnapshot } from '../snapshot';
export { XP_SNAPSHOT_VERSION, XPSnapshotVersionError, assertLoadableSnapshot } from '../snapshot';
