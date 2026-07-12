import ReactDOM from 'react-dom/client';
import { AppProviders } from './components/AppProviders';
import Gallery from './gallery/Gallery';
import type { BootBranding, LoginBranding } from './branding';
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

// Persistence mode (#138): ?persistence=none|session|local (default local).
const pParam = params.get('persistence');
const persistence =
  pParam === 'none' || pParam === 'session' || pParam === 'local' ? pParam : undefined;

// Branding demo route (#139): ?brand=demo skins the boot + login screens with
// inline sample assets (a data-URI SVG logo, a gradient login background) so the
// campaign-skinning path is inspectable without external files.
let boot: BootBranding | undefined;
let login: LoginBranding | undefined;
if (params.get('brand') === 'demo') {
  const logo =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">' +
        '<rect width="200" height="60" rx="8" fill="%23ff6600"/>' +
        '<text x="100" y="40" font-family="Arial" font-size="30" font-weight="bold" ' +
        'fill="white" text-anchor="middle">ACME</text></svg>'
    );
  boot = { logo, text: 'ACME 2000', progressColor: 'orange', startupSound: undefined };
  login = {
    title: 'ACME Portal',
    userName: 'Guest',
    background: 'linear-gradient(135deg, rgb(27,27,58) 0%, rgb(58,27,90) 100%)',
  };
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  showGallery ? (
    <Gallery />
  ) : (
    <AppProviders
      language={initialLanguage}
      openOnLoad={openOnLoad}
      historyIntegration={historyIntegration}
      persistence={persistence}
      boot={boot}
      login={login}
    />
  )
);
