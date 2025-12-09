import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { FileSystemProvider } from './context/FileSystemContext';
import { WindowManagerProvider } from './context/WindowManagerContext';
import { UserSessionProvider } from './context/UserSessionContext';
import 'xp.css/dist/XP.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserSessionProvider>
      <FileSystemProvider>
        <WindowManagerProvider>
          <App />
        </WindowManagerProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  </React.StrictMode>,
);
