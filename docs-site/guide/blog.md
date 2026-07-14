---
title: Build a blog on the desktop
---

# Build a blog on the desktop

The desktop makes a natural portfolio/blog shell: keep posts in Markdown, turn
them into openable windows with one helper, and mirror them as static pages so
search engines can still find your writing (#137, #254). Everything below is
data + a few pure helpers — no engine internals.

## 1. Author in Markdown, load with `buildContentFs`

A _content manifest_ is a plain list of posts; `buildContentFs` turns it into a
`customFileSystem` fragment where each post is a `<slug>.md` file that opens in
the built-in **MarkdownViewer** (Notepad stays the plain-text editor). Posts
sharing a `folder` nest under it. The viewer renders with
[`react-markdown`](https://github.com/remarkjs/react-markdown) + `remark-gfm`,
so CommonMark plus GitHub extensions — tables, task lists, strikethrough,
autolinks, images — all work, and untrusted post content can't inject HTML.

The easiest on-ramp is to glob a folder of `.md` files and let
`postFromMarkdown` read each post's YAML **frontmatter** (`title`, `date`,
`excerpt`, `folder`, `tags`):

```jsx
import { WindowsXP, buildContentFs, postFromMarkdown } from '@caoergou/windows-xp';

// Vite: raw-import every post, then parse its frontmatter into a manifest.
const files = import.meta.glob('./posts/*.md', { query: '?raw', import: 'default', eager: true });
const manifest = Object.entries(files).map(([path, source]) =>
  postFromMarkdown(source, { slug: path.split('/').pop().replace(/\.md$/, '') })
);

export default () => <WindowsXP customFileSystem={buildContentFs(manifest)} />;
```

A post file then looks like:

```md
---
title: Hello, World
date: 2007-01-01
folder: Posts
tags: [xp, blog]
---

# Hi

My first post.
```

The viewer renders the frontmatter `title`/`date` as an article header; you can
also build the manifest by hand (`{ slug, title, date, source, folder }`) if you
prefer keeping metadata in code.

## 2. Control where links open

By default a link in a post opens a real browser tab. Set the `markdown` prop's
`linkTarget` to `'ie'` to open links inside the desktop's own Internet Explorer
window instead — keeping readers in the fiction:

```jsx
<WindowsXP customFileSystem={buildContentFs(manifest)} markdown={{ linkTarget: 'ie' }} />
```

## 3. Extend the renderer (e.g. mermaid)

The core deliberately ships no diagramming dependency, but
`markdown.components` / `markdown.remarkPlugins` are a passthrough to
`react-markdown`, so you can opt into extras like mermaid by supplying a `code`
renderer:

```jsx
<WindowsXP
  customFileSystem={buildContentFs(manifest)}
  markdown={{
    components: {
      code: ({ className, children }) =>
        className === 'language-mermaid'
          ? <Mermaid chart={String(children)} />   // your own component
          : <code className={className}>{children}</code>,
    },
  }}
/>
```

## 4. Permalinks come for free

Because posts are real filesystem nodes, the deep-linking API addresses them:
`postPermalink(post, siteMeta)` returns a `?open=…` URL that opens the post's
window, and `WindowsXP`'s `openOnLoad` consumes it. A share button or QR code
just points at that URL.

## 5. Be findable — the SEO trio

Crawlers don't run your desktop, so emit a static HTML page per post plus a feed
and a sitemap. Render the body at build time and hand it to
`buildPostMirrorHtml`; `buildRssFeed` and `buildSitemap` turn the same manifest
into `rss.xml` and `sitemap.xml`:

```jsx
import { renderToStaticMarkup } from 'react-dom/server';
import { buildPostMirrorHtml, buildRssFeed, buildSitemap } from '@caoergou/windows-xp';
import { MarkdownViewer } from '@caoergou/windows-xp/apps';

const site = { title: 'My XP Blog', siteUrl: 'https://me.dev/', language: 'en' };

// One crawlable page per post (write these to /blog/<slug>.html at build time):
for (const post of manifest) {
  // Reuse the in-desktop renderer for byte-identical output, or any md→HTML lib:
  const bodyHtml = renderToStaticMarkup(<MarkdownViewer content={post.source} />);
  const page = buildPostMirrorHtml(post, site, bodyHtml);
  // fs.writeFileSync(`dist/blog/${post.slug}.html`, page)
}

const rss = buildRssFeed(manifest, { ...site, description: 'Posts from a Windows XP desktop' });
const sitemap = buildSitemap(manifest, site);
```

Wire it up per framework: on **Next.js**, generate the mirror pages as static
routes (`generateStaticParams`) and serve `rss.xml` / `sitemap.xml` from route
handlers; on **plain Vite**, write the pages and feeds in a small post-build
script. Either way humans get the desktop and crawlers get indexable HTML that
deep-links back.
