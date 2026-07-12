export interface HistoryEntry {
  url: string;
  html: string | null;
  error?: boolean;
}

export interface BrowsingHistoryItem {
  url: string;
  timestamp: number;
}

export interface FavoriteItem {
  name: string;
  url: string;
  locales?: string[];
}

/**
 * One authored page in a scenario's in-world "web" (#219 / #134). It surfaces in
 * the search engine (see `searchCorpus`) and, when the player clicks through,
 * IE renders its `html` as the landing page. `match` lists the query terms that
 * surface it (case-insensitive substring against the query).
 */
export interface SearchResultPage {
  id: string;
  title: string;
  /** The URL the result links to; clicking navigates IE here. */
  url: string;
  snippet?: string;
  /** The landing page rendered when the result is opened (IE's authored-html path). */
  html?: string;
  match: string[];
}

export interface InternetExplorerProps {
  url?: string;
  html?: string;
  plugin?: (
    url: string,
    navigateTo: (url: string, html?: string) => void,
    openNewIE: (url: string) => void
  ) => React.ReactNode;
  /**
   * Scenario-provided search corpus (#219 / #134). When present, the in-world
   * search engine (`baidu.com`) searches over it and emits `search:query`;
   * scenarios gate on `searched(term)` / `found(id)`. JSON-serializable, so it
   * rides the window props through refresh-restoration.
   */
  searchCorpus?: SearchResultPage[];
}
