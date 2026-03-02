import React from 'react';
import App from '../App.jsx';
import { FileSystemProvider } from '../context/FileSystemContext';
import { WindowManagerProvider } from '../context/WindowManagerContext';
import { UserSessionProvider } from '../context/UserSessionContext';
import { ModalProvider } from '../context/ModalContext';
import '../i18n';
import 'xp.css/dist/XP.css';
import '../index.css';

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
 *
 * @param {Object} props - Component props
 * @param {string} [props.username='User'] - Default username for login
 * @param {string} [props.password='password'] - Default password for login
 * @param {string} [props.language='en'] - Initial language ('en' or 'zh')
 * @param {Object} [props.customFileSystem] - Custom file system structure
 */
export const WindowsXP = ({
  username = 'User',
  password = 'password',
  language = 'en',
  customFileSystem = null
}) => {
  return (
    <UserSessionProvider username={username} password={password}>
      <FileSystemProvider customFileSystem={customFileSystem}>
        <WindowManagerProvider>
          <ModalProvider>
            <App initialLanguage={language} />
          </ModalProvider>
        </WindowManagerProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  );
};

export default WindowsXP;
