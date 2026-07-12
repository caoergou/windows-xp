import ReactDOM from 'react-dom/client';
import { AppProviders } from './components/AppProviders';
import Gallery from './gallery/Gallery';
import './i18n';
import 'xp.css/dist/XP.css';
import './index.css';

const params = new URLSearchParams(window.location.search);

// Allow overriding the default language via URL, e.g. ?lang=zh
const urlLang = params.get('lang');
const initialLanguage = urlLang === 'zh' || urlLang === 'en' ? urlLang : undefined;

// Micro-component gallery route (#99 / #78): ?gallery renders the component
// catalog used for visual-regression baselines instead of the desktop.
const showGallery = params.has('gallery');

// Deep linking (#136): ?open=<key/path> (repeatable) opens windows on load;
// ?history=1 makes browser Back close the last-opened window.
const openOnLoad = params.getAll('open');
const historyIntegration = params.get('history') === '1';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  showGallery ? (
    <Gallery />
  ) : (
    <AppProviders
      language={initialLanguage}
      openOnLoad={openOnLoad}
      historyIntegration={historyIntegration}
    />
  )
);
