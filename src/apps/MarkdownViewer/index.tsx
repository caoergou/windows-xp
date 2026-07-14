import React from 'react';
import styled from 'styled-components';
import { COLORS } from '../../constants';
import { parseFrontmatter } from '../../content/blog';
import { renderMarkdown } from './markdown';
import { useMarkdownConfig } from './config';

export interface MarkdownViewerProps {
  /** Markdown source to render. */
  content?: string;
  /** File name shown in the info bar. */
  fileName?: string;
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${COLORS.SURFACE};
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
`;

// A thin "reading" info strip, à la the Word/HTML viewers of the era.
const InfoBar = styled.div`
  flex: 0 0 auto;
  padding: 2px 6px;
  font-size: 11px;
  color: black;
  border-bottom: 1px solid ${COLORS.BUTTON_SHADOW};
  background: ${COLORS.SURFACE};
  display: flex;
  align-items: center;
  gap: 6px;
`;

// The document surface: white page inset in the window, like a viewer canvas.
const Page = styled.div`
  flex: 1 1 auto;
  overflow: auto;
  margin: 6px;
  padding: 18px 22px;
  background: white;
  border: 1px solid ${COLORS.BUTTON_SHADOW};
  color: black;
  font-size: 13px;
  line-height: 1.5;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: 'Trebuchet MS', 'Tahoma', sans-serif;
    color: ${COLORS.BUTTON_BORDER};
    line-height: 1.25;
    margin: 0.8em 0 0.4em;
  }
  h1 {
    font-size: 1.7em;
    border-bottom: 1px solid ${COLORS.INPUT_BORDER};
    padding-bottom: 0.15em;
  }
  h2 {
    font-size: 1.4em;
  }
  h3 {
    font-size: 1.18em;
  }
  p {
    margin: 0 0 0.75em;
  }
  a {
    color: ${COLORS.MENU_HIGHLIGHT};
    text-decoration: underline;
  }
  ul,
  ol {
    margin: 0 0 0.75em;
    padding-left: 1.6em;
  }
  li {
    margin: 0.15em 0;
  }
  code {
    font-family: 'Courier New', monospace;
    font-size: 0.95em;
    background: ${COLORS.BUTTON_FACE};
    padding: 0 3px;
  }
  pre {
    background: ${COLORS.BUTTON_FACE};
    border: 1px solid ${COLORS.BUTTON_SHADOW};
    padding: 8px 10px;
    overflow-x: auto;
    margin: 0 0 0.75em;
  }
  pre code {
    background: transparent;
    padding: 0;
  }
  blockquote {
    margin: 0 0 0.75em;
    padding: 2px 12px;
    border-left: 3px solid ${COLORS.INPUT_BORDER};
    color: ${COLORS.BUTTON_SHADOW};
  }
  hr {
    border: none;
    border-top: 1px solid ${COLORS.BUTTON_SHADOW};
    margin: 1em 0;
  }
  img {
    max-width: 100%;
  }
  table {
    border-collapse: collapse;
    margin: 0 0 0.75em;
    font-size: 0.95em;
  }
  th,
  td {
    border: 1px solid ${COLORS.BUTTON_SHADOW};
    padding: 3px 8px;
    text-align: left;
  }
  th {
    background: ${COLORS.BUTTON_FACE};
  }
  /* GFM task lists: drop the bullet and restore a real checkbox glyph (xp.css
     resets checkbox appearance to a sprite that renders invisible here). */
  .contains-task-list {
    padding-left: 0.3em;
  }
  .task-list-item {
    list-style: none;
  }
  .task-list-item input[type='checkbox'] {
    appearance: auto;
    -webkit-appearance: auto;
    position: static;
    opacity: 1;
    width: 13px;
    height: 13px;
    margin: 0 6px 0 0;
    vertical-align: middle;
  }
`;

// Article header rendered from frontmatter (title + date), above the body.
const PostHeader = styled.header`
  margin: 0 0 1em;
  padding-bottom: 0.4em;
  border-bottom: 1px solid ${COLORS.INPUT_BORDER};

  h1 {
    margin: 0;
    border: none;
    padding: 0;
    font-family: 'Trebuchet MS', 'Tahoma', sans-serif;
    color: ${COLORS.BUTTON_BORDER};
    font-size: 1.8em;
    line-height: 1.2;
  }
  .post-date {
    display: block;
    margin-top: 0.25em;
    font-size: 11px;
    color: ${COLORS.BUTTON_SHADOW};
  }
`;

const scalar = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v.join(', ') : v;

/**
 * MarkdownViewer (#137) — an era-appropriate document viewer for `.md` files.
 * Renders Markdown with a small built-in renderer (no heavyweight dependency)
 * inside XP window chrome. Notepad stays the plain-text editor.
 */
const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content = '', fileName }) => {
  // A blog post authored with frontmatter gets a rendered title/date header
  // (#254); plain Markdown renders unchanged (no header).
  const { data } = parseFrontmatter(content);
  const title = scalar(data.title);
  const date = scalar(data.date);

  // Author config (#254): link target (in-desktop IE vs new tab) + plugin seam.
  const cfg = useMarkdownConfig();
  const onLinkClick =
    cfg.linkTarget === 'ie' && cfg.openInIE ? (href: string) => cfg.openInIE!(href) : undefined;

  return (
    <Container data-testid="markdown-viewer">
      {fileName && <InfoBar>{fileName}</InfoBar>}
      <Page data-testid="markdown-page">
        {title && (
          <PostHeader data-testid="markdown-post-header">
            <h1>{title}</h1>
            {date && <span className="post-date">{date}</span>}
          </PostHeader>
        )}
        {renderMarkdown(content, {
          onLinkClick,
          components: cfg.components,
          remarkPlugins: cfg.remarkPlugins,
        })}
      </Page>
    </Container>
  );
};

export default MarkdownViewer;
