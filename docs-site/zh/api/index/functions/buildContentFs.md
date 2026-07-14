---
title: "函数：buildContentFs()"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / buildContentFs

# 函数：buildContentFs()

> **buildContentFs**(`manifest`): `Record`\<`string`, [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)\>

定义于：src/content/blog.ts:173

从清单构建 `customFileSystem` 片段（#137）。文章会转换为绑定到 MarkdownViewer 的 `<slug>.md` 文件节点；共享同一 `folder` 的文章会嵌套在该文件夹下。将结果合并到 `customFileSystem` 中。

## 参数

### manifest

[`ContentManifest`](/windows-xp/docs/zh/api/index/type-aliases/ContentManifest.md)

## 返回值

`Record`\<`string`, [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)\>
