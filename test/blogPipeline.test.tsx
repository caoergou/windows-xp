/**
 * Blog content pipeline (#137): manifest → filesystem, RSS, static mirror,
 * MarkdownViewer rendering, and an end-to-end deep-linked post open.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildContentFs,
  buildRssFeed,
  buildSitemap,
  buildPostMirrorHtml,
  postPermalink,
  postPath,
  parseFrontmatter,
  postFromMarkdown,
  WindowsXP,
} from '../src/lib';
import type { ContentManifest, SiteMeta } from '../src/lib';
import MarkdownViewer from '../src/apps/MarkdownViewer';
import { renderMarkdown } from '../src/apps/MarkdownViewer/markdown';

const manifest: ContentManifest = [
  {
    slug: 'hello',
    title: 'Hello World',
    date: 'Mon, 01 Jan 2007 00:00:00 GMT',
    source: '# Hello\n\nHi.',
    excerpt: 'A first post',
  },
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
    expect(postPermalink(manifest[1], site)).toBe(
      'https://example.com/?open=posts/nested.md&lang=en'
    );
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
    expect(html).toContain(
      '<link rel="canonical" href="https://example.com/?open=hello.md&amp;lang=en">'
    );
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

describe('frontmatter authoring (#254)', () => {
  const raw = [
    '---',
    'title: My First Post',
    'date: 2007-03-15',
    'excerpt: "A hello, world."',
    'folder: Posts',
    'tags: [xp, blog]',
    '---',
    '# Body heading',
    '',
    'Real content here.',
  ].join('\n');

  it('parseFrontmatter splits data from body and parses scalars + inline lists', () => {
    const { data, body } = parseFrontmatter(raw);
    expect(data.title).toBe('My First Post');
    expect(data.date).toBe('2007-03-15');
    expect(data.excerpt).toBe('A hello, world.'); // quotes stripped
    expect(data.tags).toEqual(['xp', 'blog']);
    expect(body.startsWith('# Body heading')).toBe(true);
    expect(body).not.toContain('---');
  });

  it('parseFrontmatter parses block lists and returns raw body when absent', () => {
    const block = ['---', 'tags:', '  - a', '  - b', '---', 'x'].join('\n');
    expect(parseFrontmatter(block).data.tags).toEqual(['a', 'b']);
    expect(parseFrontmatter('no frontmatter here')).toEqual({
      data: {},
      body: 'no frontmatter here',
    });
  });

  it('postFromMarkdown builds a BlogPost, keeping frontmatter in source', () => {
    const post = postFromMarkdown(raw, { slug: 'first' });
    expect(post).toMatchObject({
      slug: 'first',
      title: 'My First Post',
      date: '2007-03-15',
      excerpt: 'A hello, world.',
      folder: 'Posts',
      tags: ['xp', 'blog'],
    });
    expect(post.source).toBe(raw); // frontmatter preserved for the viewer header
  });

  it('postFromMarkdown requires a slug', () => {
    expect(() => postFromMarkdown('# no slug', {})).toThrow(/slug/);
  });

  it('a frontmatter post round-trips through the pipeline without leaking ---', () => {
    const post = postFromMarkdown(raw, { slug: 'first' });
    const mirror = buildPostMirrorHtml(post, site);
    expect(mirror).not.toContain('---'); // raw fallback body is frontmatter-stripped
    expect(mirror).toContain('# Body heading');
  });
});

describe('buildSitemap (#254)', () => {
  it('emits a sitemaps.org urlset with the root, per-post loc and lastmod', () => {
    const xml = buildSitemap(manifest, site);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://example.com/</loc>'); // site root
    expect(xml).toContain('<loc>https://example.com/?open=hello.md&amp;lang=en</loc>');
    expect(xml).toContain('<lastmod>Mon, 01 Jan 2007 00:00:00 GMT</lastmod>');
    // manifest[1] has no date → no lastmod for it
    expect(xml).toContain('<loc>https://example.com/?open=posts/nested.md&amp;lang=en</loc>');
  });
});

describe('markdown images + frontmatter (#254)', () => {
  it('renders ![alt](url) as an <img>, not a literal "!" plus link', () => {
    render(<div>{renderMarkdown('![a cat](https://x.dev/cat.png)')}</div>);
    const img = screen.getByRole('img', { name: 'a cat' });
    expect(img).toHaveAttribute('src', 'https://x.dev/cat.png');
  });

  it('renderMarkdown strips a leading frontmatter block', () => {
    render(<div>{renderMarkdown('---\ntitle: T\n---\n# Real')}</div>);
    expect(screen.getByRole('heading', { level: 1, name: 'Real' })).toBeInTheDocument();
    expect(screen.queryByText('---')).not.toBeInTheDocument();
  });

  it('MarkdownViewer renders a title/date header from frontmatter', () => {
    render(
      <MarkdownViewer
        content={'---\ntitle: Hello Post\ndate: 2007-03-15\n---\n\nBody.'}
        fileName="hello.md"
      />
    );
    const header = screen.getByTestId('markdown-post-header');
    expect(header).toHaveTextContent('Hello Post');
    expect(header).toHaveTextContent('2007-03-15');
    expect(screen.getByRole('heading', { level: 1, name: 'Hello Post' })).toBeInTheDocument();
  });

  it('MarkdownViewer renders no header for plain Markdown', () => {
    render(<MarkdownViewer content={'## Plain\n\nbody'} fileName="p.md" />);
    expect(screen.queryByTestId('markdown-post-header')).not.toBeInTheDocument();
  });
});

describe('MarkdownViewer link target + plugin seam (#254)', () => {
  it('routes link clicks through onLinkClick instead of navigating', () => {
    const clicks: string[] = [];
    render(
      <div>{renderMarkdown('[go](https://x.dev)', { onLinkClick: u => clicks.push(u) })}</div>
    );
    const link = screen.getByRole('link', { name: 'go' });
    expect(link).not.toHaveAttribute('target'); // not a plain new-tab anchor
    fireEvent.click(link);
    expect(clicks).toEqual(['https://x.dev']);
  });

  it('falls back to a safe new-tab anchor without onLinkClick', () => {
    render(<div>{renderMarkdown('[go](https://x.dev)')}</div>);
    const link = screen.getByRole('link', { name: 'go' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('honors custom component overrides (the mermaid-style plugin seam)', () => {
    render(
      <div>
        {renderMarkdown('```mermaid\ngraph TD; A-->B\n```', {
          components: {
            code: ({ children }) => <div data-testid="custom-code">{children}</div>,
          },
        })}
      </div>
    );
    expect(screen.getByTestId('custom-code')).toHaveTextContent('graph TD; A-->B');
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
