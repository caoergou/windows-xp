import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import App from '../App';
import { FileSystemProvider } from '../context/FileSystemContext';
import { WindowManagerProvider } from '../context/WindowManagerContext';
import { UserSessionProvider } from '../context/UserSessionContext';
import { TrayProvider } from '../context/TrayContext';
import { ModalProvider } from '../context/ModalContext';
import { FileNode } from '../types';
import { getDesktopShortcutNodes, normalizeCultureLang } from '../data/culture';
import { setStoragePrefix } from '../utils/storage';
import { getSavedLanguage } from '../utils/language';

export interface AppProvidersProps {
  username?: string;
  password?: string;
  language?: 'en' | 'zh';
  customFileSystem?: Record<string, FileNode>;
  skipBoot?: boolean;
  autoLogin?: boolean;
  storagePrefix?: string;
  disableContextMenuBlock?: boolean;
  disableDevToolsBlock?: boolean;
  disableScreenSaver?: boolean;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  username,
  password,
  language,
  customFileSystem,
  skipBoot,
  autoLogin,
  storagePrefix,
  disableContextMenuBlock,
  disableDevToolsBlock,
  disableScreenSaver,
}) => {
  // Configure storage namespace synchronously before any context reads/writes storage.
  setStoragePrefix(storagePrefix || 'xp_');

  const { i18n } = useTranslation();
  const activeLang = getSavedLanguage(language || 'en');
  const cultureKey = normalizeCultureLang(activeLang);
  const culturalShortcuts = useMemo(() => getDesktopShortcutNodes(cultureKey), [cultureKey]);

  useEffect(() => {
    if (i18n.language !== activeLang) i18n.changeLanguage(activeLang);
  }, [activeLang, i18n]);

  // 用户传入的 customFileSystem 优先级高于文化包
  return (
    <UserSessionProvider username={username} password={password} autoLogin={autoLogin}>
      <FileSystemProvider
        customFileSystem={customFileSystem}
        cultureFileSystem={culturalShortcuts}
        cultureKey={cultureKey}
      >
        <WindowManagerProvider>
          <TrayProvider>
            <ModalProvider>
              <App
                initialLanguage={language}
                skipBoot={skipBoot}
                disableContextMenuBlock={disableContextMenuBlock}
                disableDevToolsBlock={disableDevToolsBlock}
                disableScreenSaver={disableScreenSaver}
              />
            </ModalProvider>
          </TrayProvider>
        </WindowManagerProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  );
};

export default AppProviders;
