import { createContext, useContext } from 'react';
import type { Options } from 'react-markdown';

/**
 * Author-facing MarkdownViewer configuration (#254), passed as the `markdown`
 * prop on `WindowsXP` and consumed by every `.md` window through context.
 */
export interface MarkdownOptions {
  /**
   * Where links inside a Markdown document open when clicked:
   * - `'ie'` — the desktop's own Internet Explorer window (stays in the fiction);
   * - `'external'` — a real browser tab (default).
   */
  linkTarget?: 'ie' | 'external';
  /**
   * Extra `react-markdown` component overrides, merged over the defaults — the
   * plugin seam for things the core deliberately doesn't bundle (e.g. a `code`
   * renderer that draws mermaid diagrams). See the content guide.
   */
  components?: Options['components'];
  /** Extra remark plugins, appended after the built-in `remark-gfm`. */
  remarkPlugins?: Options['remarkPlugins'];
}

/** Runtime config: author options plus the in-desktop capabilities the provider injects. */
export interface MarkdownRuntime extends MarkdownOptions {
  /** Injected in-desktop so a link can open the Internet Explorer app. */
  openInIE?: (url: string) => void;
}

const MarkdownConfigContext = createContext<MarkdownRuntime>({});

/** Read the current MarkdownViewer config. Safe outside the provider (returns `{}`). */
export const useMarkdownConfig = (): MarkdownRuntime => useContext(MarkdownConfigContext);

export const MarkdownConfigProvider = MarkdownConfigContext.Provider;
