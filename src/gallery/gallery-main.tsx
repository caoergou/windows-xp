import ReactDOM from 'react-dom/client';
import Gallery from './Gallery';
import '../i18n';
import 'xp.css/dist/XP.css';
import '../scoped.css';
import '../themes/xp/xp-chrome.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Gallery />);
