---
title: 定制你的桌面
---

# 内容：定制你的桌面

## 自定义文件系统

顶层键会直接合并到桌面根目录——顶层键本身就是桌面项目：

```jsx
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

<WindowsXP customFileSystem={myFileSystem} />
```

**节点结构**——`type`（`'file' | 'folder' | 'app_shortcut'`）、`name`、可选的 `icon`（一个 `XPIcon` id）、`app`（由哪个已注册应用打开）、`content`（文件内容）、`children`（文件夹子项），以及解谜属性 `locked`、`password`、`broken`。这些属性会把普通文件和文件夹变成解谜关卡；完整的交互模型请参见 [docs/PUZZLE-DESIGN.md](https://github.com/caoergou/windows-xp/blob/main/docs/PUZZLE-DESIGN.md)。

**文件类型与应用关联：** `Notepad`（文本）、`PhotoViewer`（图片）、`InternetExplorer`（html/url）、`WindowsMediaPlayer`（音频/视频）。

**合并与替换。** 默认的 `'merge'` 模式会把你的节点叠加到默认桌面上。`fileSystemMode="replace"` 只保留 OS 骨架（回收站 + 一个空的我的电脑），并移除内置快捷方式、预设内容和文化快捷方式——你的 `customFileSystem` 就是整个世界。作品集、营销活动页面和自定义游戏都该用这个模式。

## 壁纸与头像

```jsx
<WindowsXP
  wallpapers={[{ id: 'brand', name: 'Brand', src: '/brand-wallpaper.jpg' }]}
  defaultWallpaper="brand"          // 或直接写 URL："https://…/bg.jpg"
  avatar="/me.png"                  // 或 XPIcon id
/>
```

自定义壁纸会和内置壁纸一起出现在“显示设置”中。文化包也可以通过 `CulturePackage.wallpaper` 声明默认壁纸（但 `defaultWallpaper` prop 优先）。

## 文化包

文化包定义了一套完整的区域/时代体验：桌面快捷方式、开始菜单、浏览器主页、便利贴和 i18n 资源。内置文化包有 `zh`（2000 年代中文互联网）和 `en`（英文语境 2000 年代）。

使用 `defineCulture()` 编写文化包。它是一个标识包装器，会为你提供 `CulturePackage` 类型，并在开发构建中，当某个包可能默默出错时发出警告（并指出具体字段）——例如快捷方式的 `app` 为空、项目 id 重复、项目 `locales` 与包定义的 `locales` 没有交集，或开始菜单的 `nameKey` 在你的 `i18n` 中从未定义：

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
    pinned: [{ id: 'ie', action: 'InternetExplorer', nameKey: 'startMenu.apps.internetExplorer', icon: 'ie' }],
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

<WindowsXP language="ja" cultures={[jpRetroCulture]} />
```

第三语言文化包注意事项：

- **`locales` 会考虑语言基标签。** 某个项目的 `locales: ['ja']` 会匹配运行时的 `'ja-JP'`，反之亦然——基于基子标签、不区分大小写。省略项目级 `locales`，该项目就会在文化包支持的所有语言中显示；设置 `locales` 则可以把项目限定到某个子集（例如只让 `ja` 受众看到的快捷方式）。
- UI 字符串**对于你在 `i18n` 中未提供的任何 key 都会回退到英文**。
- 开始菜单项只通过 `nameKey` 解析名称，因此必须提供这些 key。
- `app` 值必须是**已注册应用 id**——内置应用，或通过 `apps` prop 传入的应用。在开发模式下，未注册的 id 会在挂载时打印警告。

**文化应用完整接入流程**（来自构建 `en` 英文语境 2000 年代文化包的经验——Winamp / Norton AntiVirus / uTorrent / iTunes / Microsoft Office）：

1. **在 `src/apps/` 下构建组件**（像 Winamp 这样的旗舰应用可以复用内置的示例音频片段来播放真实音频；其余应用可以做成带主题的浅层外壳，就像 `zh` 文化包中的迅雷/酷狗应用）。
2. **在 `APP_REGISTRY` 中注册它**，使用 `locales: ['en']` 使其只在该文化中出现，再配置 `icon`、窗口参数，以及一个 `associations` 项，其 `appField` 要等于快捷方式的 `app` 值。
3. **把桌面快捷方式加入文化包的 `desktopShortcuts`**——用户看到的快捷方式 `name` 也是 `data-english-testid="desktop-icon-<name>"` 选择器所看到的，因此要保持一致；`app` 必须与注册表中的 `appField` 匹配。
4. **可选地通过 `nameKey` 把它固定到 `startMenu`。**
5. **素材必须是原创或戏仿作品**——禁止盗用第三方 logo（DEVELOPMENT.md §6）。`en` 应用的图标都是手绘 SVG。

## 编写你的第一个应用

`defineApp()` 通过一次带类型的调用就能把组件变成可注册应用——下面是一个完整、刷新后可恢复的 hello-world，不到 10 行：

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

`defineApp` 会为你填充默认值（图标 `app_window`、400×300 窗口、非单例），并从 `component` 推导出 `restore`。通过命令式句柄打开已注册应用：

```tsx
const xp = useRef(null);
// …
<WindowsXP ref={xp} apps={[HelloApp]} />;
xp.current?.openApp('Hello');   // 打开一个运行 HelloApp 的窗口
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

- **通过 `ref.openApp(id)` 打开自定义应用**（见上文）——它会在包含你传入 `apps` 的合并注册表中解析。`associations` + `getProps` 可以让文件系统节点的 `.app` 字段打开某个应用，但目前这条路径**只解析内置应用**；从桌面/Explorer 快捷方式直接打开自定义应用正在泛化中（由 `appRoles` 相关工作推进）。
- 添加 `nameKey` 以获得翻译后的显示名称；`name` 作为回退。
- 运行时回调应该挂在事件总线（`onEvent`）或 `lifecycle` 上，绝不能放进 props。在组件内部通过 `useApp()` 访问窗口/会话状态。
- 需要手动构建 `AppRegistryEntry`？从 `@caoergou/windows-xp/registry` 导入 `restoreApp` 辅助函数，它提供与内置应用相同的 `unknown → props` 转换。

## 在桌面上搭建博客

桌面天生适合做作品集/博客外壳。把文章写成 Markdown，用一个辅助函数把它们变成可打开的窗口，再镜像成静态页面，这样搜索引擎依然能找到你的内容。

**1. 用 Markdown 编写，通过 `buildContentFs` 加载。** 内容清单（content manifest）就是一篇文章的列表；`buildContentFs` 会把它转换成一个 `customFileSystem` 片段，其中每篇文章都是一个 `<slug>.md` 文件，并在内置的 **MarkdownViewer** 中打开（Notepad 仍然是纯文本编辑器）。共享同一个 `folder` 的文章会嵌套在该文件夹下。

```jsx
import { WindowsXP, buildContentFs } from '@caoergou/windows-xp';

// 使用打包工具时，你可以在构建期 glob 整个 .md 文件夹：
//   const files = import.meta.glob('./posts/*.md', { as: 'raw', eager: true });
const manifest = [
  { slug: 'hello-world', title: 'Hello, World', date: '2007-01-01', source: '# Hi\n\nMy first post.', folder: 'Posts' },
  { slug: 'about-me', title: 'About Me', source: '# About\n\nI build things.' },
];

export default () => <WindowsXP customFileSystem={buildContentFs(manifest)} />;
```

**2. 永久链接开箱即用。** 因为文章都是真实的文件系统节点，[深度链接 API](/guide/events#permalinks-share-links) 可以直接定位它们：`postPermalink(post, siteMeta)` 会返回一个 `?open=…` URL，打开对应文章的窗口，`WindowsXP` 的 `openOnLoad` 会消费该 URL。分享按钮或二维码只需指向这个 URL。

**3. 可被检索——SEO 镜像。** 爬虫不会运行你的桌面，因此要为每篇文章生成一个携带正文并链接回桌面永久链接的静态 HTML 页面。在构建时将正文渲染出来，然后交给 `buildPostMirrorHtml`（渲染步骤由你负责，因此核心库不附带 markdown-to-HTML 依赖）：

```jsx
import { renderToStaticMarkup } from 'react-dom/server';
import { buildPostMirrorHtml, buildRssFeed } from '@caoergou/windows-xp';
import { MarkdownViewer } from '@caoergou/windows-xp/apps';

const site = { title: 'My XP Blog', siteUrl: 'https://me.dev/', language: 'en' };

// 每篇文章生成一个可被爬取的页面（在构建期写入 /blog/<slug>.html）：
for (const post of manifest) {
  // 可以复用桌面内的渲染器以获得字节级一致的输出，也可以使用任意 md→HTML 库：
  const bodyHtml = renderToStaticMarkup(<MarkdownViewer content={post.source} />);
  const page = buildPostMirrorHtml(post, site, bodyHtml);
  // fs.writeFileSync(`dist/blog/${post.slug}.html`, page)
}

// RSS feed 的条目会链接到桌面永久链接：
const rss = buildRssFeed(manifest, { ...site, description: 'Posts from a Windows XP desktop' });
```

按框架接入：在 **Next.js** 中，把镜像页面生成为静态路由（`generateStaticParams`），并从 `app/rss.xml/route.ts` 提供 `rss.xml`；在 **纯 Vite** 项目中，可以在一个小的构建后脚本中写出页面和 feed。无论哪种方式，人类用户看到桌面，爬虫获得可索引的 HTML，并深度链接回桌面。
