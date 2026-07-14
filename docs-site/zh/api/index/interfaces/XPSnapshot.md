---
title: "接口：XPSnapshot"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / XPSnapshot

# 接口：XPSnapshot

定义于：src/snapshot.ts:17

## 属性

### flags

&gt; **flags**: `Record`\&lt;`string`, `unknown`\&gt;

定义于：src/snapshot.ts:31

预留给场景系统（#84）：场景标志。

---

### fs

&gt; **fs**: `object`

定义于：src/snapshot.ts:21

完整文件系统树，包含文件内容。

#### root

&gt; **root**: [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)

---

### language

&gt; **language**: `string` \| `null`

定义于：src/snapshot.ts:29

当前语言代码，或 `null`。

---

### openWindows

&gt; **openWindows**: `unknown`[]

定义于：src/snapshot.ts:25

持久化的已打开窗口（存储在 `<prefix>open_windows` 下的 JSON）。

---

### recycleBin

&gt; **recycleBin**: `Record`\&lt;`string`, `RecycleBinItem`\&gt;

定义于：src/snapshot.ts:23

按回收站条目 ID 索引的回收站内容。

---

### version

&gt; **version**: `number`

定义于：src/snapshot.ts:19

快照格式版本。加载较新版本会抛出错误。

---

### wallpaper

&gt; **wallpaper**: `string` \| `null`

定义于：src/snapshot.ts:27

当前壁纸 ID 或 URL，或 `null`。
