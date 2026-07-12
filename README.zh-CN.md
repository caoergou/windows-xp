# Windows XP 桌面引擎 🖥️

<div align="center">

**可嵌入、可编排的 React 版 Windows XP 桌面——一个可以装进你自己内容、通过事件观察、用代码驱动的怀旧世界。**

[![npm version](https://img.shields.io/npm/v/@caoergou/windows-xp.svg)](https://www.npmjs.com/package/@caoergou/windows-xp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

[在线演示](https://eric.run.place/windows-xp/) · [English desktop](https://eric.run.place/windows-xp/demo/en/) · [中文桌面](https://eric.run.place/windows-xp/demo/zh/) · [文档站](https://eric.run.place/windows-xp/docs/) · [路线图](https://github.com/caoergou/windows-xp/issues/86) · [报告问题](https://github.com/caoergou/windows-xp/issues)

> 在线演示是一个真实运行、可以拖动的桌面——无需登录（演示页自动登录）。上面两个桌面链接可直接进入英文 / 中文世界。

[English](README.md) | 简体中文

</div>

---

还记得 Luna 蓝的任务栏、开机音，和消磨在扫雷上的下午吗？这个项目把那个世界搬回浏览器——**但不是一个固定的演示页，而是一个属于你的 React 组件**：桌面上的每个文件都可以换成你的内容，用户的每个动作都可以被订阅，接下来发生什么由你的代码决定。

> **免责声明：** 本项目是独立的爱好者复刻作品，仅供怀旧与学习交流之用，与微软公司及 Windows 操作系统无任何关联，亦未获其授权或认可。所有相关商标归各自所有者所有。

## 快速开始

```bash
npm install @caoergou/windows-xp
```

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  return <WindowsXP autoLogin skipBoot language="zh" />;
}
```

仅三个 peer 依赖（`react` 18/19、`react-dom`、`styled-components` v6）——其余一切（包括 XP 主题 CSS）都已打包在内。

## 为什么选这个？

长得像 Windows XP 的项目很多，这一个是为了**在你的产品里使用**而设计的：

- 🧩 **嵌入零副作用** —— 所有样式作用域限定在 `.windows-xp-root` 之下（宿主页面的按钮还是你的按钮）；`mode="embedded"` 一键关闭全部全局拦截；`storagePrefix` 让每个实例的存储完全隔离，同页两个桌面互不干扰。
- 📡 **万物皆事件** —— `onEvent` 以类型化事件流送出用户的每个动作：`file:open`、`app:launch`、`cmd:exec`、`session:login`、窗口生命周期……埋点分析、引导演示、解谜逻辑都挂在这一个 prop 上。
- 🎮 **用代码驱动** —— 命令式 `ref` 句柄（`XPHandle`）可以打开应用和文件、读写文件系统、控制会话与壁纸，还能把整台机器快照成可分享的 JSON 存档（`getSnapshot`/`loadSnapshot`）。
- 📦 **你的世界，不是我们的** —— `customFileSystem` + `fileSystemMode="replace"` 把整个桌面换成你的内容；壁纸、头像、自定义应用、整个文化包都以 props 注入。新增内容永远不需要写 React。
- 🧱 **同时是一套组件库** —— `XPButton`、`XPDialog`、`XPTabs`、`XPProgressBar` 等可零 Provider 独立使用，与 xp.css 逐值对齐（见[组件画廊](https://eric.run.place/windows-xp/gallery/)）。
- 🔍 **把保真当纪律** —— 每个视觉与行为细节都在 [FIDELITY.md](FIDELITY.md) 中对照真实 XP SP3 逐项打分，design token 全部标注出处，CI 挂视觉回归基线。这里没有"现代化改良"的圆角。

## 大家用它做什么

| 场景 | 用到的能力 |
|---|---|
| **个人主页 / 作品集** —— 项目变成桌面文件夹，About.txt 用记事本打开 | `fileSystemMode="replace"`、自定义应用、IE 内嵌你部署的项目 |
| **解谜游戏 / ARG** —— 加密文件夹、聊天记录线索、会回应玩家的桌面 | 文件的 `locked`/`password`/`broken` 属性、`onEvent`、[剧情系统](https://github.com/caoergou/windows-xp/issues/84)（开发中） |
| **品牌营销 / 创意页** —— 一个品牌化的千禧年世界（同类标杆：A24 电影《Y2K》官方桌面站） | 嵌入模式、内容替换、壁纸/头像注入 |
| **怀旧内容站** —— 2005–2007 的中文互联网，或西方 Y2K，全部数据化 | 文化包（`cultures` prop） |
| **教学沙盒** —— 一台可以随便折腾、随时重置的演示机器 | `skipBoot`/`autoLogin`、命令式句柄、隔离存储 |

逐场景的完整设计推导见 [`docs/USE-CASES.md`](docs/USE-CASES.md)、[`docs/PUZZLE-DESIGN.md`](docs/PUZZLE-DESIGN.md) 与 [`docs/OS-PLATFORM-VISION.md`](docs/OS-PLATFORM-VISION.md)。

## 配置速览

```jsx
<WindowsXP
  // 身份与流程
  username="Admin" password="hunter2" autoLogin skipBoot
  // 内容
  language="zh" customFileSystem={myFs} fileSystemMode="replace"
  wallpapers={[myWallpaper]} defaultWallpaper="my-wallpaper" avatar="/me.png"
  cultures={[myCulture]} apps={[myApp]}
  // 宿主集成
  mode="embedded" storagePrefix="myapp_xp_"
  // 可观察性
  ref={xpRef} onEvent={(e) => console.log(e.type, e)}
/>
```

自定义文件系统的顶层键直接合并进桌面（顶层键 = 桌面项）：

顶层键会合并进桌面根目录——所以直接把文件和文件夹放在顶层即可（**不要**再套一层 `"Desktop"` 文件夹）：

```jsx
const myFs = {
  '自述.txt': { type: 'file', name: '自述.txt', app: 'Notepad', content: '你好！' },
  '我的项目': { type: 'folder', name: '我的项目', children: { /* … */ } },
};
```

全部 props、事件目录、`XPHandle` 方法、文化包编写、子路径导入（`/components`、`/apps`、`/hooks`、`/theme`、`/registry`）见 **[文档站](https://eric.run.place/windows-xp/docs/)**（旧的 [USAGE.md](USAGE.md) 现在是薄跳转索引）。

## 内置应用

**完整实现：** 资源管理器（含键盘操作——F2/F5/Del、Backspace 上一级）、记事本（撤销/查找替换/自动换行/保存）、画图（可绘制并保存进虚拟文件系统）、Internet Explorer（历史/收藏/时代门户）、计算器、扫雷（XP 原版贴图、最佳时间）、纸牌（完整规则与胜利判定）、命令提示符（真实命令集 + 彩蛋）、图片查看器、运行对话框、音量控制、帮助和支持、任务管理器。

**时代应用（中文文化包）：** QQ 登录、360 安全卫士（带可玩的"查杀木马"剧情）、迅雷、酷狗音乐、暴风影音、WPS Office。

**UI 外壳（存在但刻意保持浅层）：** Windows Media Player（可播放内置示例音频）、控制面板（显示/声音/鼠标面板）、网络连接。

系统本身也在：开机画面 → 登录 → 桌面、开始菜单、任务栏与托盘、右键菜单、回收站、屏保、蓝屏（是的，可以触发——试试 `format c:`）。

## 项目方向

路线图见 [issue #86](https://github.com/caoergou/windows-xp/issues/86)：近期——补齐引擎 API（事件、命令式控制、存档读档）并落地声明式**剧情系统**，让解谜故事成为纯 JSON；长期——[OS 包](docs/OS-PLATFORM-VISION.md)：引擎与"XP"解耦，Win98/Win7/类 Aqua 乃至**用户自定义的虚构系统**都成为可安装的包。

## 贡献与文档

| 文档 | 内容 |
|---|---|
| [文档站](https://eric.run.place/windows-xp/docs/)（`docs-site/`）| 使用方 API：props、事件、ref、子路径、内容编写 |
| [USAGE.md](USAGE.md) | 指向文档站的薄跳转索引 |
| [FIDELITY.md](FIDELITY.md) | XP 保真基线：逐行为打分 + design token 权威值 |
| [AGENTS.md](AGENTS.md) / [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 贡献者原则与代码规则 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 工作流、检查项、PR 要求 |
| [docs/](docs/) | 设计与分析：使用场景、解谜设计、平台远景 |

## 技术栈与支持

React 18/19 · TypeScript 5 · styled-components 6 · xp.css（构建期作用域化）· react-draggable/-resizable · i18next（隔离实例）。浏览器：Chrome/Edge 90+、Firefox 88+、Safari 14+。

## 许可与致谢

MIT —— 见 [LICENSE](LICENSE)。站在 [xp.css](https://botoxparty.github.io/XP.css/) 的肩膀上，灵感来自 [winXP](https://github.com/ShizukuIchi/winXP)。

**素材声明：** 系统图标（[XPIcons](https://github.com/iconicX/XPIcons)、[react-xp](https://github.com/zyishai/react-xp)）、官方 XP 壁纸、真实 `.cur` 光标、原版 XP 事件音效、xp.css 字体、扫雷贴图、参考 [PlymouthXP](https://github.com/nulln/PlymouthXP) 的开机动画时序——均**仅用于教育与怀旧目的**，归各自所有者所有，不在本项目 MIT 许可范围内。

<div align="center">
用 ❤️ 和对千禧年代的怀念制作
</div>
