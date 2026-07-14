[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / buildSitemap

# Function: buildSitemap()

&gt; **buildSitemap**(`manifest`, `site`): `string`

Defined in: src/content/blog.ts:243

Build a `sitemap.xml` (sitemaps.org 0.9) from a manifest (#254) — completes
the SEO trio (RSS feed + per-post mirror + sitemap). Emits the site root plus
one `<url>` per post pointing at its desktop permalink, with `<lastmod>` when
the post has a `date` (use an ISO / `YYYY-MM-DD` date for a valid sitemap).

## Parameters

### manifest

[`ContentManifest`](/windows-xp/docs/zh/api/index/type-aliases/ContentManifest.md)

### site

[`SiteMeta`](/windows-xp/docs/zh/api/index/interfaces/SiteMeta.md)

## Returns

`string`
