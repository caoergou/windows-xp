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

export interface InternetExplorerProps {
  url?: string;
  html?: string;
  plugin?: (
    url: string,
    navigateTo: (url: string, html?: string) => void,
    openNewIE: (url: string) => void
  ) => React.ReactNode;
}
