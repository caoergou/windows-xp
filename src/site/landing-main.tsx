import ReactDOM from 'react-dom/client';
import { SiteI18nProvider } from './siteI18n';
import Landing from './Landing';
import 'xp.css/dist/XP.css';
import '../index.css';

// Landing page entry (#160). The engine embed itself is lazy-loaded inside
// Landing → HeroDesktop, keeping this entry lean (§7.7 budget).
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <SiteI18nProvider>
    <Landing />
  </SiteI18nProvider>
);
