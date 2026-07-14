---
title: 打造你的专属桌面
---

# 内容：打造你的专属桌面

桌面上的一切——文件、快捷方式、壁纸、文化元素——都用**数据描述**：你写出“有什么”，组件负责“怎么显示”。判断标准很简单：**新增一条普通内容不需要写 React 代码**。

## 自定义文件系统

传入 `customFileSystem` 把文件和文件夹添加到桌面。每个顶层键都会变成一个桌面图标：

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

const myFileSystem = {
  'ReadMe.txt': {
    type: 'file',
    name: 'ReadMe.txt',
    app: 'Notepad',
    content: 'Welcome to my desktop!',
  },
  'My Projects': {
    type: 'folder',
    name: 'My Projects',
    children: {
      'Project A.txt': { type: 'file', name: 'Project A.txt', app: 'Notepad', content: '…' },
    },
  },
  'MyApp.lnk': { type: 'app_shortcut', name: 'MyApp.lnk', app: 'Calculator', icon: 'calculator' },
};

export default function App() {
  return <WindowsXP customFileSystem={myFileSystem} autoLogin skipBoot />;
}
```

**节点字段**

| 字段                             | 类型                                     | 说明                                                                                                                                             |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`                           | `'file' \| `'folder' \| `'app_shortcut'` | 节点类型。                                                                                                                                       |
| `name`                           | string                                   | 显示名称。                                                                                                                                       |
| `icon`                           | string（可选）                           | `XPIcon` 图标 id，如 `'notepad'`、`'folder'`。                                                                                                   |
| `app`                            | string                                   | 打开该节点的已注册应用 id，如 `'Notepad'`、`'InternetExplorer'`。                                                                                |
| `content`                        | string（可选）                           | 文件内容，文本文件有效。                                                                                                                         |
| `children`                       | object（可选）                           | 文件夹的子节点。                                                                                                                                 |
| `locked` / `password` / `broken` | boolean / string（可选）                 | 解谜属性，可把普通文件变成关卡。完整交互模型见 [docs/PUZZLE-DESIGN.md](https://github.com/caoergou/windows-xp/blob/main/docs/PUZZLE-DESIGN.md)。 |

**文件类型与应用关联：** `Notepad`（文本）、`PhotoViewer`（图片）、`InternetExplorer`（html/url）、`WindowsMediaPlayer`（音频/视频）。

**合并与替换。** 默认的 `'merge'` 模式会把你的节点叠加到默认桌面上。`fileSystemMode="replace"` 只保留 OS 骨架（回收站 + 一个空的我的电脑），并移除内置快捷方式、预设内容和文化快捷方式——你的 `customFileSystem` 就是整个世界。作品集、营销活动页面和自定义游戏都该用这个模式。

## 壁纸与头像

```jsx
<WindowsXP
  wallpapers={[{ id: 'brand', name: 'Brand', src: '/brand-wallpaper.jpg' }]}
  defaultWallpaper="brand" // 或直接写 URL："https://…/bg.jpg"
  avatar="/me.png" // 或 XPIcon id
/>
```

自定义壁纸会和内置壁纸一起出现在“显示设置”中。文化包也可以通过 `CulturePackage.wallpaper` 声明默认壁纸（但 `defaultWallpaper` prop 优先）。

## 文化包

文化包定义了一套完整的区域/时代体验：桌面快捷方式、开始菜单、浏览器主页、便利贴和 i18n 资源。内置文化包有 `zh`（2000 年代中文互联网）和 `en`（英文语境 2000 年代）。

使用 `defineCulture()` 编写文化包。这是一个工厂函数：除了提供 `CulturePackage` 类型提示外，它还会在开发模式下校验包里的常见错误，例如快捷方式的 `app` 为空、项目 id 重复、`locales` 不匹配，或 `nameKey` 在 `i18n` 中未定义：

```jsx
import { WindowsXP, defineCulture } from '@caoergou/windows-xp';

const jpRetroCulture = defineCulture({
  id: 'jp-retro',
  displayName: '日本 2000s',
  locales: ['ja', 'ja-JP'],
  browser: { homepage: 'http://www.yahoo.co.jp' },
  desktopShortcuts: [
    // `app` 必须是已注册应用 id（内置应用或通过 `apps` prop 传入）。
    { id: 'nicovideo', name: 'ニコニコ動画', app: 'InternetExplorer', icon: 'ie' },
  ],
  startMenu: {
    pinned: [
      {
        id: 'ie',
        action: 'InternetExplorer',
        nameKey: 'startMenu.apps.internetExplorer',
        icon: 'ie',
      },
    ],
    recent: [{ id: 'notepad', action: 'Notepad', nameKey: 'apps.notepad', icon: 'file' }],
  },
  stickyNote: { id: 'default', title: 'メモ', content: 'カスタム文化包のテスト' },
  i18n: {
    ja: {
      'startMenu.apps.internetExplorer': 'Internet Explorer',
      'apps.notepad': 'メモ帳',
    },
  },
});

<WindowsXP language="ja" cultures={[jpRetroCulture]} />;
```

> **注意 `app` 与 `action` 的区别。** 在 `desktopShortcuts` 中使用 `app` 字段；在 `startMenu` 的 `pinned` / `recent` 中使用 `action` 字段。二者都应填入已注册的应用 id，只是内部类型命名不同。

第三语言文化包注意事项：

- **`locales` 会考虑语言基标签。** 某个项目的 `locales: ['ja']` 会匹配运行时的 `'ja-JP'`，反之亦然——基于基子标签、不区分大小写。省略项目级 `locales`，该项目就会在文化包支持的所有语言中显示；设置 `locales` 则可以把项目限定到某个子集（例如只让 `ja` 受众看到的快捷方式）。
- UI 字符串**对于你在 `i18n` 中未提供的任何 key 都会回退到英文**。
- 开始菜单项只通过 `nameKey` 解析名称，因此必须提供这些 key。
- `app` 值必须是**已注册应用 id**——内置应用，或通过 `apps` prop 传入的应用。在开发模式下，未注册的 id 会在挂载时打印警告。

> **贡献者说明——把文化应用接入到库内部**
>
> 下面的步骤是给向 `windows-xp` 仓库本身贡献新的内置文化应用的作者看的（需要编辑 `src/apps/` 和 `APP_REGISTRY`）。如果你是 npm 包的使用者，想在自己的项目里添加自定义应用，请使用 `defineApp()`（见下文[编写你的第一个应用](#编写你的第一个应用)），然后在文化包的 `desktopShortcuts` 中引用它的 `id`。

**文化应用完整接入流程**（来自构建 `en` 英文语境 2000 年代文化包的经验——Winamp / Norton AntiVirus / uTorrent / iTunes / Microsoft Office）：

1. **在 `src/apps/` 下构建组件**（像 Winamp 这样的旗舰应用可以复用内置的示例音频片段来播放真实音频；其余应用可以做成带主题的浅层外壳，就像 `zh` 文化包中的迅雷/酷狗应用）。
2. **在 `APP_REGISTRY` 中注册它**，使用 `locales: ['en']` 使其只在该文化中出现，再配置 `icon`、窗口参数，以及一个 `associations` 项，其 `appField` 要等于快捷方式的 `app` 值。
3. **把桌面快捷方式加入文化包的 `desktopShortcuts`**——用户看到的快捷方式 `name` 也是 `data-english-testid="desktop-icon-<name>"` 选择器所看到的，因此要保持一致；`app` 必须与注册表中的 `appField` 匹配。
4. **可选地通过 `nameKey` 把它固定到 `startMenu`。**
5. **素材必须是原创或戏仿作品**——禁止盗用第三方 logo（DEVELOPMENT.md §6）。`en` 应用的图标都是手绘 SVG。

## 编写你的第一个应用

`defineApp()` 接收一个组件和配置，返回一个类型安全的可注册应用——下面是一个完整、刷新后窗口仍能恢复的 hello-world，不到 10 行：

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import { defineApp } from '@caoergou/windows-xp/registry';

const HelloApp = defineApp({
  id: 'Hello',
  name: 'Hello',
  component: () => <div style={{ padding: 16 }}>Hello from Windows XP!</div>,
});

export default () => <WindowsXP apps={[HelloApp]} />;
```

`defineApp` 会为你填充默认值（图标 `app_window`、400×300 窗口、非单例），并从 `component` 推导出 `restore`。通过 React ref 打开已注册应用：

```tsx
import { useRef } from 'react';
import type { XPHandle } from '@caoergou/windows-xp';

const xp = useRef<XPHandle>(null);
// …
<WindowsXP ref={xp} apps={[HelloApp]} />;
xp.current?.openApp('Hello'); // 打开一个运行 HelloApp 的窗口
```

**刷新后仍能保留的 props。** 窗口的 props 会被持久化，以便重新加载时重建窗口，因此它们必须是 JSON 可序列化的。`defineApp` 在编译期强制这一点——如果你的 props 里出现函数或元素，那会是**类型错误**，而不是悄无声息的刷新 bug：

```tsx
const NoteApp = defineApp<{ text: string }>({
  id: 'Note',
  name: 'Note',
  component: ({ text }) => <div>{text}</div>,
  // window、nameKey、locales、lifecycle、associations 都是可选的。
});
```

需要注意的规则：

- **通过 `ref.openApp(id)` 打开自定义应用**（见上文）——它会在包含你传入 `apps` 的合并注册表中解析。`associations` + `getProps` 可以让文件系统节点的 `.app` 字段打开某个应用，但目前这条路径**只解析内置应用**；从宿主代码打开自定义应用请始终使用 `ref.openApp(id)`。
- 添加 `nameKey` 以获得翻译后的显示名称；`name` 作为回退。
- 运行时回调应该挂在事件总线（`onEvent`）或 `lifecycle` 上，绝不能放进 props。在组件内部通过 `import { useApp } from '@caoergou/windows-xp'` 使用 `useApp()` 访问窗口/会话状态。
- 需要手动构建 `AppRegistryEntry`？从 `@caoergou/windows-xp/registry` 导入 `restoreApp` 辅助函数，它提供与内置应用相同的 `unknown → props` 转换。

## 在桌面上搭建博客

这个桌面天然适合做作品集/博客外壳——文章作为 `.md` 文件在 Markdown 查看器中打开、永久链接、用 RSS + sitemap 做 SEO。它有独立的一页：**[在桌面上搭建博客](/zh/guide/blog)**。
