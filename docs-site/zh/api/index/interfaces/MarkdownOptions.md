---
title: "接口：MarkdownOptions"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / MarkdownOptions

# 接口：MarkdownOptions

定义于：src/apps/MarkdownViewer/config.tsx:8

面向作者的 MarkdownViewer 配置（#254），作为 `WindowsXP` 的 `markdown` prop
传入，并通过上下文供每个 `.md` 窗口使用。

## 属性

### components?

&gt; `optional` **components?**: `Components` \| `null`

定义于：src/apps/MarkdownViewer/config.tsx:20

额外的 `react-markdown` 组件覆盖，合并到默认配置之上——
用于核心故意不内置功能的插件接缝（例如可绘制 mermaid 图表的 `code`
渲染器）。详见内容指南。

---

### linkTarget?

&gt; `optional` **linkTarget?**: `"ie"` \| `"external"`

定义于：src/apps/MarkdownViewer/config.tsx:14

Markdown 文档中的链接点击后打开位置：

- `'ie'` —— 桌面自带的 Internet Explorer 窗口（保持剧情内）；
- `'external'` —— 真实浏览器标签页（默认）。

---

### remarkPlugins?

&gt; `optional` **remarkPlugins?**: `PluggableList` \| `null`

定义于：src/apps/MarkdownViewer/config.tsx:22

额外的 remark 插件，追加到内置 `remark-gfm` 之后。
