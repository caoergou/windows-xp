import React from 'react';
import { AppProviders } from '../components/AppProviders';
import { FileNode, AppRegistryEntry } from '../types';
import { CulturePackage } from '../data/culture';
import type { DeepLinkRoutes } from '../utils/deepLink';
import type { PersistenceMode } from '../utils/storage';
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
   * Persistence backend (#138). `'local'` (default) survives across visits
   * (localStorage + IndexedDB); `'session'` is per-tab (sessionStorage, content
   * lost on tab close); `'none'` is pure in-memory — every mount starts pristine
   * (campaign pages, blogs, teaching sandboxes) and no IndexedDB is opened.
   */
  persistence?: PersistenceMode;
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
  /**
   * Play the classic hourly chime (整点报时) when the `time:hour` event fires.
   * Off by default; a culture package can also enable it via `hourlyChime` (#130).
   */
  hourlyChime?: boolean;
  /** Inactivity threshold in ms before `user:idle` fires (default 60000, #130). */
  idleThresholdMs?: number;
  /**
   * Deep link (#136): key path(s) — the `?open=` value(s), e.g.
   * `'我的文档/readme.txt'` — to open once the desktop is interactive (after
   * `skipBoot`/`autoLogin`). Invalid paths fail silently to the plain desktop.
   */
  openOnLoad?: string | string[];
  /**
   * Pretty URL routes (`{ '/blog/:slug': ({ slug }) => ({ open: `D:/posts/${slug}.md` }) }`),
   * matched against `location` (#136). Host-router-agnostic — no router dependency.
   */
  routes?: DeepLinkRoutes;
  /** The host's current location (path[+search]) used for `routes` matching (#136). */
  location?: string;
  /**
   * Push/pop browser history as top-level windows open/close so Back closes the
   * last-opened window on content sites (#136). Off by default — games/embeds skip it.
   */
  historyIntegration?: boolean;
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
    persistence,
    mode = 'fullscreen',
    disableContextMenuBlock,
    disableDevToolsBlock,
    disableGlobalShortcuts,
    disableScreenSaver,
    hourlyChime,
    idleThresholdMs,
    openOnLoad,
    routes,
    location,
    historyIntegration,
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
      persistence={persistence}
      hourlyChime={hourlyChime}
      idleThresholdMs={idleThresholdMs}
      openOnLoad={openOnLoad}
      routes={routes}
      location={location}
      historyIntegration={historyIntegration}
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
export { defineCulture } from '../data/culture';
// Blog / content pipeline helpers (#137).
export {
  buildContentFs,
  buildRssFeed,
  buildPostMirrorHtml,
  postPermalink,
  postPath,
} from '../content/blog';
export { FileSystemProvider } from '../context/FileSystemContext';
export { WindowManagerProvider } from '../context/WindowManagerContext';
export { UserSessionProvider } from '../context/UserSessionContext';
export { ModalProvider } from '../context/ModalContext';
export { TrayProvider } from '../context/TrayContext';
export { SchedulerProvider } from '../context/SchedulerContext';

// Re-export hooks.
export { useAppRegistry } from '../context/AppRegistryContext';
export { useCulture } from '../context/CultureContext';
export { useFileSystem } from '../context/FileSystemContext';
export { useWindowManager } from '../context/WindowManagerContext';
export { useUserSession } from '../context/UserSessionContext';
export { useModal } from '../context/ModalContext';
export { useTray } from '../context/TrayContext';
export { useScheduler } from '../context/SchedulerContext';
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
  StartupNotification,
  CultureKey,
} from '../data/culture';
export type { WallpaperItem } from '../data/wallpapers';
export type { DeepLinkRoute, DeepLinkRoutes } from '../utils/deepLink';
export type { BlogPost, ContentManifest, SiteMeta } from '../content/blog';
export type { FileSystemMode } from '../context/FileSystemContext';
export type { PersistenceMode } from '../utils/storage';
export type { ModalContextType } from '../context/ModalContext';
export type { TrayItem, TrayContextType, NotifyOptions } from '../context/TrayContext';
export type { ScheduleOptions, SchedulerApi } from '../context/SchedulerContext';
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
