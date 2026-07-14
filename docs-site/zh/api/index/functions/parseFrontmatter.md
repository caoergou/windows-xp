[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / parseFrontmatter

# Function: parseFrontmatter()

&gt; **parseFrontmatter**(`raw`): [`Frontmatter`](/windows-xp/docs/zh/api/index/interfaces/Frontmatter.md)

Defined in: src/content/blog.ts:59

Parse a Markdown string's leading frontmatter (#254). Supports `key: value`
scalars, inline lists (`tags: [a, b]`) and block lists (`- a` on following
lines); keys are lower-cased and scalar values unquoted. No frontmatter →
`{ data: {}, body: raw }`. Deliberately tiny (no YAML dependency) — it covers
what a blog post's header needs, not the whole YAML spec.

## Parameters

### raw

`string`

## Returns

[`Frontmatter`](/windows-xp/docs/zh/api/index/interfaces/Frontmatter.md)
