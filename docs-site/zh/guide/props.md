---
title: Props 参考
---

# Props 参考

下面是 `<WindowsXP>` 的完整 props 参考。如果你刚接触这个组件，建议先阅读
[打造你的专属桌面](/zh/guide/content)，了解文件、应用和文化包的工作方式，
再回来看这份完整列表。

## 身份与流程

| Prop        | 类型            | 默认值           | 说明                                                                                                                                |
| ----------- | --------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `username`  | string          | `'User'`         | 登录界面用户名                                                                                                                      |
| `password`  | string          | `'forthe2000s'`  | 登录密码                                                                                                                            |
| `avatar`    | string          | 内置 XP 用户头像 | 登录/用户头像 —— 可以是 `XPIcon` 图标 id（如 `'user'`、`'folder'`）或图片 URL。完整图标列表见[组件画廊](/windows-xp/gallery/)       |
| `language`  | string          | `'en'`           | 初始语言（`'en'` 或 `'zh'`；其他代码需要文化包提供 `i18n` 资源）                                                                    |
| `skipBoot`  | boolean         | `false`          | 首次加载时跳过开机画面                                                                                                              |
| `autoLogin` | boolean         | `false`          | 跳过登录界面                                                                                                                        |
| `boot`      | `BootBranding`  | —                | 开机画面品牌定制：`logo`、`text`、`progressColor`、`startupSound`。可选；设置后会替代默认的像素级 XP 画面，并隐藏微软商标           |
| `login`     | `LoginBranding` | —                | 登录界面品牌定制：`background`、`title`、`userTile`、`userName`。可选；扩展 `avatar`/`username`，并隐藏 "Microsoft Windows XP" 字样 |

## 内容

| Prop               | 类型                     | 默认值    | 说明                                                                                                                                      |
| ------------------ | ------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `customFileSystem` | object                   | `null`    | 你的文件系统节点（见[内容](/zh/guide/content)）—— 在挂载时生效                                                                            |
| `fileSystemMode`   | `'merge'` \| `'replace'` | `'merge'` | `'replace'` 只保留 OS 骨架；你的内容成为整个桌面                                                                                          |
| `wallpapers`       | `Wallpaper[]`            | 内置列表  | 自定义壁纸，按 id 覆盖内置壁纸                                                                                                            |
| `defaultWallpaper` | string                   | 内置      | 初始壁纸 —— 壁纸 id 或图片 URL                                                                                                            |
| `cultures`         | `CulturePackage[]`       | `[]`      | 扩展/覆盖内置 `en`/`zh` 的文化包                                                                                                          |
| `apps`             | `AppRegistryEntry[]`     | `[]`      | 自定义应用，合并到内置注册表                                                                                                              |
| `scenario`         | `Scenario`               | —         | 数据驱动的剧情/解谜脚本：用普通 JSON 编写标志位（flags）、触发器（triggers）和条件门控动作。见[场景系统](/zh/guide/scenarios)             |
| `lessons`          | `Lesson[]`               | —         | 引导式教程：数据驱动的“观看→尝试→独立完成”三阶段教程。在这里注册后，通过 `ref` 启动。见[引导式教程](/zh/guide/lessons)                    |
| `markdown`         | `MarkdownOptions`        | —         | Markdown 查看器选项：`linkTarget`（`'ie'` \| `'external'`）、自定义 `components` 和 `remarkPlugins`。见[在桌面上搭建博客](/zh/guide/blog) |

## 宿主集成

| Prop                 | 类型                                            | 默认值         | 说明                                                                                                                                                  |
| -------------------- | ----------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`               | `'fullscreen'` \| `'embedded'`                  | `'fullscreen'` | `'embedded'` 关闭所有可能干扰宿主页面的行为（右键拦截、DevTools 拦截、全局快捷键、屏保）                                                              |
| `viewportPolicy`     | `'auto'` \| `'scale'` \| `'native'` \| `'warn'` | 取决于 `mode`  | 小屏策略。fullscreen 下默认 `'auto`，embedded 下默认 `'native'`。见[小屏与移动端](/zh/guide/embedding#xiao-ping-yu-yi-dong-duan)                      |
| `storagePrefix`      | string                                          | `'xp_'`        | 存储命名空间 —— 每个实例完全隔离                                                                                                                      |
| `persistence`        | `'local'` \| `'session'` \| `'none'`            | `'local'`      | 存储后端。`'local'` 跨访问保留（localStorage + IndexedDB）；`'session'` 仅标签页内；`'none'` 纯内存 —— 每次挂载都是初始状态（营销活动页、博客、沙盒） |
| `openOnLoad`         | `string` \| `string[]`                          | —              | 深层链接：桌面可交互后自动打开的文件路径，例如 `'My Documents/readme.txt'`。无效路径静默回退到普通桌面                                                |
| `routes`             | `DeepLinkRoutes`                                | —              | 友好 URL 路由映射（``{ '/blog/:slug': ({ slug }) => ({ open: `D:/posts/${slug}.md` }) }``），与 `location` 匹配。不依赖宿主路由库                     |
| `location`           | string                                          | —              | 宿主当前 location（path 加上可选的 query string），用于 `routes` 匹配                                                                                 |
| `historyIntegration` | boolean                                         | `false`        | 打开/关闭顶层窗口时向浏览器历史栈添加/移除记录，使 Back 键关闭最后打开的窗口                                                                          |

## 行为

| Prop                      | 类型                             | 默认值                                   | 说明                                                                                                                         |
| ------------------------- | -------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `onEvent`                 | `(e: XPEvent) => void`           | —                                        | 订阅桌面所有事件。事件对象形如 `{ type, payload, ... }`，例如 `file:open` 的 `payload` 含 `path`。见[事件](/zh/guide/events) |
| `devtools`                | boolean                          | `false`                                  | 挂载场景/事件 DevTools 浮层（仅开发时；关闭时会被 tree-shake 掉）。见[场景系统](/zh/guide/scenarios)                         |
| `disableContextMenuBlock` | boolean                          | `false`（`mode='embedded'` 时为 `true`） | 允许浏览器右键菜单                                                                                                           |
| `disableDevToolsBlock`    | boolean                          | `false`（`mode='embedded'` 时为 `true`） | 允许 F12 / Ctrl+Shift+I/J/C                                                                                                  |
| `disableGlobalShortcuts`  | boolean                          | `false`（`mode='embedded'` 时为 `true`） | 禁用所有全局快捷键（Ctrl+Esc、Alt+F4、Alt+Tab、蓝屏彩蛋）                                                                    |
| `keymap`                  | `Record<string, string \| null>` | —                                        | 按 id 重映射或禁用单个快捷键（见[键盘快捷键](/zh/guide/keyboard)）                                                           |
| `disableScreenSaver`      | boolean                          | `false`（`mode='embedded'` 时为 `true`） | 禁用闲置屏幕保护程序                                                                                                         |
| `hourlyChime`             | boolean                          | `false`                                  | 整点播放经典报时音（文化包也可开启）                                                                                         |
| `idleThresholdMs`         | number                           | `60000`                                  | 触发 `user:idle` 前的无操作阈值                                                                                              |

命令式控制通过 React `ref` 而非 JSX prop 提供。`XPHandle` 的方法见[事件与命令式控制](/zh/guide/events)。

> **`apps` 和 `cultures` 是响应式的。** 挂载后增删条目会注册/更新它们 ——
> 当 id 冲突时，prop 优先级高于运行时的 `registerApp`/`registerCulture`，
> 内置项和运行时注册项会被保留。`customFileSystem` 保持为**挂载时生效**
> （它用于初始化桌面；后续文件系统变更请在自定义应用组件内通过 `import { useApp } from '@caoergou/windows-xp'` 使用 `useApp().fs`，或从外部通过 `ref` 驱动）。
