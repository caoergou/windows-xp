---
title: "接口：XPFsApi"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / XPFsApi

# 接口：XPFsApi

定义于：src/components/XPBridge.tsx:30

从桌面外部驱动文件系统（#115）。路径为绝对路径。

## 属性

### createFile

> **createFile**: (`path`, `node?`) =&gt; `void`

定义于：src/components/XPBridge.tsx:36

在指定路径创建文件/文件夹。`node.type` 默认为 `'file'`。

#### 参数

##### path

`string`[]

##### node?

`Partial`&lt;[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)&gt;

#### 返回值

`void`

---

### deleteFile

> **deleteFile**: (`path`) =&gt; `void`

定义于：src/components/XPBridge.tsx:38

删除指定路径的文件或文件夹。

#### 参数

##### path

`string`[]

#### 返回值

`void`

---

### exists

> **exists**: (`path`) =&gt; `boolean`

定义于：src/components/XPBridge.tsx:42

指定路径是否存在节点。

#### 参数

##### path

`string`[]

#### 返回值

`boolean`

---

### getNode

> **getNode**: (`path`) =&gt; [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md) \| `null`

定义于：src/components/XPBridge.tsx:40

返回指定路径的原始节点，若不存在则返回 null。

#### 参数

##### path

`string`[]

#### 返回值

[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md) \| `null`

---

### readFile

> **readFile**: (`path`) =&gt; `string` \| `null`

定义于：src/components/XPBridge.tsx:32

读取文件节点的文本内容；若缺失或不是文本文件则返回 null。

#### 参数

##### path

`string`[]

#### 返回值

`string` \| `null`

---

### unlockNode

> **unlockNode**: (`path`) =&gt; `void`

定义于：src/components/XPBridge.tsx:44

持久化地清除节点的 `locked` 标志。

#### 参数

##### path

`string`[]

#### 返回值

`void`

---

### writeFile

> **writeFile**: (`path`, `content`) =&gt; `void`

定义于：src/components/XPBridge.tsx:34

设置文件节点的内容（会持久化）。

#### 参数

##### path

`string`[]

##### content

`string`

#### 返回值

`void`
