---
title: "接口：WindowsXPProps"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / WindowsXPProps

# 接口：WindowsXPProps

定义于：src/lib/index.tsx:18

## 属性

### apps?

> `optional` **apps?**: [`AppRegistryEntry`](/windows-xp/docs/zh/api/index/interfaces/AppRegistryEntry.md)&lt;`unknown`&gt;[]

定义于：src/lib/index.tsx:52

自定义应用，用于扩展或覆盖内置的 APP_REGISTRY。

---

### autoLogin?

> `optional` **autoLogin?**: `boolean`

定义于：src/lib/index.tsx:56

自动登录用户，不显示登录屏幕。

---

### avatar?

> `optional` **avatar?**: `string`

定义于：src/lib/index.tsx:44

登录/用户头像：一个 XPIcon id（例如 `'user'`）或图片 URL（#77）。

---

### boot?

> `optional` **boot?**: [`BootBranding`](/windows-xp/docs/zh/api/index/interfaces/BootBranding.md)

定义于：src/lib/index.tsx:138

开机画面品牌定制（#139）：`logo`、`text`、`progressColor`、`startupSound`。
可选配置；默认渲染像素级忠实的 XP。设置任意字段都会隐藏开机画面上的 Microsoft 商标。

---

### cultures?

> `optional` **cultures?**: [`CulturePackage`](/windows-xp/docs/zh/api/index/interfaces/CulturePackage.md)[]

定义于：src/lib/index.tsx:50

自定义文化包，用于扩展或覆盖内置的 en/zh 文化。

---

### customFileSystem?

> `optional` **customFileSystem?**: `Record`&lt;`string`, [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)&gt;

定义于：src/lib/index.tsx:35

自定义文件系统结构，会根据 `fileSystemMode` 与默认值合并。
在挂载时应用；后续对此 prop 的更改不会被重新读取（树在加载后由持久化层持有）。
如需全新的树，请使用不同的 `storagePrefix` 重新挂载。

---

### defaultWallpaper?

> `optional` **defaultWallpaper?**: `string`

定义于：src/lib/index.tsx:48

初始壁纸——壁纸 id 或直接图片 URL——在用户自行选择前使用（#77）。

---

### devtools?

> `optional` **devtools?**: `boolean`

定义于：src/lib/index.tsx:165

挂载场景/事件 DevTools 覆盖层（#209）：一个开发时面板，可查看实时事件流、当前
`flags` 以及每个 `trigger` 的命中/未命中，并展示某个 `trigger` 为什么没有触发（其 `when`
谓词树会标注 ✓/✗）。默认关闭；生产环境请勿开启。详见 `docs/SCENARIOS.md`。

---

### disableContextMenuBlock?

> `optional` **disableContextMenuBlock?**: `boolean`

定义于：src/lib/index.tsx:95

禁用全局右键菜单拦截。

---

### disableDevToolsBlock?

> `optional` **disableDevToolsBlock?**: `boolean`

定义于：src/lib/index.tsx:97

禁用对 F12 / Ctrl+Shift+I/J/C / Ctrl+U 的拦截。

---

### disableGlobalShortcuts?

> `optional` **disableGlobalShortcuts?**: `boolean`

定义于：src/lib/index.tsx:99

禁用 Alt+F4、Alt+Tab 以及蓝屏彩蛋（BSOD easter egg）等全局快捷键。

---

### disableScreenSaver?

> `optional` **disableScreenSaver?**: `boolean`

定义于：src/lib/index.tsx:107

禁用空闲屏保。

---

### fileSystemMode?

> `optional` **fileSystemMode?**: `"merge"` \| `"replace"`

定义于：src/lib/index.tsx:42

`customFileSystem` 如何与内置文件系统合并（#77）。`'merge'`
（默认）将你的内容层叠到内置桌面之上；`'replace'` 仅保留 OS 脚手架（回收站和一个空的我的电脑），
因此你的内容就是整个桌面——没有内置的 QQ/360/IE 快捷方式。

---

### historyIntegration?

> `optional` **historyIntegration?**: `boolean`

定义于：src/lib/index.tsx:132

在顶层窗口打开/关闭时 push/pop 浏览器历史记录，从而让“返回”关闭内容站点上最后打开的窗口（#136）。
默认关闭——游戏/嵌入场景可跳过。

---

### hourlyChime?

> `optional` **hourlyChime?**: `boolean`

定义于：src/lib/index.tsx:112

在 `'time:hour'` 事件触发时播放经典整点报时。
默认关闭；文化包也可通过 `'hourlyChime'` 启用（#130）。

---

### idleThresholdMs?

> `optional` **idleThresholdMs?**: `number`

定义于：src/lib/index.tsx:114

触发 `user:idle` 前的无操作阈值，单位为毫秒（默认 60000，#130）。

---

### keymap?

> `optional` **keymap?**: `Record`&lt;`string`, `string` \| `null`&gt;

定义于：src/lib/index.tsx:105

按 id 重新映射或禁用单个快捷键（#132）：例如 `{ 'window.close': 'Mod+Shift+W' }`
或 `{ 'startMenu.toggle': null }` 以禁用。id 列表见 `docs/KEYMAP.md`。
让嵌入宿主无需 fork 即可回收按键。

---

### language?

> `optional` **language?**: `string`

定义于：src/lib/index.tsx:28

初始语言。`'en'` 和 `'zh'` 为内置；其他代码（例如 `'ja'`）需要提供匹配 `i18n`
资源的文化包——缺失的键会回退到英语。

---

### lessons?

> `optional` **lessons?**: [`Lesson`](/windows-xp/docs/zh/api/index/interfaces/Lesson.md)[]

定义于：src/lib/index.tsx:158

引导式课程（#141）：数据驱动的 Watch/Try/Do 教程。在此注册后，通过
`startLesson(id, mode)` ref 句柄启动。步骤在真实、经过事件验证的操作后推进；
`lesson:*` 事件会报告进度。详见 `docs/LESSONS.md`。

---

### location?

> `optional` **location?**: `string`

定义于：src/lib/index.tsx:127

宿主当前的位置（path[+search]），用于 `routes` 匹配（#136）。

---

### login?

> `optional` **login?**: [`LoginBranding`](/windows-xp/docs/zh/api/index/interfaces/LoginBranding.md)

定义于：src/lib/index.tsx:144

登录界面品牌定制（#139）：`background`、`title`、`userTile`、`userName`
（后两者扩展了 `avatar`/`username`）。可选；设置任意字段会隐藏
“Microsoft Windows XP” 字样。

---

### markdown?

> `optional` **markdown?**: [`MarkdownOptions`](/windows-xp/docs/zh/api/index/interfaces/MarkdownOptions.md)

定义于：src/lib/index.tsx:73

`MarkdownViewer` 对 `.md` 内容的处理行为（#254）。`linkTarget` 决定文档链接的打开位置——
`'ie'`（桌面上的 Internet Explorer）或 `'external'`（真实浏览器标签页，默认）。
`components` / `remarkPlugins` 是核心未内置的扩展插件接缝（例如 mermaid `code`
渲染器）。详见“在桌面上搭建博客”指南。

---

### mode?

> `optional` **mode?**: `"fullscreen"` \| `"embedded"`

定义于：src/lib/index.tsx:81

集成模式。`'fullscreen'`（默认）保持经典的 kiosk 行为。`'embedded'`
让组件在宿主应用中表现为礼貌的访客：默认禁用右键拦截、devtools 拦截、全局快捷键
（Alt+F4 / Alt+Tab / BSOD）以及空闲屏保。各个 `disable*` prop 仍可覆盖这些默认值。

---

### onEvent?

> `optional` **onEvent?**: [`XPEventListener`](/windows-xp/docs/zh/api/index/type-aliases/XPEventListener.md)

定义于：src/lib/index.tsx:167

订阅桌面事件（应用启动、文件打开、会话、`cmd`……）。

---

### openOnLoad?

> `optional` **openOnLoad?**: `string` \| `string`[]

定义于：src/lib/index.tsx:120

深度链接（#136）：桌面可交互后（在 `skipBoot`/`autoLogin` 之后）打开的关键路径，
即 `'?open='` 的值，例如 `'我的文档/readme.txt'`。无效路径会静默失败，回到普通桌面。

---

### password?

> `optional` **password?**: `string`

定义于：src/lib/index.tsx:22

默认登录密码。

---

### persistence?

> `optional` **persistence?**: [`PersistenceMode`](/windows-xp/docs/zh/api/index/type-aliases/PersistenceMode.md)

定义于：src/lib/index.tsx:65

持久化后端（#138）。`'local'`（默认）在多次访问间保留（localStorage + IndexedDB）；
`'session'` 为标签页级别（sessionStorage，关闭标签后内容丢失）；`'none'` 为纯内存——
每次挂载都是全新状态（适用于营销活动页、博客、教学沙箱），且不会打开 IndexedDB。

---

### routes?

> `optional` **routes?**: [`DeepLinkRoutes`](/windows-xp/docs/zh/api/index/type-aliases/DeepLinkRoutes.md)

定义于：src/lib/index.tsx:125

美化 URL 路由（`{ '/blog/:slug': ({ slug }) => ({ open: `D:/posts/${slug}.md` }) }`），
根据 `location` 匹配（#136）。与宿主路由无关——不依赖任何路由库。

---

### scenario?

> `optional` **scenario?**: [`Scenario`](/windows-xp/docs/zh/api/index/interfaces/Scenario.md)

定义于：src/lib/index.tsx:151

声明式场景/故事脚本（#84）：以普通 JSON 编写的 `flags`、`triggers` 和 gated actions。
运行时订阅事件流并驱动关卡（门与钥匙）、推送（QQ/托盘/文件事件）和进度——无需 React。
详见 `docs/SCENARIOS.md`。

---

### skipBoot?

> `optional` **skipBoot?**: `boolean`

定义于：src/lib/index.tsx:54

首次加载时跳过开机动画。

---

### storagePrefix?

> `optional` **storagePrefix?**: `string`

定义于：src/lib/index.tsx:58

localStorage / IndexedDB 键的命名空间前缀（默认：`'xp_'`）。

---

### username?

> `optional` **username?**: `string`

定义于：src/lib/index.tsx:20

登录屏幕的默认用户名。

---

### viewportPolicy?

> `optional` **viewportPolicy?**: `"auto"` \| `"scale"` \| `"native"` \| `"warn"`

定义于：src/lib/index.tsx:93

小屏/竖屏策略（#215）。在 `'fullscreen'` 模式下默认为 `'auto'`，
在 `'embedded'` 模式下默认为 `'native'`（嵌入桌面的尺寸由宿主控制，因此不会自动缩放）。
`'auto'` 在任何至少达到 1024×768 基准宽度的容器上保持像素级一致的原始布局，
更窄时则将整个桌面按比例适配（加黑边）——因此手机也能得到一个真实、可操作的桌面，
而不是仅显示警告。`'scale'` 始终将基准适配到容器；`'native'` 永不缩放
（#215 之前的固定布局）；`'warn'` 永不缩放并显示移动端提示。
详见 `docs/VIEWPORT.md`。

---

### wallpapers?

> `optional` **wallpapers?**: [`WallpaperItem`](/windows-xp/docs/zh/api/index/interfaces/WallpaperItem.md)[]

定义于：src/lib/index.tsx:46

合并到内置壁纸列表之上的额外壁纸，供壁纸选择器和分辨率使用（#77）。
