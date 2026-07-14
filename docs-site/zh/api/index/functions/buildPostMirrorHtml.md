[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / buildPostMirrorHtml

# Function: buildPostMirrorHtml()

&gt; **buildPostMirrorHtml**(`post`, `site`, `bodyHtml?`): `string`

Defined in: src/content/blog.ts:267

Build a crawlable static mirror page for a post (#137, SEO pattern). Pass
`bodyHtml` — e.g. `renderToStaticMarkup(renderMarkdown(post.source))` at build
time — for rich content; without it the raw Markdown is escaped into a `<pre>`
fallback so crawlers still index the text. The page links back to the desktop
permalink, so search engines index content while humans get the desktop.

## Parameters

### post

[`BlogPost`](/windows-xp/docs/zh/api/index/interfaces/BlogPost.md)

### site

[`SiteMeta`](/windows-xp/docs/zh/api/index/interfaces/SiteMeta.md)

### bodyHtml?

`string`

## Returns

`string`
