[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / Frontmatter

# Interface: Frontmatter

Defined in: src/content/blog.ts:36

Parsed Markdown frontmatter: the leading `--- … ---` block plus the body after it.

## Properties

### body

&gt; **body**: `string`

Defined in: src/content/blog.ts:40

The Markdown body with the frontmatter block removed.

---

### data

&gt; **data**: `Record`\&lt;`string`, `string` \| `string`[]\&gt;

Defined in: src/content/blog.ts:38

Key → scalar or list value. Keys are lower-cased; scalars are unquoted.
