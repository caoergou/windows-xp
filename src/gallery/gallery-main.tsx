import ReactDOM from 'react-dom/client';
import Gallery from './Gallery';
import '../i18n';
import '../scoped.css';
import { xpTheme } from '../themes/xp';
import { mountThemeCss } from '../themes/mountThemeCss';

// The gallery renders micro-components bare (no AppProviders), so the entry
// mounts the theme's skin sheet itself (#213 B1).
mountThemeCss(xpTheme);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Gallery />);
