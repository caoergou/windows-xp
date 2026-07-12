/**
 * Blog / content pipeline (#137).
 *
 * Turns a plain content manifest (a list of Markdown posts) into the pieces a
 * desktop blog needs: a filesystem tree the desktop can open, an RSS feed, and
 * crawlable static mirror pages that deep-link back into the desktop (#136).
 * All helpers are pure and dependency-free — the Markdown → HTML rendering for
 * mirrors is the author's build step (see USAGE), not engine magic.
 */
import type { FileNode } from '../types';
import { serializeOpenPath } from '../utils/deepLink';

/** One post in a content manifest. `source` is Markdown text. */
export interface BlogPost {
  /** URL-safe id; becomes the `<slug>.md` filesystem key and the permalink target. */
  slug: string;
  /** Display title (the window/desktop label and mirror `<h1>`/`<title>`). */
  title: string;
  /** ISO date string (RSS `pubDate`, sortable). */
  date?: string;
  /** Markdown source. */
  source: string;
  /** Optional icon id for the file node. */
  icon?: string;
  /** Optional single containing folder key (posts group under it on the desktop). */
  folder?: string;
  /** Optional short summary for RSS / meta description. */
  excerpt?: string;
}

export type ContentManifest = BlogPost[];

/** Site-level metadata for feeds and mirror pages. */
export interface SiteMeta {
  title: string;
  description?: string;
  /** Absolute site origin+path the desktop is served from, e.g. `https://me.dev/`. */
  siteUrl: string;
  /** Optional language passed through to the permalink (`&lang=`). */
  language?: string;
}

const fileNode = (post: BlogPost): FileNode => ({
  type: 'file',
  name: post.title,
  app: 'MarkdownViewer',
  content: post.source,
  icon: post.icon ?? 'file',
});

/** The filesystem key path a post opens at (folder-aware). */
export function postPath(post: BlogPost): string[] {
  const key = `${post.slug}.md`;
  return post.folder ? [post.folder, key] : [key];
}

/**
 * Build a `customFileSystem` fragment from a manifest (#137). Posts become
 * `<slug>.md` file nodes bound to MarkdownViewer; posts sharing a `folder`
 * nest under that folder. Merge the result into `customFileSystem`.
 */
export function buildContentFs(manifest: ContentManifest): Record<string, FileNode> {
  const root: Record<string, FileNode> = {};
  for (const post of manifest) {
    const key = `${post.slug}.md`;
    if (post.folder) {
      const existing = root[post.folder];
      const folder =
        existing && existing.type === 'folder'
          ? existing
          : ({ type: 'folder', name: post.folder, children: {} } as Extract<
              FileNode,
              { type: 'folder' }
            >);
      folder.children[key] = fileNode(post);
      root[post.folder] = folder;
    } else {
      root[key] = fileNode(post);
    }
  }
  return root;
}

/** Absolute permalink that opens a post's window on a fresh load (#136 deep link). */
export function postPermalink(post: BlogPost, site: SiteMeta): string {
  const base = site.siteUrl.replace(/\/+$/, '/');
  const url = base.endsWith('/') ? base : `${base}/`;
  const lang = site.language ? `&lang=${site.language}` : '';
  return `${url}?open=${serializeOpenPath(postPath(post))}${lang}`;
}

const escapeXml = (s: string): string =>
  s.replace(/[<>&'"]/g, c =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;'
  );

/**
 * Build an RSS 2.0 feed string from a manifest (#137). Each item links to the
 * post's desktop permalink so subscribers land on the open window.
 */
export function buildRssFeed(manifest: ContentManifest, site: SiteMeta): string {
  const items = manifest
    .map(post => {
      const link = postPermalink(post, site);
      const desc = post.excerpt ?? '';
      const pubDate = post.date ? `\n      <pubDate>${escapeXml(post.date)}</pubDate>` : '';
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>${pubDate}
      <description>${escapeXml(desc)}</description>
    </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${escapeXml(site.siteUrl)}</link>
    <description>${escapeXml(site.description ?? '')}</description>
${items}
  </channel>
</rss>`;
}

/**
 * Build a crawlable static mirror page for a post (#137, SEO pattern). Pass
 * `bodyHtml` — e.g. `renderToStaticMarkup(renderMarkdown(post.source))` at build
 * time — for rich content; without it the raw Markdown is escaped into a `<pre>`
 * fallback so crawlers still index the text. The page links back to the desktop
 * permalink, so search engines index content while humans get the desktop.
 */
export function buildPostMirrorHtml(post: BlogPost, site: SiteMeta, bodyHtml?: string): string {
  const permalink = postPermalink(post, site);
  const body = bodyHtml ?? `<pre>${escapeXml(post.source)}</pre>`;
  const desc = post.excerpt ?? '';
  const lang = site.language ?? 'en';
  return `<!doctype html>
<html lang="${escapeXml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeXml(post.title)} — ${escapeXml(site.title)}</title>
<meta name="description" content="${escapeXml(desc)}">
<link rel="canonical" href="${escapeXml(permalink)}">
</head>
<body>
<main>
<h1>${escapeXml(post.title)}</h1>
${body}
<p><a href="${escapeXml(permalink)}">Open this post on the desktop →</a></p>
</main>
</body>
</html>`;
}
