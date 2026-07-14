import React from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseFrontmatter } from '../../content/blog';

/**
 * Markdown → React rendering for the MarkdownViewer (#137, #254).
 *
 * Backed by `react-markdown` + `remark-gfm` (the mature, widely-used ecosystem
 * standard) rather than a hand-rolled parser: CommonMark plus GitHub-flavoured
 * extensions (tables, task lists, strikethrough, autolinks) come for free, and
 * react-markdown renders to real React elements with raw HTML disabled by
 * default — so untrusted post content can't inject markup (no
 * `dangerouslySetInnerHTML`). MarkdownViewer is lazy-loaded, so the dependency
 * lands in its own chunk and never weighs on the core entry (#113 size budget).
 *
 * A leading YAML frontmatter block is stripped before rendering (it drives the
 * viewer's title/date header instead — see `parseFrontmatter`).
 */

export interface RenderMarkdownOptions {
  /**
   * Called instead of following a link natively (used to open the link in the
   * desktop's Internet Explorer). When omitted, links open in a new browser tab.
   */
  onLinkClick?: (href: string) => void;
  /** Extra `react-markdown` component overrides merged over the defaults (plugin seam). */
  components?: Options['components'];
  /** Extra remark plugins appended after `remark-gfm`. */
  remarkPlugins?: Options['remarkPlugins'];
}

type AnchorProps = React.ComponentPropsWithoutRef<'a'> & { node?: unknown };

// A link component that either routes clicks through `onLinkClick` (e.g. open in
// IE) or falls back to a safe new-tab anchor.
const makeLink = (onLinkClick?: (href: string) => void) => {
  const MarkdownLink = ({ node: _node, href, children, ...props }: AnchorProps) => {
    if (onLinkClick && href) {
      return (
        <a
          {...props}
          href={href}
          onClick={e => {
            e.preventDefault();
            onLinkClick(href);
          }}
        >
          {children}
        </a>
      );
    }
    return (
      <a {...props} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  };
  return MarkdownLink;
};

/** Render a Markdown source string (frontmatter tolerated) into React elements. */
export function renderMarkdown(
  src: string,
  options: RenderMarkdownOptions = {}
): React.ReactElement {
  const { body } = parseFrontmatter(src);
  const { onLinkClick, components, remarkPlugins } = options;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, ...(remarkPlugins ?? [])]}
      components={{ a: makeLink(onLinkClick), ...components }}
    >
      {body}
    </ReactMarkdown>
  );
}
