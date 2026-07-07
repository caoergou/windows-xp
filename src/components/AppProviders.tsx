import React from 'react';
import App from '../App';
import { FileSystemProvider } from '../context/FileSystemContext';
import { WindowManagerProvider } from '../context/WindowManagerContext';
import { UserSessionProvider } from '../context/UserSessionContext';
import { TrayProvider } from '../context/TrayContext';
import { ModalProvider } from '../context/ModalContext';
import { FileNode } from '../types';

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
  return (
    <UserSessionProvider username={username} password={password}>
      <FileSystemProvider customFileSystem={customFileSystem}>
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
