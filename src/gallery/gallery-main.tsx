import ReactDOM from 'react-dom/client';
import Gallery from './Gallery';
import '../i18n';
import 'xp.css/dist/XP.css';
import '../index.css';

// Component gallery (#160): moved from the old `/?gallery` query route to `/gallery/`.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Gallery />);
