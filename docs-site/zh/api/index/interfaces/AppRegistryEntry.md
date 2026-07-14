---
title: "接口：AppRegistryEntry"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / AppRegistryEntry

# 接口：AppRegistryEntry\&lt;TProps\&gt;

定义于：src/types/index.ts:261

一个已注册的桌面应用程序。

`TProps` 是 `restore(props)` 接收的类型。**重要：**窗口的
`componentProps` 会被持久化到 localStorage，以便页面刷新后重建窗口，
因此 restore 的 props 必须是 JSON 可序列化的（参见
[JsonValue](/windows-xp/docs/zh/api/index/type-aliases/JsonValue.md)）——不要传递函数、回调、DOM 节点或类实例，否则刷新后的恢复将失败。
运行时回调应通过事件总线（`onEvent`）或 `AppLifecycle` 路由，而不是通过 props。

建议优先使用 defineApp 工厂函数，而不是手动编写该字面量。

## 类型参数

### TProps

`TProps` = `unknown`

## 属性

### associations?

&gt; `optional` **associations?**: [`AppAssociation`](/windows-xp/docs/zh/api/index/interfaces/AppAssociation.md)\&lt;[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md), `unknown`\&gt;[]

定义于：src/types/index.ts:285

---

### ~~defaultWindowProps?~~

&gt; `optional` **defaultWindowProps?**: `Record`\&lt;`string`, `unknown`\&gt;

定义于：src/types/index.ts:283

#### 已弃用

请改用 [AppRegistryEntry.window](/windows-xp/docs/zh/api/index/interfaces/AppRegistryEntry.md#window) ——这个重复的形态将被移除。

---

### icon

&gt; **icon**: `string`

定义于：src/types/index.ts:266

---

### id

&gt; **id**: `string`

定义于：src/types/index.ts:262

---

### lifecycle?

&gt; `optional` **lifecycle?**: [`AppLifecycle`](/windows-xp/docs/zh/api/index/interfaces/AppLifecycle.md)

定义于：src/types/index.ts:284

---

### locales?

&gt; `optional` **locales?**: `string`[]

定义于：src/types/index.ts:268

限制为文化 ID（例如 `['zh']`）；如果是所有文化共享的应用，则省略。

---

### name

&gt; **name**: `string`

定义于：src/types/index.ts:263

---

### nameKey?

&gt; `optional` **nameKey?**: `string`

定义于：src/types/index.ts:265

窗口标题的 i18n 键；省略或未翻译时回退到 `name`。

---

### restore

&gt; **restore**: (`props`) =&gt; `ReactNode`

定义于：src/types/index.ts:286

#### 参数

##### props

`TProps`

#### 返回值

`ReactNode`

---

### window?

&gt; `optional` **window?**: `object`

定义于：src/types/index.ts:270

窗口大小、位置和行为。

#### height?

&gt; `optional` **height?**: `number`

#### isMaximized?

&gt; `optional` **isMaximized?**: `boolean`

#### left?

&gt; `optional` **left?**: `number`

初始位置；省略则居中。适用于会改变高度的窗口。

#### minHeight?

&gt; `optional` **minHeight?**: `number`

#### minWidth?

&gt; `optional` **minWidth?**: `number`

#### resizable?

&gt; `optional` **resizable?**: `boolean`

#### singleton?

&gt; `optional` **singleton?**: `boolean`

#### top?

&gt; `optional` **top?**: `number`

#### width?

&gt; `optional` **width?**: `number`
