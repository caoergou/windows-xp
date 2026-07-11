import React, { useEffect, useMemo } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import App from '../App';
import xpI18n, { NAMESPACE } from '../i18n';
import { FileSystemProvider, type FileSystemMode } from '../context/FileSystemContext';
import type { WallpaperItem } from '../data/wallpapers';
import { WindowManagerProvider } from '../context/WindowManagerContext';
import { UserSessionProvider } from '../context/UserSessionContext';
import { TrayProvider } from '../context/TrayContext';
import { ModalProvider } from '../context/ModalContext';
import { AppRegistryProvider, useAppRegistry } from '../context/AppRegistryContext';
import { CultureProvider, useCulture } from '../context/CultureContext';
import { FileNode, AppRegistryEntry } from '../types';
import { CulturePackage } from '../data/culture';
import { EventBusProvider } from '../context/EventBusContext';
import { StorageProvider } from '../context/StorageContext';
import { XPEventBridge, XPImperativeApi, type XPHandle } from './XPBridge';
import { XPEventBus } from '../events';
import type { XPEventListener } from '../events';
import { setStoragePrefix } from '../utils/storage';
import { getSavedLanguage } from '../utils/language';

export interface AppProvidersProps {
  /** Subscribe to desktop events (#76). */
  onEvent?: XPEventListener;
  /** Imperative handle for driving the desktop programmatically (#76). */
  handleRef?: React.Ref<XPHandle>;
  username?: string;
  password?: string;
  language?: string;
  customFileSystem?: Record<string, FileNode>;
  /** 'merge' (default) or 'replace' the built-in filesystem (#77). */
  fileSystemMode?: FileSystemMode;
  /** Login/user avatar: an XPIcon id or an image URL (#77). */
  avatar?: string;
  /** Extra wallpapers merged over the built-in list (#77). */
  wallpapers?: WallpaperItem[];
  /** Initial wallpaper (id or URL) when the user hasn't picked one (#77). */
  defaultWallpaper?: string;
  cultures?: CulturePackage[];
  apps?: AppRegistryEntry[];
  skipBoot?: boolean;
  autoLogin?: boolean;
  storagePrefix?: string;
  disableContextMenuBlock?: boolean;
  disableDevToolsBlock?: boolean;
  disableGlobalShortcuts?: boolean;
  disableScreenSaver?: boolean;
}

const CultureAwareProviders: React.FC<Omit<AppProvidersProps, 'cultures'>> = ({
  onEvent,
  handleRef,
  username,
  password,
  language,
  customFileSystem,
  fileSystemMode,
  avatar,
  wallpapers,
  defaultWallpaper,
  skipBoot,
  autoLogin,
  storagePrefix,
  disableContextMenuBlock,
  disableDevToolsBlock,
  disableGlobalShortcuts,
  disableScreenSaver,
}) => {
  // Configure storage namespace synchronously before any context reads/writes storage.
  setStoragePrefix(storagePrefix || 'xp_');

  // One event bus per desktop instance (#76).
  const busRef = useMemo(() => new XPEventBus(), []);

  const { i18n } = useTranslation();
  const { culture, cultureKey, setCultureByLang } = useCulture();
  const { registry } = useAppRegistry();
  const activeLang = getSavedLanguage(language || 'en');

  const culturalShortcuts = useMemo(
    () => (culture.desktopShortcuts ? desktopShortcutsToNodes(culture.desktopShortcuts) : {}),
    [culture]
  );

  // Sync language and culture when the language prop changes.
  useEffect(() => {
    if (i18n.language !== activeLang) {
      i18n.changeLanguage(activeLang);
    }
    setCultureByLang(activeLang);
  }, [activeLang, i18n, setCultureByLang]);

  // Merge culture-specific i18n resources into the isolated xp i18n instance.
  useEffect(() => {
    if (!culture.i18n) return;
    Object.entries(culture.i18n).forEach(([lang, resources]) => {
      xpI18n.addResourceBundle(lang, NAMESPACE, resources, true, true);
    });
  }, [culture]);

  // 用户传入的 customFileSystem 优先级高于文化包
  return (
    <StorageProvider prefix={storagePrefix || 'xp_'}>
      <EventBusProvider bus={busRef}>
      <XPEventBridge onEvent={onEvent} />
      <UserSessionProvider
        username={username}
        password={password}
        autoLogin={autoLogin}
        avatar={avatar}
        wallpapers={wallpapers}
        defaultWallpaper={defaultWallpaper ?? culture.wallpaper}
      >
        <FileSystemProvider
          customFileSystem={customFileSystem}
          cultureFileSystem={culturalShortcuts}
          cultureKey={cultureKey}
          fileSystemMode={fileSystemMode}
        >
          <WindowManagerProvider registry={registry}>
            <TrayProvider>
              <ModalProvider>
                <XPImperativeApi ref={handleRef} storagePrefix={storagePrefix} />
                <App
                  initialLanguage={language}
                  skipBoot={skipBoot}
                  disableContextMenuBlock={disableContextMenuBlock}
                  disableDevToolsBlock={disableDevToolsBlock}
                  disableGlobalShortcuts={disableGlobalShortcuts}
                  disableScreenSaver={disableScreenSaver}
                />
              </ModalProvider>
            </TrayProvider>
          </WindowManagerProvider>
        </FileSystemProvider>
      </UserSessionProvider>
      </EventBusProvider>
    </StorageProvider>
  );
};

/** Convert desktop shortcuts from a culture package into filesystem nodes. */
function desktopShortcutsToNodes(
  shortcuts: NonNullable<CulturePackage['desktopShortcuts']>
): Record<string, FileNode> {
  return Object.fromEntries(
    shortcuts.map(s => [
      s.name,
      {
        type: 'app_shortcut',
        name: s.name,
        app: s.app,
        icon: s.icon,
        managedByCulture: true,
        cultureId: s.id,
      } as FileNode,
    ])
  );
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  cultures,
  apps,
  language,
  ...rest
}) => {
  const activeLang = getSavedLanguage(language || 'en');

  return (
    <div className="windows-xp-root" style={{ width: '100%', height: '100%' }}>
      <I18nextProvider i18n={xpI18n}>
        <AppRegistryProvider apps={apps}>
          <CultureProvider cultures={cultures} defaultLanguage={activeLang}>
            <CultureAwareProviders language={language} {...rest} />
          </CultureProvider>
        </AppRegistryProvider>
      </I18nextProvider>
    </div>
  );
};

export default AppProviders;
