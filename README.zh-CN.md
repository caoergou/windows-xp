# Windows XP 桌面引擎 🖥️

<div align="center">

**可嵌入、可用代码驱动的 React 版 Windows XP 桌面——一个可以装入你自己的内容、监听用户操作事件、并用代码控制的怀旧世界。**

[![npm version](https://img.shields.io/npm/v/@caoergou/windows-xp.svg)](https://www.npmjs.com/package/@caoergou/windows-xp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

[在线演示](https://eric.run.place/windows-xp/) · [English desktop](https://eric.run.place/windows-xp/demo/en/) · [中文桌面](https://eric.run.place/windows-xp/demo/zh/) · [文档站](https://eric.run.place/windows-xp/docs/) · [路线图](https://github.com/caoergou/windows-xp/issues/86) · [报告问题](https://github.com/caoergou/windows-xp/issues)

> 在线演示是一个真实运行、可以拖动的桌面——无需登录（演示页自动登录）。上面两个桌面链接可直接进入英文 / 中文世界。

[English](README.md) | 简体中文

</div>

---

还记得 Luna 蓝的任务栏、开机音，和消磨在扫雷上的下午吗？这个项目把那个世界搬回浏览器——**但不是一个固定的演示页，而是一个属于你的 React 组件**：桌面上的每个文件都可以换成你的内容，你都能收到对应的事件通知，接下来发生什么由你的代码决定。

> **免责声明：** 本项目是独立的爱好者复刻作品，仅供怀旧与学习交流之用，与微软公司及 Windows 操作系统无任何关联，亦未获其授权或认可。所有相关商标归各自所有者所有。

## 快速开始

在一个已有的 React 18/19 项目里（Vite、Next.js、Create React App 等）：

```bash
npm install @caoergou/windows-xp react react-dom styled-components
```

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  // autoLogin 和 skipBoot 开发时直接跳到桌面；去掉它们可看到开机和登录。
  return <WindowsXP autoLogin skipBoot language="zh" />;
}
```

`react`、`react-dom`、`styled-components` v6 是 peer dependencies；其余一切（包括 XP 主题 CSS）都已打包在内。

## 为什么选这个？

长得像 Windows XP 的项目很多，这一个是为了**在你的产品里使用**而设计的：

- 🧩 **嵌入零副作用** —— 样式作用域经过处理，通常不会影响宿主页面的其他元素；`mode="embedded"` 关闭可能干扰宿主页面的全局行为；`storagePrefix` 让每个实例的存储完全隔离，同页两个桌面互不干扰。
- 📡 **每个操作都有事件** —— `onEvent` 为每个用户动作送出类型化事件：`file:open`、`app:launch`、`cmd:exec`、`session:login`、窗口生命周期……埋点分析、引导演示、解谜逻辑都可以通过这一个属性实现。
- 🎮 **用代码驱动** —— 通过 React ref（`XPHandle`）可以打开应用和文件、读写文件系统、控制会话与壁纸，还能把整台机器快照成可分享的 JSON 存档：

  ```jsx
  import { useRef } from 'react';
  import type { XPHandle } from '@caoergou/windows-xp';

  const xp = useRef<XPHandle>(null);
  xp.current?.openApp('Notepad');
  // 路径是分段数组，例如 ['folder', 'file.txt']
  xp.current?.fs.writeFile(['diary.txt'], 'hello');
  ```

- 📦 **内容完全由你定义** —— `customFileSystem` + `fileSystemMode="replace"` 把整个桌面换成你的内容；壁纸、头像、自定义应用、整个文化包都以 props 注入。新增普通内容不需要写 React（只有自定义应用需要 `component`）。
- 🧱 **同时是一套组件库** —— `XPButton`、`XPDialog`、`XPTabs`、`XPProgressBar` 等可零 Provider 独立使用：
  ```jsx
  import { XPButton } from '@caoergou/windows-xp/components';
  ```
  与 xp.css 逐值对齐，见[组件画廊](https://eric.run.place/windows-xp/gallery/)。
- 🔍 **严格对照真实 XP** —— 每个视觉与行为细节都在 [FIDELITY.md](FIDELITY.md) 中对照真实 Windows XP SP3 逐项打分，design token 全部标注出处，CI 挂视觉回归基线。这里没有"现代化改良"的圆角。

## 大家用它做什么

| 场景                                                                                           | 用到的能力                                                                                                                                               |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **个人主页 / 作品集** —— 项目变成桌面文件夹，About.txt 用记事本打开                            | `fileSystemMode="replace"`、自定义应用、内置 Internet Explorer 可打开你部署的项目                                                                        |
| **Markdown 博客** —— 文章作为 `.md` 文件在 Markdown 查看器中打开，永久链接，RSS/sitemap 做 SEO | `buildContentFs`/`postFromMarkdown`、深链接、`buildRssFeed`/`buildSitemap` —— 见[在桌面上搭建博客](https://eric.run.place/windows-xp/docs/zh/guide/blog) |
| **解谜游戏 / ARG** —— 加密文件夹、聊天记录线索、会回应玩家的桌面                               | 文件的 `locked`/`password`/`broken` 属性、`onEvent`、[场景系统](https://eric.run.place/windows-xp/docs/zh/guide/scenarios)                               |
| **品牌营销 / 创意页** —— 一个品牌化的千禧年世界（同类标杆：A24 电影《Y2K》官方桌面站）         | 嵌入模式、内容替换、壁纸/头像注入                                                                                                                        |
| **怀旧内容站** —— 2000 年代中文互联网，或英文语境 Y2K，全部数据化                              | 文化包（`cultures` prop）                                                                                                                                |
| **教学沙盒** —— 一台可以随便折腾、随时重置的演示机器                                           | `skipBoot`/`autoLogin`、React ref 句柄、隔离存储                                                                                                         |

逐场景的完整设计推导见 [`docs/USE-CASES.md`](docs/USE-CASES.md)、[`docs/PUZZLE-DESIGN.md`](docs/PUZZLE-DESIGN.md) 与 [`docs/OS-PLATFORM-VISION.md`](docs/OS-PLATFORM-VISION.md)。

## 配置速览

```jsx
// myFs、myWallpaper、myApp、xpRef 的定义见下方或文档。
<WindowsXP
  // 身份与流程
  username="Admin"
  password="hunter2"
  autoLogin
  skipBoot
  // 内容
  language="zh"
  customFileSystem={myFs}
  fileSystemMode="replace"
  wallpapers={[myWallpaper]}
  defaultWallpaper="my-wallpaper"
  avatar="/me.png"
  apps={[myApp]}
  // 宿主集成
  mode="embedded"
  storagePrefix="myapp_xp_"
  // 可观察性
  ref={xpRef}
  onEvent={e => console.log(e.type, e)}
/>
```

一个可运行的完整版本：

```jsx
import { useRef } from 'react';
import { WindowsXP, defineApp } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';
import type { XPHandle } from '@caoergou/windows-xp';

const myFs = {
  // 应用 ID 是注册表键名，保持英文，如 'Notepad'、'InternetExplorer'
  '自述.txt': { type: 'file', name: '自述.txt', app: 'Notepad', content: '你好！' },
  '我的项目': {
    type: 'folder',
    name: '我的项目',
    children: {
      '项目 A.txt': { type: 'file', name: '项目 A.txt', app: 'Notepad', content: '…' },
    },
  },
};

const myWallpaper = { id: 'brand', name: 'Brand', src: '/brand-wallpaper.jpg' };

const myApp = defineApp({
  id: 'Hello',
  name: 'Hello',
  component: () => <div style={{ padding: 16 }}>Hello from Windows XP!</div>,
});

export default function App() {
  const xpRef = useRef<XPHandle>(null);
  return (
    <WindowsXP
      autoLogin
      skipBoot
      language="zh"
      customFileSystem={myFs}
      fileSystemMode="replace"
      wallpapers={[myWallpaper]}
      defaultWallpaper="brand"
      apps={[myApp]}
      mode="embedded"
      storagePrefix="myapp_xp_"
      ref={xpRef}
      onEvent={(e) => console.log(e.type, e)}
    />
  );
}
```

顶层键会合并进桌面根目录——所以直接把文件和文件夹放在顶层即可（**不要**再套一层 `"Desktop"` 文件夹）。

全部 props、事件目录、`XPHandle` 方法、文化包编写、子路径导入（`/components`、`/apps`、`/hooks`、`/theme`、`/registry`）见 **[文档站](https://eric.run.place/windows-xp/docs/)**。

## 内置应用

**完整应用：** 资源管理器（含键盘操作——F2/F5/Del、Backspace 上一级）、记事本（撤销/查找替换/自动换行/保存）、画图（可绘制并保存进虚拟文件系统）、Internet Explorer（历史/收藏/时代门户）、计算器、扫雷（XP 原版贴图、最短用时）、纸牌（完整规则与胜利判定）、命令提示符（真实命令集 + 彩蛋）、图片查看器、运行对话框、音量控制、帮助和支持、任务管理器。

**中文怀旧应用（来自中文文化包）：** QQ 登录、360 安全卫士（带可玩的"查杀木马"剧情）、迅雷、酷狗音乐、暴风影音、WPS Office。

**仅提供界面外壳：** Windows Media Player（可播放内置示例音频）、控制面板（显示/声音/鼠标面板）、网络连接。

系统本身也在：开机画面 → 登录 → 桌面、开始菜单、任务栏与托盘、右键菜单、回收站、屏保、蓝屏（是的，可以触发——在命令提示符里输入 `format c:`）。

## 项目方向

路线图见 [issue #86](https://github.com/caoergou/windows-xp/issues/86)：近期——补齐引擎 API（事件、ref 控制、存档读档）并落地数据驱动的**场景/剧情脚本系统**，让解谜故事用 JSON 编写而不是 React 代码；长期——[OS 包](docs/OS-PLATFORM-VISION.md)：引擎不再只针对 XP 设计，未来 Win98、Win7、类似 macOS Aqua 风格乃至**用户自定义的虚构系统**都可作为主题包安装。

## 贡献与文档

| 文档                                                                | 内容                                           |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| [文档站](https://eric.run.place/windows-xp/docs/)（`docs-site/`）   | 使用方 API：props、事件、ref、子路径、内容编写 |
| [USAGE.md](USAGE.md)                                                | 指向文档站的薄跳转索引                         |
| [FIDELITY.md](FIDELITY.md)                                          | XP 保真基线：逐行为打分 + design token 权威值  |
| [AGENTS.md](AGENTS.md) / [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 贡献者原则与代码规则                           |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                  | 工作流、检查项、PR 要求                        |
| [docs/](docs/)                                                      | 设计与分析：使用场景、解谜设计、平台远景       |

## 技术栈与支持

React 18/19 · TypeScript 5 · styled-components 6 · xp.css（构建期做作用域处理）· react-draggable 与 react-resizable · i18next（使用独立实例）。浏览器：Chrome/Edge 90+、Firefox 88+、Safari 14+。

## 许可与致谢

MIT —— 见 [LICENSE](LICENSE)。站在 [xp.css](https://botoxparty.github.io/XP.css/) 的肩膀上，灵感来自 [winXP](https://github.com/ShizukuIchi/winXP)。

**素材声明：** 系统图标（[XPIcons](https://github.com/iconicX/XPIcons)、[react-xp](https://github.com/zyishai/react-xp)）、官方 XP 壁纸、真实 `.cur` 光标、原版 XP 事件音效、xp.css 字体、扫雷贴图、参考 [PlymouthXP](https://github.com/nulln/PlymouthXP) 的开机动画时序——均**仅用于教育与怀旧目的**，归各自所有者所有，不在本项目 MIT 许可范围内。

<div align="center">
用 ❤️ 和对千禧年代的怀念制作
</div>
