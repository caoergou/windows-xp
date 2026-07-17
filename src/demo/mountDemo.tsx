import ReactDOM from 'react-dom/client';
import { AppProviders } from '../components/AppProviders';
import type { BootBranding, LoginBranding } from '../branding';
import '../i18n';
import 'xp.css/dist/XP.css';
import '../index.css';
import { referenceContentPack } from '../data/referencePack';

/**
 * Shared bootstrap for the live-desktop demo pages (#160). Each locale shell
 * (`/demo/zh/`, `/demo/en/`) mounts the full desktop with its default language.
 * Deep-linking / demo query params are preserved so old shared links keep
 * working (they used to live on the root desktop before the site became
 * multi-page):
 *   ?lang=en|zh                overrides the page default (#160 §9.6)
 *   ?open=<key> (repeatable)   opens windows on load (#136)
 *   ?history=1                 browser Back closes the last-opened window (#136)
 *   ?persistence=none|session|local   per-visit persistence mode (#138)
 *   ?brand=demo                inline branded boot + login demo (#139)
 *   ?content=reference         mounts the reference content pack (#241)
 */
export function mountDemo(defaultLang: 'en' | 'zh') {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  const language = urlLang === 'zh' || urlLang === 'en' ? urlLang : defaultLang;
  const openOnLoad = params.getAll('open');
  const historyIntegration = params.get('history') === '1';
  const contentPacks = params.get('content') === 'reference' ? [referenceContentPack] : undefined;

  const pParam = params.get('persistence');
  const persistence =
    pParam === 'none' || pParam === 'session' || pParam === 'local' ? pParam : undefined;

  // Branding demo (#139): ?brand=demo skins boot + login with inline sample
  // assets so the campaign-skinning path is inspectable without external files.
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

  // The branding demo wants to show the boot + login screens; otherwise land
  // straight on the desktop (a friendly demo door).
  const branded = params.get('brand') === 'demo';

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <AppProviders
      language={language}
      openOnLoad={openOnLoad}
      historyIntegration={historyIntegration}
      persistence={persistence}
      contentPacks={contentPacks}
      boot={boot}
      login={login}
      skipBoot={!branded}
      autoLogin={!branded}
    />
  );
}
