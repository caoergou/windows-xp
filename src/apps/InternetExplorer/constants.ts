// 将普通 URL 转为互联网档案馆（Wayback Machine）存档链接，
// 呈现 2006 年 Windows XP 全盛期的真实网页样貌。
// if_ 后缀使存档页面以内嵌模式呈现，不显示 Wayback 顶部工具条。
export const WAYBACK_TS = '20060615120000';

export const toWaybackUrl = (url: string): string => {
  if (!url || url === 'about:blank') return url;
  if (url.includes('web.archive.org')) return url;
  return `https://web.archive.org/web/${WAYBACK_TS}if_/${url}`;
};

export const DEFAULT_HOMEPAGE = 'https://web.archive.org/web/20060615000000/http://www.hao123.com/';

// ── In-world search engine (#219 / #134) ─────────────────────────────────────
// The scenario-layer search page lives inside IE at baidu.com; the player's
// query rides in the URL (`?wd=`) so Back/Forward replay searches naturally.
// google.com is blacklisted era-accurately, so a search there redirects here.
export const SEARCH_ENGINE_HOME = 'http://www.baidu.com';

/** Whether `url` is the in-world search engine (its home or a results page). */
export const isSearchEngineUrl = (url: string): boolean => {
  const u = url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  return (
    u === 'www.baidu.com' ||
    u === 'baidu.com' ||
    u.startsWith('www.baidu.com/s') ||
    u.startsWith('baidu.com/s')
  );
};

/** The results-page URL for a query (baidu's real `?wd=` param). */
export const searchResultsUrl = (query: string): string =>
  `${SEARCH_ENGINE_HOME}/s?wd=${encodeURIComponent(query)}`;

/** Pull the query back out of a results-page URL; empty string for the home page. */
export const parseSearchQuery = (url: string): string => {
  const q = url.match(/[?&]wd=([^&]*)/);
  return q ? decodeURIComponent(q[1].replace(/\+/g, ' ')) : '';
};
