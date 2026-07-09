import ReactDOM from 'react-dom/client';
import { AppProviders } from './components/AppProviders';
import './i18n';
import 'xp.css/dist/XP.css';
import './index.css';

// Allow overriding the default language via URL, e.g. ?lang=zh
const urlLang = new URLSearchParams(window.location.search).get('lang');
const initialLanguage = urlLang === 'zh' || urlLang === 'en' ? urlLang : undefined;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <AppProviders language={initialLanguage} />
);
