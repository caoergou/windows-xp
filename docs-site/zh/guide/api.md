---
title: API 参考
---

# API 参考

本页是中文 API 速查手册。我们更建议你先把[安装与快速开始](/zh/guide/getting-started)和 [Props 参考](/zh/guide/props)过一遍，对整体概念有了解后再回来看本页。

若需要查看完整类型签名，可阅读中文 TypeDoc 页面（已翻译核心入口，其余页面持续补充中）：

- [API 总览](/zh/api/)
- [`WindowsXPProps`](/zh/api/index/interfaces/WindowsXPProps) — `<WindowsXP>` 全部 props。
- [`XPHandle`](/zh/api/index/interfaces/XPHandle) — `ref` 暴露的命令式方法。
- [`XPEvent`](/zh/api/index/type-aliases/XPEvent) / [`XPEventType`](/zh/api/index/type-aliases/XPEventType) — 事件类型与事件名。
- [`XPFsApi`](/zh/api/index/interfaces/XPFsApi) / [`XPWindowsApi`](/zh/api/index/interfaces/XPWindowsApi) / [`XPSessionApi`](/zh/api/index/interfaces/XPSessionApi) / [`XPAppearanceApi`](/zh/api/index/interfaces/XPAppearanceApi) — 分组 API。
- [`defineApp()`](/zh/api/registry/functions/defineApp) / [`DefineAppConfig`](/zh/api/registry/interfaces/DefineAppConfig) — 注册自定义应用。
- [`defineCulture()`](/zh/api/index/functions/defineCulture) / [`CulturePackage`](/zh/api/index/interfaces/CulturePackage) — 文化包。
- [`defineScenario()`](/zh/api/index/functions/defineScenario) / [`Scenario`](/zh/api/index/interfaces/Scenario) — 场景/解谜脚本。
- [`buildContentFs()`](/zh/api/index/functions/buildContentFs) / [`postFromMarkdown()`](/zh/api/index/functions/postFromMarkdown) — Markdown 博客。
- [Hooks 索引](/zh/api/hooks/) / [`useApp()`](/zh/api/hooks/functions/useApp) — 常用 Hooks。

## 包入口

```ts
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';
```

主入口导出了 `<WindowsXP />` 组件、配套的类型以及若干辅助函数。常用的辅助函数包括：

| 函数                                              | 用途                               |
| ------------------------------------------------- | ---------------------------------- |
| `defineApp(config)`                               | 把 React 组件注册成桌面应用。      |
| `defineCulture(config)`                           | 创建文化包。                       |
| `defineLesson(config)`                            | 创建引导式教程。                   |
| `buildContentFs(posts)` / `postFromMarkdown(...)` | 把 Markdown 博客转成桌面文件系统。 |
| `defineScenario(...)` / `ScenarioBuilder`         | 创建数据驱动的剧情/解谜脚本。      |

以下子路径入口用于按需引入内部模块：

| 子路径                            | 用途                                                          |
| --------------------------------- | ------------------------------------------------------------- |
| `@caoergou/windows-xp/components` | 桌面外壳组件（桌面、任务栏、窗口、对话框、表单控件等）        |
| `@caoergou/windows-xp/apps`       | 内置应用组件（记事本、画图、IE、QQ、迅雷等）                  |
| `@caoergou/windows-xp/hooks`      | 与上下文对应的 React Hooks                                    |
| `@caoergou/windows-xp/theme`      | 主题 token、样式变量                                          |
| `@caoergou/windows-xp/registry`   | 应用注册表辅助函数，如 `resolveFileOpen`、`getAppDisplayName` |

## `<WindowsXP />` Props

完整类型见 [`WindowsXPProps`](/zh/api/index/interfaces/WindowsXPProps)。下面是常用 Props 的中文说明。

### 基础配置

| Prop        | 类型                         | 说明                                                                                                                                                         |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `language`  | `string`                     | 初始语言。内置支持 `'en'` 和 `'zh'`，其他语言需提供对应文化包。                                                                                              |
| `username`  | `string`                     | 登录界面默认用户名。                                                                                                                                         |
| `password`  | `string`                     | 登录界面默认密码。                                                                                                                                           |
| `avatar`    | `string`                     | 用户头像，可以是 `XPIcon` 的 id 或图片 URL。                                                                                                                 |
| `autoLogin` | `boolean`                    | 是否自动登录，跳过登录界面。                                                                                                                                 |
| `skipBoot`  | `boolean`                    | 首次加载是否跳过开机动画。                                                                                                                                   |
| `mode`      | `'fullscreen' \| 'embedded'` | 集成模式。`fullscreen`（默认）保留经典 kiosk 行为；`embedded` 适合嵌入宿主应用，默认会关闭右键屏蔽、F12/DevTools 屏蔽、Alt+F4/Alt+Tab 等全局快捷键以及屏保。 |

### 内容与文件系统

| Prop               | 类型                       | 说明                                                        |
| ------------------ | -------------------------- | ----------------------------------------------------------- |
| `customFileSystem` | `Record<string, FileNode>` | 自定义文件系统，挂载时与默认值合并或替换。                  |
| `fileSystemMode`   | `'merge' \| 'replace'`     | `customFileSystem` 与内置文件系统的合并方式。默认 `merge`。 |
| `apps`             | `AppRegistryEntry[]`       | 自定义应用，用于扩展或覆盖内置应用注册表。                  |
| `cultures`         | `CulturePackage[]`         | 自定义文化包，用于扩展或覆盖内置中英文文化。                |
| `wallpapers`       | `WallpaperItem[]`          | 额外壁纸，合并到内置壁纸列表中。                            |
| `defaultWallpaper` | `string`                   | 初始壁纸 id 或 URL。                                        |

### 交互与集成

| Prop                 | 类型                             | 说明                                                                                                                        |
| -------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `onEvent`            | `XPEventListener`                | 订阅桌面事件（应用启动、文件打开、会话变化等）。                                                                            |
| `openOnLoad`         | `string \| string[]`             | 桌面可用后自动打开的路径（深层链接）。                                                                                      |
| `routes`             | `DeepLinkRoutes`                 | 友好路由映射，例如 ``{ '/blog/:slug': ({ slug }) => ({ open: `D:/posts/${slug}.md` }) }``。                                 |
| `location`           | `string`                         | 宿主当前路径（path + search），用于 `routes` 匹配。                                                                         |
| `historyIntegration` | `boolean`                        | 是否在窗口打开/关闭时 push/pop 浏览器历史。                                                                                 |
| `keymap`             | `Record<string, string \| null>` | 重映射或禁用单个快捷键。例如 `{ 'window.close': 'Mod+Shift+W', 'startMenu.toggle': null }`。快捷键 id 见 `docs/KEYMAP.md`。 |

### 持久化与性能

| Prop              | 类型                             | 说明                                                     |
| ----------------- | -------------------------------- | -------------------------------------------------------- |
| `persistence`     | `'local' \| 'session' \| 'none'` | 持久化后端。默认 `local` 使用 localStorage + IndexedDB。 |
| `storagePrefix`   | `string`                         | localStorage / IndexedDB 键名前缀，默认 `'xp_'`。        |
| `idleThresholdMs` | `number`                         | 触发 `user:idle` 事件的空闲阈值，默认 60000ms。          |

### 高级功能

| Prop             | 类型                             | 说明                                                                                                                                                 |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scenario`       | `Scenario`                       | 用 JSON 描述的事件驱动剧情/解谜流程，例如“打开 QQ 后触发下一步”。详见[场景系统](/zh/guide/scenarios)。                                               |
| `lessons`        | `Lesson[]`                       | 注册引导式教程。详见[引导式教程](/zh/guide/lessons)。                                                                                                |
| `devtools`       | `boolean`                        | 是否挂载场景/事件开发调试面板。生产环境请关闭。                                                                                                      |
| `markdown`       | `MarkdownOptions`                | Markdown 查看器行为配置。常用字段：`linkTarget: 'ie' \| 'external'`、`components`、`remarkPlugins`。                                                 |
| `boot` / `login` | `BootBranding` / `LoginBranding` | 开机动画/登录界面品牌定制。`boot` 字段如 `{ logo, text, progressColor, startupSound }`；`login` 字段如 `{ background, title, userTile, userName }`。 |

## `ref` 句柄（XPHandle）

通过 React ref 获取 [`XPHandle`](/zh/api/index/interfaces/XPHandle)，即可直接调用桌面方法。例如：

```tsx
import { useRef } from 'react';
import { WindowsXP, type XPHandle } from '@caoergou/windows-xp';

function Host() {
  const xpRef = useRef<XPHandle>(null);

  return (
    <>
      <button onClick={() => xpRef.current?.openApp('notepad')}>打开记事本</button>
      <WindowsXP ref={xpRef} />
    </>
  );
}
```

### 常用方法

| 方法                                                      | 说明                                                                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `openApp(appId, props?)`                                  | 按 id 打开已注册应用，可传入组件 props。props 必须是 JSON 可序列化的对象（不能传函数或 React 节点），否则刷新后窗口无法恢复。 |
| `openFile(path)`                                          | 按文件系统路径打开节点，自动选择对应应用。返回窗口 id。                                                                       |
| `closeWindow(windowId)`                                   | 按窗口 id 关闭窗口。id 来自 `openApp`/`openFile` 的返回值，或 `ref.current.windows.list()`。                                  |
| `showAlert(title, message)`                               | 弹出 XP 风格提示框。                                                                                                          |
| `reset()`                                                 | 清空所有持久化状态并重新加载。                                                                                                |
| `getSnapshot()` / `loadSnapshot(snapshot): Promise<void>` | 捕获 / 恢复完整桌面状态。`loadSnapshot` 是异步的。                                                                            |
| `emit(event)`                                             | 向事件总线注入一个事件，例如 `emit({ type: 'app:launch', payload: { appId: 'notepad' } })`。                                  |
| `notify(options)`                                         | 弹出托盘气泡通知，例如 `notify({ title: '提示', message: '内容' })`。                                                         |
| `schedule(options)` / `cancelSchedule(id)`                | 延迟或定时触发事件，例如 `schedule({ delayMs: 5000, event: { type: 'time:fire' } })`。                                        |
| `startLesson(id, mode?)` / `stopLesson()`                 | 开始 / 停止引导式教程。`mode` 可选 `'watch'`、`'try'`、`'do'`。                                                               |

### 分组 API

| 分组                           | 说明                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `ref.current.windows`          | 窗口控制：[`XPWindowsApi`](/zh/api/index/interfaces/XPWindowsApi)（列出、聚焦、最小化、最大化、还原）。      |
| `ref.current.fs`               | 文件系统操作：[`XPFsApi`](/zh/api/index/interfaces/XPFsApi)（读/写/创建/删除文件）。                         |
| `ref.current.session`          | 会话控制：[`XPSessionApi`](/zh/api/index/interfaces/XPSessionApi)（登录/注销/关机/重启）。                   |
| `ref.current.appearance`       | 外观控制：[`XPAppearanceApi`](/zh/api/index/interfaces/XPAppearanceApi)（切换壁纸/语言）。                   |
| `ref.current.scenario`         | 场景排练：[`XPScenarioApi`](/zh/api/index/interfaces/XPScenarioApi)（跳转到指定节拍、前进/后退）。           |
| `ref.current.sound.play(name)` | 播放命名系统音效，例如 `sound.play('startup')`。                                                             |
| `ref.current.qq`               | QQ 相关驱动接口，例如 `qq.open('crystal')`、`qq.sendMessage('crystal', 'hi')`、`qq.bringOnline('crystal')`。 |

## 事件系统

`onEvent` 接收的事件类型为 [`XPEvent`](/zh/api/index/type-aliases/XPEvent)。事件格式统一为 `{ type, payload, ... }`。

```tsx
<WindowsXP
  onEvent={event => {
    if (event.type === 'app:launch') {
      console.log('应用启动:', event.payload.appId);
    }
  }}
/>
```

完整事件列表见[事件与命令式控制](/zh/guide/events)（中文说明）或 TypeDoc 中的 [`XPEventType`](/zh/api/index/type-aliases/XPEventType)。

## 常用 Hooks

以下 Hooks 来自 `@caoergou/windows-xp/hooks`，必须在桌面 provider 内部使用：

| Hook                 | 用途                           |
| -------------------- | ------------------------------ |
| `useApp(appId)`      | 获取指定应用的注册信息。       |
| `useAppRegistry()`   | 获取完整应用注册表。           |
| `useFileSystem()`    | 读写虚拟文件系统。             |
| `useUserSession()`   | 获取当前登录会话。             |
| `useWindowManager()` | 获取窗口管理器上下文。         |
| `useTray()`          | 获取托盘上下文。               |
| `useCulture()`       | 获取当前文化包与语言切换方法。 |
| `useScheduler()`     | 调度定时事件。                 |
| `useModal()`         | 打开/管理模态框。              |

事件相关的 Hook 在主入口中导出：

| Hook                                | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `useXPEvents()` / `useXPEventBus()` | 订阅事件总线。适合在自定义应用组件内监听桌面事件。 |

## 下一步

- 想了解 Props 的详细用法，看 [Props 参考](/zh/guide/props)。
- 想自定义桌面内容，看[打造你的专属桌面](/zh/guide/content)。
- 想用事件驱动剧情或埋点，看[事件与命令式控制](/zh/guide/events)。
- 需要完整类型签名，阅读中文 TypeDoc [API 总览](/zh/api/)，或切换到英文站点阅读 [TypeDoc 完整 API](/api/)。
