---
title: "接口：CulturePackage"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / CulturePackage

# 接口：CulturePackage

定义于：src/data/culture/types.ts:90

一个文化包——桌面的时代/地区/语言内容：快捷方式、
开始菜单、主页、便签、壁纸、i18n 资源等。

建议优先使用 [defineCulture](/windows-xp/docs/zh/api/index/functions/defineCulture.md) 工厂函数，它会在编写时验证包（应用 ID 引用、
区域设置一致性、缺失的 i18n 键）。

## 属性

### browser?

&gt; `optional` **browser?**: [`BrowserCultureProfile`](/windows-xp/docs/zh/api/index/interfaces/BrowserCultureProfile.md)

定义于：src/data/culture/types.ts:106

默认浏览器主页。

---

### desktopShortcuts?

&gt; `optional` **desktopShortcuts?**: [`DesktopShortcut`](/windows-xp/docs/zh/api/index/interfaces/DesktopShortcut.md)[]

定义于：src/data/culture/types.ts:102

桌面快捷方式。

---

### displayName

&gt; **displayName**: `string`

定义于：src/data/culture/types.ts:94

供文化选择器显示的人类可读名称。

---

### hourlyChime?

&gt; `optional` **hourlyChime?**: `boolean`

定义于：src/data/culture/types.ts:116

在 `time:hour` 播放整点报时（默认关闭，#130）。

---

### i18n?

&gt; `optional` **i18n?**: `Record`\&lt;`string`, `Record`\&lt;`string`, `string`\&gt;\&gt;

定义于：src/data/culture/types.ts:100

额外的 i18n 资源，合并到 windows-xp 命名空间（`{ lang: { key: value } }`）。

---

### id

&gt; **id**: `string`

定义于：src/data/culture/types.ts:92

唯一 ID，例如 `'en'`、`'zh'`、`'jp-retro'`。

---

### locales

&gt; **locales**: `string`[]

定义于：src/data/culture/types.ts:96

该包激活的语言代码，例如 `['ja', 'ja-JP']`。

---

### qq?

&gt; `optional` **qq?**: `QQProfile`

定义于：src/data/culture/types.ts:112

QQ Messenger 个人资料——好友/群组/脚本消息（#119），由 QQ 应用读取。

---

### requiredApps?

&gt; `optional` **requiredApps?**: `string`[]

定义于：src/data/culture/types.ts:98

该包需要注册的应用 ID；用于启动检查。

---

### startMenu?

&gt; `optional` **startMenu?**: [`StartMenuProfile`](/windows-xp/docs/zh/api/index/interfaces/StartMenuProfile.md)

定义于：src/data/culture/types.ts:104

开始菜单中固定/最近的应用。

---

### startupNotification?

&gt; `optional` **startupNotification?**: [`StartupNotification`](/windows-xp/docs/zh/api/index/interfaces/StartupNotification.md)

定义于：src/data/culture/types.ts:110

登录后显示的托盘气泡（#118）。

---

### stickyNote?

&gt; `optional` **stickyNote?**: [`StickyNoteContent`](/windows-xp/docs/zh/api/index/interfaces/StickyNoteContent.md)

定义于：src/data/culture/types.ts:108

桌面便签。

---

### wallpaper?

&gt; `optional` **wallpaper?**: `string`

定义于：src/data/culture/types.ts:114

默认壁纸 URL。
