---
title: 打造你的专属桌面
---

# 内容：打造你的专属桌面

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

这个桌面天然适合做个人主页 / 博客外壳——文章作为 `.md` 文件在 Markdown 查看器中打开、
永久链接、用 RSS + sitemap 做 SEO。它有独立的一页：**[在桌面上搭建博客](/zh/guide/blog)**。
