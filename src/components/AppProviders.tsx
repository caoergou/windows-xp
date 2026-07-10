import React, { useEffect, useMemo } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import App from '../App';
import xpI18n, { NAMESPACE } from '../i18n';
import { FileSystemProvider } from '../context/FileSystemContext';
import { WindowManagerProvider } from '../context/WindowManagerContext';
import { UserSessionProvider } from '../context/UserSessionContext';
import { TrayProvider } from '../context/TrayContext';
import { ModalProvider } from '../context/ModalContext';
import { AppRegistryProvider, useAppRegistry } from '../context/AppRegistryContext';
import { CultureProvider, useCulture } from '../context/CultureContext';
import { FileNode, AppRegistryEntry } from '../types';
import { CulturePackage } from '../data/culture';
import { setStoragePrefix } from '../utils/storage';
import { getSavedLanguage } from '../utils/language';

export interface AppProvidersProps {
  username?: string;
  password?: string;
  language?: string;
  customFileSystem?: Record<string, FileNode>;
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
  username,
  password,
  language,
  customFileSystem,
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
    <UserSessionProvider username={username} password={password} autoLogin={autoLogin}>
      <FileSystemProvider
        customFileSystem={customFileSystem}
        cultureFileSystem={culturalShortcuts}
        cultureKey={cultureKey}
      >
        <WindowManagerProvider registry={registry}>
          <TrayProvider>
            <ModalProvider>
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
