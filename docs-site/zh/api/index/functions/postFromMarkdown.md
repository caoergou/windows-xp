---
title: "函数：postFromMarkdown()"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / postFromMarkdown

# 函数：postFromMarkdown()

> **postFromMarkdown**(`raw`, `defaults?`): [`BlogPost`](/windows-xp/docs/zh/api/index/interfaces/BlogPost.md)

定义于：src/content/blog.ts:114

从带 frontmatter 的原始 Markdown 构建 [BlogPost](/windows-xp/docs/zh/api/index/interfaces/BlogPost.md)（#254）——最自然的创作入口：先用 `import.meta.glob('./posts/*.md', { as: 'raw' })`，再调用 `postFromMarkdown(src, { slug })`。从 frontmatter 中读取 `title/date/excerpt/folder/icon/tags`（`description` 可作为 excerpt 的别名），并以 `defaults` 作为回退。`source` 保留原始文本（包含 frontmatter），以便 MarkdownViewer 渲染标题/日期头部；RSS/sitemap/mirror 则读取解析后的字段。必须提供 `slug`（可通过 frontmatter 的 `slug:` 或 `defaults.slug`）。

## 参数

### raw

`string`

### defaults?

`Partial`\<`Omit`\<[`BlogPost`](/windows-xp/docs/zh/api/index/interfaces/BlogPost.md), `"source"`\>\> = `{}`

## 返回值

[`BlogPost`](/windows-xp/docs/zh/api/index/interfaces/BlogPost.md)
