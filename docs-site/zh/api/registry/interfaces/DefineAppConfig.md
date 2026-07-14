---
title: "接口：DefineAppConfig"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [registry](/windows-xp/docs/zh/api/registry/index.md) / DefineAppConfig

# 接口：DefineAppConfig\&lt;TProps\&gt;

定义于：src/registry/defineApp.tsx:35

## 类型参数

### TProps

`TProps` _extends_ [`SerializableProps`](/windows-xp/docs/zh/api/registry/type-aliases/SerializableProps.md)

## 属性

### associations?

&gt; `optional` **associations?**: [`AppAssociation`](/windows-xp/docs/zh/api/index/interfaces/AppAssociation.md)\&lt;[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md), `unknown`\&gt;[]

定义于：src/registry/defineApp.tsx:51

使应用可以从 `.app` 等于 `appField` 的文件系统节点打开。

---

### component

&gt; **component**: `ComponentType`\&lt;`TProps` & `object`\&gt;

定义于：src/registry/defineApp.tsx:56

应用组件。它还可能接收到注入的 `windowId`。其自身 props（`TProps`）必须是 JSON 可序列化的（参见 [SerializableProps](/windows-xp/docs/zh/api/registry/type-aliases/SerializableProps.md)）。

---

### icon?

&gt; `optional` **icon?**: `string`

定义于：src/registry/defineApp.tsx:43

`XPIcon` id。默认为 `'app_window'`。

---

### id

&gt; **id**: `string`

定义于：src/registry/defineApp.tsx:37

唯一的应用 id（用于打开应用并匹配文件系统的 `.app` 字段）。

---

### lifecycle?

&gt; `optional` **lifecycle?**: [`AppLifecycle`](/windows-xp/docs/zh/api/index/interfaces/AppLifecycle.md)

定义于：src/registry/defineApp.tsx:49

打开 / 关闭 / 聚焦回调（仅运行时有效——不会被持久化）。

---

### locales?

&gt; `optional` **locales?**: `string`[]

定义于：src/registry/defineApp.tsx:45

限制为特定的文化 id（例如 `['zh']`）；省略表示适用于所有文化。

---

### name

&gt; **name**: `string`

定义于：src/registry/defineApp.tsx:39

后备显示名称；i18n 优先使用 `nameKey`。

---

### nameKey?

&gt; `optional` **nameKey?**: `string`

定义于：src/registry/defineApp.tsx:41

窗口标题的 i18n 键；回退到 `name`。

---

### window?

&gt; `optional` **window?**: [`AppWindowConfig`](/windows-xp/docs/zh/api/registry/interfaces/AppWindowConfig.md)

定义于：src/registry/defineApp.tsx:47

窗口大小 / 行为。默认为 400×300，非单例，可调整大小。
