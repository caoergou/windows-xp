/**
 * Blog content pipeline (#137): manifest → filesystem, RSS, static mirror,
 * MarkdownViewer rendering, and an end-to-end deep-linked post open.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildContentFs,
  buildRssFeed,
  buildPostMirrorHtml,
  postPermalink,
  postPath,
  WindowsXP,
} from '../src/lib';
import type { ContentManifest, SiteMeta } from '../src/lib';
import MarkdownViewer from '../src/apps/MarkdownViewer';
import { renderMarkdown } from '../src/apps/MarkdownViewer/markdown';

const manifest: ContentManifest = [
  { slug: 'hello', title: 'Hello World', date: 'Mon, 01 Jan 2007 00:00:00 GMT', source: '# Hello\n\nHi.', excerpt: 'A first post' },
  { slug: 'nested', title: 'In A Folder', source: 'Body', folder: 'posts' },
];

const site: SiteMeta = {
  title: 'My XP Blog',
  description: 'Posts from 2007',
  siteUrl: 'https://example.com/',
  language: 'en',
};

describe('buildContentFs (#137)', () => {
  it('maps flat posts to <slug>.md MarkdownViewer nodes', () => {
    const fs = buildContentFs([manifest[0]]);
    const node = fs['hello.md'];
    expect(node).toMatchObject({ type: 'file', app: 'MarkdownViewer', name: 'Hello World' });
    expect((node as { content?: string }).content).toContain('# Hello');
  });

  it('groups posts that share a folder under a folder node', () => {
    const fs = buildContentFs(manifest);
    expect(fs['hello.md']).toBeTruthy();
    const folder = fs['posts'];
    expect(folder.type).toBe('folder');
    expect((folder as { children: Record<string, unknown> }).children['nested.md']).toBeTruthy();
  });
});

describe('permalinks & RSS & mirror (#137/#136)', () => {
  it('postPath is folder-aware', () => {
    expect(postPath(manifest[0])).toEqual(['hello.md']);
    expect(postPath(manifest[1])).toEqual(['posts', 'nested.md']);
  });

  it('postPermalink builds a ?open= deep link with lang', () => {
    expect(postPermalink(manifest[0], site)).toBe('https://example.com/?open=hello.md&lang=en');
    expect(postPermalink(manifest[1], site)).toBe('https://example.com/?open=posts/nested.md&lang=en');
  });

  it('buildRssFeed emits items with title/link and escapes content', () => {
    const rss = buildRssFeed(manifest, { ...site, title: 'Me & Co' });
    expect(rss).toContain('<rss version="2.0">');
    expect(rss).toContain('<title>Hello World</title>');
    expect(rss).toContain('https://example.com/?open=hello.md&amp;lang=en');
    expect(rss).toContain('Me &amp; Co');
  });

  it('buildPostMirrorHtml is crawlable and links back to the desktop', () => {
    const html = buildPostMirrorHtml(manifest[0], site);
    expect(html).toContain('<title>Hello World — My XP Blog</title>');
    expect(html).toContain('<link rel="canonical" href="https://example.com/?open=hello.md&amp;lang=en">');
    expect(html).toContain('<pre># Hello'); // raw-markdown fallback body
    const rich = buildPostMirrorHtml(manifest[0], site, '<h2>Rendered</h2>');
    expect(rich).toContain('<h2>Rendered</h2>');
  });
});

describe('renderMarkdown / MarkdownViewer (#137)', () => {
  it('renders headings, bold, italic, code, links and lists', () => {
    render(
      <div>
        {renderMarkdown(
          '# Title\n\nSome **bold**, *em*, `code` and a [link](https://x.dev).\n\n- one\n- two'
        )}
      </div>
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('code').tagName).toBe('CODE');
    const link = screen.getByRole('link', { name: 'link' });
    expect(link).toHaveAttribute('href', 'https://x.dev');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('MarkdownViewer shows the file name and rendered body', () => {
    render(<MarkdownViewer content={'## Heading\n\nbody text'} fileName="post.md" />);
    expect(screen.getByText('post.md')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Heading' })).toBeInTheDocument();
  });
});

describe('end-to-end: a manifest post opens via deep link (#137)', () => {
  beforeEach(() => localStorage.clear());

  it('openOnLoad opens the post in MarkdownViewer, rendered', async () => {
    render(
      <WindowsXP
        skipBoot
        autoLogin
        disableScreenSaver
        customFileSystem={buildContentFs([manifest[0]])}
        openOnLoad="hello.md"
      />
    );
    await waitFor(() => expect(screen.getByTestId('markdown-viewer')).toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 1, name: 'Hello' })).toBeInTheDocument();
  });
});
