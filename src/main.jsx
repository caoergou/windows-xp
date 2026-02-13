import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { FileSystemProvider } from './context/FileSystemContext';
import { WindowManagerProvider } from './context/WindowManagerContext';
import { UserSessionProvider } from './context/UserSessionContext';
import { UserProgressProvider } from './context/UserProgressContext';
import 'xp.css/dist/XP.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <UserSessionProvider>
      <FileSystemProvider>
        <WindowManagerProvider>
          <UserProgressProvider>
            <App />
          </UserProgressProvider>
        </WindowManagerProvider>
      </FileSystemProvider>
    </UserSessionProvider>
);
