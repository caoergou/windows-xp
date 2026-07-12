import ReactDOM from 'react-dom/client';
import { AppProviders } from '../components/AppProviders';
import '../i18n';
import 'xp.css/dist/XP.css';
import '../index.css';

/**
 * Shared bootstrap for the live-desktop demo pages (#160). Each locale shell
 * (`/demo/zh/`, `/demo/en/`) mounts the full desktop with its default language.
 * Deep-linking query params are preserved so old shared links keep working:
 *   ?lang=en|zh  overrides the page default (#160 §9.6, back-compat with ?demo=1&lang=x)
 *   ?open=<key>  (repeatable) opens windows on load (#136)
 *   ?history=1   makes browser Back close the last-opened window (#136)
 */
export function mountDemo(defaultLang: 'en' | 'zh') {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  const language = urlLang === 'zh' || urlLang === 'en' ? urlLang : defaultLang;
  const openOnLoad = params.getAll('open');
  const historyIntegration = params.get('history') === '1';

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <AppProviders
      language={language}
      openOnLoad={openOnLoad}
      historyIntegration={historyIntegration}
      skipBoot
      autoLogin
    />
  );
}
