[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / BlogPost

# Interface: BlogPost

Defined in: src/content/blog.ts:14

One post in a content manifest. `source` is Markdown text.

## Properties

### date?

&gt; `optional` **date?**: `string`

Defined in: src/content/blog.ts:20

ISO date string (RSS `pubDate`, sortable).

---

### excerpt?

&gt; `optional` **excerpt?**: `string`

Defined in: src/content/blog.ts:28

Optional short summary for RSS / meta description.

---

### folder?

&gt; `optional` **folder?**: `string`

Defined in: src/content/blog.ts:26

Optional single containing folder key (posts group under it on the desktop).

---

### icon?

&gt; `optional` **icon?**: `string`

Defined in: src/content/blog.ts:24

Optional icon id for the file node.

---

### slug

&gt; **slug**: `string`

Defined in: src/content/blog.ts:16

URL-safe id; becomes the `<slug>.md` filesystem key and the permalink target.

---

### source

&gt; **source**: `string`

Defined in: src/content/blog.ts:22

Markdown source.

---

### tags?

&gt; `optional` **tags?**: `string`[]

Defined in: src/content/blog.ts:30

Optional tags (from frontmatter `tags:`); passed through to authors' own UIs.

---

### title

&gt; **title**: `string`

Defined in: src/content/blog.ts:18

Display title (the window/desktop label and mirror `<h1>`/`<title>`).
