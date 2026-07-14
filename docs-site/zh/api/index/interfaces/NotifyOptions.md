---
title: "接口：NotifyOptions"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / NotifyOptions

# 接口：NotifyOptions

定义于：src/context/TrayContext.tsx:23

[TrayContextType.notify](/windows-xp/docs/zh/api/index/interfaces/TrayContextType.md#notify) 的选项（#118）。

## 属性

### anchorId?

&gt; `optional` **anchorId?**: `string`

定义于：src/context/TrayContext.tsx:41

用于锚定气球尾巴的托盘项 ID（已注册图标的 ID，或内置的
`'volume'` / `'network'`）。气球会将其尾巴指向该图标，XP 风格。
省略时，尾巴会自动锚定到 ID 与 `icon` 匹配的托盘图标
（因此 `network` 气球从网络图标发出），如果失败则锚定到通知区域（右侧）。

---

### body?

&gt; `optional` **body?**: `string`

定义于：src/context/TrayContext.tsx:29

标题下方的正文文本。

---

### icon?

&gt; `optional` **icon?**: `string`

定义于：src/context/TrayContext.tsx:25

气球中显示的 XPIcon 键（例如 `'360safe'`、`'network'`）。

---

### onClick?

&gt; `optional` **onClick?**: () =&gt; `void`

定义于：src/context/TrayContext.tsx:33

用户点击气球主体时调用。

#### 返回值

`void`

---

### timeout?

&gt; `optional` **timeout?**: `number`

定义于：src/context/TrayContext.tsx:31

气球自动淡出前保持的毫秒数。`0` 表示常驻。默认 9000。

---

### title

&gt; **title**: `string`

定义于：src/context/TrayContext.tsx:27

加粗的标题行。
