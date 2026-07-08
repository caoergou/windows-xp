import React from 'react';
import { useTranslation } from 'react-i18next';
import App from '../App';
import { FileSystemProvider } from '../context/FileSystemContext';
import { WindowManagerProvider } from '../context/WindowManagerContext';
import { UserSessionProvider } from '../context/UserSessionContext';
import { TrayProvider } from '../context/TrayContext';
import { ModalProvider } from '../context/ModalContext';
import { FileNode } from '../types';
import { getDesktopShortcutNodes } from '../data/culture';

interface AppProvidersProps {
  username?: string;
  password?: string;
  language?: 'en' | 'zh';
  customFileSystem?: Record<string, FileNode>;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  username,
  password,
  language,
  customFileSystem,
}) => {
  const { i18n } = useTranslation();
  const activeLang = language || i18n.language || 'en';
  const culturalShortcuts = getDesktopShortcutNodes(activeLang);

  // 用户传入的 customFileSystem 优先级高于文化包
  const mergedCustomFileSystem = {
    ...culturalShortcuts,
    ...customFileSystem,
  };

  return (
    <UserSessionProvider username={username} password={password}>
      <FileSystemProvider customFileSystem={mergedCustomFileSystem}>
        <WindowManagerProvider>
          <TrayProvider>
            <ModalProvider>
              <App initialLanguage={language} />
            </ModalProvider>
          </TrayProvider>
        </WindowManagerProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  );
};

export default AppProviders;
