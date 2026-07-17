/** Structured, serializable early-web page authoring for IE (#281). */
export type EraPageTemplate = 'portal' | 'news' | 'forum' | 'profile';

export interface EraPageLink {
  label: string;
  href: string;
}

export interface EraPageSection {
  heading?: string;
  body?: string[];
  links?: EraPageLink[];
  byline?: string;
  timestamp?: string;
}

export interface EraPage {
  template: EraPageTemplate;
  title: string;
  masthead?: string;
  nav?: EraPageLink[];
  sections: EraPageSection[];
  sidebar?: EraPageSection[];
  footer?: string;
}

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    char =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] ?? char
  );

const links = (items: EraPageLink[] = []): string =>
  items.map(item => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join(' · ');

const section = (item: EraPageSection): string =>
  `<section>${item.heading ? `<h2>${escapeHtml(item.heading)}</h2>` : ''}` +
  `${item.byline || item.timestamp ? `<small>${escapeHtml([item.byline, item.timestamp].filter(Boolean).join(' · '))}</small>` : ''}` +
  `${(item.body ?? []).map(line => `<p>${escapeHtml(line)}</p>`).join('')}` +
  `${item.links?.length ? `<div class="links">${links(item.links)}</div>` : ''}</section>`;

export const renderEraPage = (page: EraPage): string =>
  `<!doctype html><html><head>` +
  `<meta charset="utf-8"><title>${escapeHtml(page.title)}</title><style>` +
  `body{margin:0;background:white;color:black;font:12px Tahoma,Arial,sans-serif}` +
  `.wrap{width:760px;margin:8px auto;border:1px solid gray}.mast{padding:10px;background:navy;color:white;font:bold 24px Georgia,serif}` +
  `nav{padding:5px 10px;background:silver;border-bottom:1px solid gray}a{color:mediumblue}` +
  `.cols{display:grid;grid-template-columns:1fr 190px;gap:10px;padding:10px}` +
  `main section,aside section{margin-bottom:12px;border-bottom:1px dotted gray}h2{font-size:16px;color:darkblue;margin:0 0 4px}` +
  `p{line-height:1.5;margin:5px 0}small{color:dimgray}.forum main section{background:whitesmoke;padding:7px}` +
  `footer{padding:8px;text-align:center;border-top:1px solid silver;color:dimgray}</style></head>` +
  `<body class="${page.template}"><div class="wrap"><div class="mast">${escapeHtml(page.masthead ?? page.title)}</div>` +
  `${page.nav?.length ? `<nav>${links(page.nav)}</nav>` : ''}<div class="cols"><main>${page.sections.map(section).join('')}</main>` +
  `<aside>${(page.sidebar ?? []).map(section).join('')}</aside></div>` +
  `${page.footer ? `<footer>${escapeHtml(page.footer)}</footer>` : ''}</div></body></html>`;
