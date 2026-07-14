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
  /** Optional tags (from frontmatter `tags:`); passed through to authors' own UIs. */
  tags?: string[];
}

export type ContentManifest = BlogPost[];

/** Parsed Markdown frontmatter: the leading `--- … ---` block plus the body after it. */
export interface Frontmatter {
  /** Key → scalar or list value. Keys are lower-cased; scalars are unquoted. */
  data: Record<string, string | string[]>;
  /** The Markdown body with the frontmatter block removed. */
  body: string;
}

// Matches a leading YAML-ish frontmatter block: `---` on its own line, content,
// then a closing `---`. Tolerates a UTF-8 BOM and CRLF line endings.
const FRONTMATTER_RE = /^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

const unquote = (s: string): string =>
  (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))
    ? s.slice(1, -1)
    : s;

/**
 * Parse a Markdown string's leading frontmatter (#254). Supports `key: value`
 * scalars, inline lists (`tags: [a, b]`) and block lists (`- a` on following
 * lines); keys are lower-cased and scalar values unquoted. No frontmatter →
 * `{ data: {}, body: raw }`. Deliberately tiny (no YAML dependency) — it covers
 * what a blog post's header needs, not the whole YAML spec.
 */
export function parseFrontmatter(raw: string): Frontmatter {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string | string[]> = {};
  const lines = match[1].split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const kv = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(lines[i]);
    if (!kv) {
      i++;
      continue;
    }
    const key = kv[1].toLowerCase();
    const value = kv[2].trim();

    // Block list: an empty value followed by `- item` lines.
    if (value === '' && i + 1 < lines.length && /^[ \t]*-[ \t]+/.test(lines[i + 1])) {
      const arr: string[] = [];
      i++;
      while (i < lines.length && /^[ \t]*-[ \t]+/.test(lines[i])) {
        arr.push(unquote(lines[i].replace(/^[ \t]*-[ \t]+/, '').trim()));
        i++;
      }
      data[key] = arr;
      continue;
    }

    // Inline list: `[a, b, c]`.
    if (/^\[.*\]$/.test(value)) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map(s => unquote(s.trim()))
        .filter(Boolean);
      i++;
      continue;
    }

    data[key] = unquote(value);
    i++;
  }

  return { data, body: raw.slice(match[0].length) };
}

/**
 * Build a {@link BlogPost} from raw Markdown with frontmatter (#254) — the
 * natural authoring on-ramp: `import.meta.glob('./posts/*.md', { as: 'raw' })`
 * then `postFromMarkdown(src, { slug })`. Reads `title/date/excerpt/folder/icon/
 * tags` (and `description` as an excerpt alias) from the frontmatter, falling
 * back to `defaults`. `source` keeps the original text (frontmatter included) so
 * MarkdownViewer can render the title/date header; RSS/sitemap/mirror read the
 * parsed fields. A `slug` is required (frontmatter `slug:` or `defaults.slug`).
 */
export function postFromMarkdown(
  raw: string,
  defaults: Partial<Omit<BlogPost, 'source'>> = {}
): BlogPost {
  const { data } = parseFrontmatter(raw);
  const scalar = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v.join(', ') : v;

  const slug = scalar(data.slug) ?? defaults.slug;
  if (!slug) {
    throw new Error('postFromMarkdown: a slug is required (frontmatter `slug:` or defaults.slug)');
  }
  const tags = Array.isArray(data.tags)
    ? data.tags
    : typeof data.tags === 'string'
      ? [data.tags]
      : defaults.tags;

  return {
    slug,
    title: scalar(data.title) ?? defaults.title ?? slug,
    date: scalar(data.date) ?? defaults.date,
    excerpt: scalar(data.excerpt) ?? scalar(data.description) ?? defaults.excerpt,
    folder: scalar(data.folder) ?? defaults.folder,
    icon: scalar(data.icon) ?? defaults.icon,
    ...(tags ? { tags } : {}),
    source: raw,
  };
}

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
 * Build a `sitemap.xml` (sitemaps.org 0.9) from a manifest (#254) — completes
 * the SEO trio (RSS feed + per-post mirror + sitemap). Emits the site root plus
 * one `<url>` per post pointing at its desktop permalink, with `<lastmod>` when
 * the post has a `date` (use an ISO / `YYYY-MM-DD` date for a valid sitemap).
 */
export function buildSitemap(manifest: ContentManifest, site: SiteMeta): string {
  const base = site.siteUrl.replace(/\/+$/, '/');
  const root = base.endsWith('/') ? base : `${base}/`;
  const urls = [
    `  <url>\n    <loc>${escapeXml(root)}</loc>\n  </url>`,
    ...manifest.map(post => {
      const loc = postPermalink(post, site);
      const lastmod = post.date ? `\n    <lastmod>${escapeXml(post.date)}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod}\n  </url>`;
    }),
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
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
  // Strip any frontmatter from the raw fallback so the `---` block isn't indexed.
  const body = bodyHtml ?? `<pre>${escapeXml(parseFrontmatter(post.source).body)}</pre>`;
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
