---
title: 让桌面成为你的
---

# 内容：让桌面成为你的

桌面上的一切——文件、快捷方式、壁纸、文化元素——都用**声明式数据**描述，
组件只负责机制。判断标准很简单：**新增一条内容不应该需要写 React 代码**。

## 自定义文件系统

顶层的 key 会直接合并进桌面根目录——一个顶层 key 就是一个桌面项：

```jsx
const myFileSystem = {
  'ReadMe.txt': {
    type: 'file',
    name: 'ReadMe.txt',
    app: 'Notepad',
    content: '你好，世界！',
  },
  我的项目: {
    type: 'folder',
    name: '我的项目',
    children: {
      /* 嵌套的文件与文件夹 */
    },
  },
};

export default () => <WindowsXP customFileSystem={myFileSystem} />;
```

`fileSystemMode` 决定合并方式：`'merge'`（默认）把你的内容叠加在内置桌面之上；
`'replace'` 只保留操作系统骨架（回收站 + 空的"我的电脑"），让你的内容成为整个桌面。

## 壁纸与头像

`wallpapers` 把额外壁纸并入选择器，`defaultWallpaper` 设定初始壁纸（可以是壁纸 id，
也可以是图片 URL）；`avatar` 是登录/用户头像（XPIcon 的 id 或图片 URL）。

## 文化包

文化包（culture package）把一整套时代内容——桌面快捷方式、便签、开始菜单、
IE 站点、启动通知——打包成可注入、可复用的数据。用 `defineCulture` 编写，
通过 `cultures` prop 注入。详见英文版 [Culture packages](/guide/content#culture-packages)。

## 编写你的第一个应用

自定义应用通过 `apps` prop 注入，登记进应用注册表（APP_REGISTRY）。详见英文版
[Write your first app](/guide/content#write-your-first-app)。

## 在桌面上搭建博客

这个桌面天然适合做个人主页 / 博客外壳：把文章写成 Markdown，用一个 helper 变成
可打开的窗口，再镜像成静态页面让搜索引擎能收录你的文字（#137、#254）。

**1. 用 Markdown 写作，用 `buildContentFs` 加载。** _内容清单（content manifest）_
就是一个文章列表；`buildContentFs` 把它转成 `customFileSystem` 片段，每篇文章是一个
`<slug>.md` 文件，在内置的 **MarkdownViewer** 中打开（Notepad 仍是纯文本编辑器）。
共享同一 `folder` 的文章会归到该文件夹下。渲染基于
[`react-markdown`](https://github.com/remarkjs/react-markdown) + `remark-gfm`，
因此 CommonMark 加上 GitHub 扩展——表格、任务列表、删除线、自动链接、图片——都支持，
且不受信任的文章内容无法注入 HTML。

最省心的入口是：glob 一个 `.md` 文件夹，让 `postFromMarkdown` 读取每篇文章顶部的
YAML **frontmatter**（`title`、`date`、`excerpt`、`folder`、`tags`）：

```jsx
import { WindowsXP, buildContentFs, postFromMarkdown } from '@caoergou/windows-xp';

// Vite：原样导入每篇文章，再把 frontmatter 解析成清单。
const files = import.meta.glob('./posts/*.md', { query: '?raw', import: 'default', eager: true });
const manifest = Object.entries(files).map(([path, source]) =>
  postFromMarkdown(source, { slug: path.split('/').pop().replace(/\.md$/, '') })
);

export default () => <WindowsXP customFileSystem={buildContentFs(manifest)} />;
```

一篇文章文件长这样：

```md
---
title: 你好，世界
date: 2007-01-01
folder: 文章
tags: [xp, blog]
---

# 你好

我的第一篇文章。
```

MarkdownViewer 会把 frontmatter 里的 `title`/`date` 渲染成文章头部。你也可以手写清单
（`{ slug, title, date, source, folder }`），如果你更愿意把元数据放在代码里。

**2. 控制链接在哪里打开。** 默认情况下，文章里的链接会打开一个真实的浏览器标签页。
设置 `markdown={{ linkTarget: 'ie' }}` 可以让链接改为在桌面自带的 Internet Explorer
窗口里打开——把读者留在这个"世界"里：

```jsx
<WindowsXP customFileSystem={buildContentFs(manifest)} markdown={{ linkTarget: 'ie' }} />
```

**3. 扩展渲染器（例如 mermaid）。** 核心刻意不打包任何图表依赖，但
`markdown.components` / `markdown.remarkPlugins` 是直通 `react-markdown` 的接口，
你可以通过提供一个 `code` 渲染器来接入 mermaid 等扩展：

```jsx
<WindowsXP
  customFileSystem={buildContentFs(manifest)}
  markdown={{
    components: {
      code: ({ className, children }) =>
        className === 'language-mermaid' ? (
          <Mermaid chart={String(children)} /> // 你自己的组件
        ) : (
          <code className={className}>{children}</code>
        ),
    },
  }}
/>
```

**4. 永久链接（permalink）开箱即用。** 因为文章就是真实的文件系统节点，深链接 API
可以直接寻址：`postPermalink(post, siteMeta)` 返回一个 `?open=…` URL，打开该文章的窗口，
`WindowsXP` 的 `openOnLoad` 会消费它。分享按钮或二维码指向这个 URL 即可。

**5. 被搜索引擎发现——SEO 三件套。** 爬虫不会运行你的桌面，所以要为每篇文章生成一个
静态 HTML 页面，外加一个 feed 和一个 sitemap。在构建时渲染正文交给
`buildPostMirrorHtml`；`buildRssFeed` 和 `buildSitemap` 把同一份清单转成 `rss.xml`
和 `sitemap.xml`：

```jsx
import { renderToStaticMarkup } from 'react-dom/server';
import { buildPostMirrorHtml, buildRssFeed, buildSitemap } from '@caoergou/windows-xp';
import { MarkdownViewer } from '@caoergou/windows-xp/apps';

const site = { title: '我的 XP 博客', siteUrl: 'https://me.dev/', language: 'zh' };

// 每篇文章一个可爬取页面（构建时写到 /blog/<slug>.html）：
for (const post of manifest) {
  const bodyHtml = renderToStaticMarkup(<MarkdownViewer content={post.source} />);
  const page = buildPostMirrorHtml(post, site, bodyHtml);
  // fs.writeFileSync(`dist/blog/${post.slug}.html`, page)
}

const rss = buildRssFeed(manifest, { ...site, description: '来自一个 Windows XP 桌面的文章' });
const sitemap = buildSitemap(manifest, site);
```

按框架接线：**Next.js** 里用静态路由（`generateStaticParams`）生成镜像页，用 route
handler 提供 `rss.xml` / `sitemap.xml`；**纯 Vite** 里用一个构建后小脚本写出这些页面和
feed。无论哪种方式，人看到的是桌面，爬虫拿到的是可索引、且深链接回桌面的 HTML。
