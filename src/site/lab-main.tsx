import ReactDOM from 'react-dom/client';
import { createGlobalStyle } from 'styled-components';
import GlassBox from './GlassBox';
import { SiteI18nProvider } from './siteI18n';
import '../scoped.css';

/**
 * /lab/ — the glass box's home after the landing page went single-act (#250).
 * A developer-facing proof page: live desktop + real onEvent ticker +
 * haunt/swap/break drivers, out of the first impression's way.
 */

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
    min-height: 100%;
    background: #0b1220;
    font-family: 'Trebuchet MS', Tahoma, 'Microsoft YaHei', sans-serif;
  }
  * { box-sizing: border-box; }
`;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <SiteI18nProvider>
    <GlobalStyle />
    <GlassBox />
  </SiteI18nProvider>
);
