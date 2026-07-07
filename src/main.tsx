import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './components/AppProviders';
import './i18n';
import 'xp.css/dist/XP.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <AppProviders />
);
