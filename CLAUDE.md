# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是《山月无声》互动解谜网页游戏的**设计项目**。这是一款社会派悬疑游戏，玩家扮演**2026年的夏灯**，通过"数字考古"的方式调查2015-2016年的悲剧真相。

### 游戏形式

整个游戏在一个**模拟的Windows XP桌面**上进行。玩家通过以下方式获取信息:

- 访问本地文件和加密压缩包
- 浏览网页（贴吧、QQ空间、学校官网等模拟页面）
- 查看QQ聊天记录导出文件
- 阅读电子邮件
- 分析照片EXIF数据和时间戳

**当前阶段**: 故事设计与素材规划

## 目录结构

```
web-game/
├── docs/                    # 核心设计文档（开发参考）
│   ├── 大纲.md              # 故事的整体大纲
│   ├── 设计.md              # 游戏设计规格
│   ├── 解密.md              # 解密机制设计
│   ├── 时间线.md            # 事件时间线
│   └── 人物.md              # 人物设定
│
├── assets/                  # 素材内容（游戏内文本）
│   ├── 清单.md              # 素材清单索引
│   ├── qq-space/            # QQ空间内容
│   ├── chat-logs/           # 聊天记录
│   ├── emails/              # 邮件内容
│   ├── tieba/               # 贴吧帖子
│   └── documents/           # 游戏内文档（日志等）
│
├── archive/                 # 历史版本归档
│   ├── story-versions/      # 故事迭代版本(v2-v22)
│   └── drafts/              # 早期草稿和头脑风暴
│
├── res/                     # 媒体资源（图片、音频等）
│
└── CLAUDE.md
```

## 关键设计文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 大纲 | `docs/大纲.md` | 完整故事大纲与四阶段调查结构 |
| 设计 | `docs/设计.md` | 素材设计规格与玩家视角控制 |
| 解密 | `docs/解密.md` | 解密谜题设计与玩家视角递进 |
| 时间线 | `docs/时间线.md` | 2015-2016事件时间参考 |
| 人物 | `docs/人物.md` | 人物背景与关系设定 |
| 素材清单 | `assets/清单.md` | 需要制作的游戏素材列表 |

## 游戏架构设计

### 模拟XP桌面环境

玩家在模拟的Windows XP界面中操作，可访问:

- 文件管理器（含加密压缩包、照片、文档）
- 模拟浏览器访问:
  - QQ空间（说说、照片、评论、加密日志）
  - 县城贴吧论坛存档（含已删帖残留）
  - 学校官网历史快照
  - 163/QQ邮箱界面
- 聊天记录查看器（群聊和私聊导出文件）

### 核心解密机制

- 摄影参数密码（曝光三角: 光圈-快门-ISO）
- 生日日期密码
- 双时间线结构（2015-2016过去事件，2026现在调查）
- 跨平台证据综合分析
- EXIF元数据和时间戳取证

## 内容说明

- 所有叙事内容为中文
- 故事探讨体制性腐败、校园霸凌、系统性沉默等主题
- 人物使用象征性命名（林晓宇 = "沉默的记录者"，陈默 = "山"，夏灯 = "灯火"）
- 玩家视角: 2026年的夏灯，父亲去世后通过父亲遗留的XP电脑，开始调查2015-2016年的真相

## 核心叙事设计原则

### 社会派推理结构

游戏采用**四阶段玩家视角递进**，从个体悬疑逐步升华到系统揭露：

```
阶段一：个体悬疑 (60分钟)
├─ 玩家问题：林晓宇是怎么死的？
├─ 情感状态：怀旧、困惑
└─ 认知层次：意外坠亡 → 林发现了什么？

阶段二：证据指向 (70分钟)
├─ 玩家问题：陈默是凶手吗？
├─ 情感状态：愤怒、背叛
└─ 认知层次：陈默至少是共犯

阶段三：真相反转 (50分钟)
├─ 玩家问题：为什么会这样？
├─ 情感状态：震撼、理解
└─ 认知层次：陈默也是受害者

阶段四：系统揭露 (40分钟)
├─ 玩家问题：这背后是什么？
├─ 情感状态：沉重、反思
└─ 认知层次：系统性腐败
```

### 信息隐藏原则

**关键设计**：玩家不应在前期知道"这是高考移民案"

| 阶段 | 展示 | 隐藏 |
|-----|------|------|
| 阶段一 | 模糊的"交易"、陈默可疑 | 高考移民、15人、产业链、受害者 |
| 阶段二 | 陈默技术操作、现场证据 | 陈默动机、完整短信、受害者故事 |
| 阶段三 | 陈默动机、完整短信、真相 | 产业链规模、保护伞系统 |
| 阶段四 | 完整产业链、受害者故事、社会议题 | 全部揭示 |

### 红鲱鱼系统

核心误导：**陈默=凶手**

通过8条证据链（技术操作记录、现场眼镜、断章取义短信、林晓宇最后私聊等）让玩家相信陈默至少是共犯，然后在阶段三通过林晓宇日志、完整短信、陈默证词彻底推翻这一认知。

## 开发指南

1. **阅读顺序**: 大纲.md -> 解密.md -> 设计.md -> 素材清单
2. **素材制作**: 按 `assets/清单.md` 中的列表逐项完成，放入对应子目录
3. **历史参考**: 如需了解设计演变过程，查阅 `archive/` 目录

---

# 技术实现架构

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm test
```

## 技术栈

- **框架**: React 18 + Vite 5
- **样式**: styled-components + xp.css (Windows XP 风格)
- **动画**: Framer Motion
- **窗口交互**: react-draggable + react-resizable
- **测试**: Vitest + Playwright + Testing Library

## 核心架构模式

### Context Providers 层级结构

应用使用 React Context 进行全局状态管理，Provider 嵌套顺序在 `src/main.jsx` 中定义：

```
UserSessionProvider (最外层)
└─ FileSystemProvider
   └─ WindowManagerProvider
      └─ App
         └─ ModalProvider (在 App.jsx 中)
```

### 1. WindowManagerContext（窗口管理上下文）

位置：`src/context/WindowManagerContext.jsx`

管理所有窗口的生命周期和状态：

**窗口对象结构**:

```javascript
{
  id: string,              // 唯一标识符 (Date.now())
  appId: string,           // 应用类型标识
  title: string,           // 窗口标题
  component: ReactElement, // 窗口内容组件
  componentProps: object,  // 组件属性（用于持久化）
  icon: string,           // 图标
  props: object,          // 窗口配置
  isMinimized: boolean,   // 最小化状态
  isMaximized: boolean,   // 最大化状态
  zIndex: number,         // 层级
  width: number,          // 宽度
  height: number,         // 高度
  left: number,           // X坐标
  top: number             // Y坐标
}
```

**持久化机制**:

- 窗口状态自动保存到 `localStorage.getItem('xp_open_windows')`
- 页面刷新后通过 `WindowFactory.jsx` 的 `restoreComponent()` 恢复窗口
- 不保存 `component` 字段（React 元素无法序列化），通过 `appId` 和 `componentProps` 重建

**关键方法**:

- `openWindow(appId, title, component, icon, props)` - 打开新窗口
- `closeWindow(id)` - 关闭窗口
- `focusWindow(id)` - 聚焦窗口（自动提升 z-index）
- `minimizeWindow(id)` - 最小化
- `maximizeWindow(id)` - 最大化切换
- `resizeWindow(id, width, height)` - 调整大小

### 2. FileSystemContext（文件系统上下文）

位置：`src/context/FileSystemContext.jsx`

虚拟文件系统管理：

**文件系统结构**:

- 主结构定义在 `src/data/filesystem.json`
- 回收站内容通过 `import.meta.glob('../data/recycle_bin/*.json', { eager: true })` 动态加载
- 启动时将回收站 JSON 文件合并到文件系统树中

**文件节点属性**:

```javascript
{
  type: "folder" | "file",  // 类型：文件夹或文件
  name: string,             // 显示名称
  icon: string,             // 图标类型
  locked: boolean,          // 是否加密
  password: string,         // 密码（如果加密）
  broken: boolean,          // 是否损坏
  children: object          // 子节点（文件夹）
}
```

**关键方法**:

- `getFile(path)` - 通过路径数组获取文件节点
- `checkAccess(node, passwordInput)` - 验证加密文件夹访问权限

### 3. UserSessionContext（用户会话上下文）

位置：`src/context/UserSessionContext.jsx`

用户认证和会话管理：

- 用户配置从 `src/data/user_config.json` 加载
- 提供 `login(password)` 和 `logout()` 方法
- 管理 `isLoggedIn` 状态和 `user` 对象（姓名、头像）

### 4. ModalContext（模态框上下文）

位置：`src/context/ModalContext.jsx`

管理模态对话框（如密码输入框、确认对话框等）

## 应用组件系统

所有应用组件位于 `src/apps/` 目录：

| 应用 | 文件 | 用途 |
|------|------|------|
| Explorer | `Explorer.jsx` | 文件浏览器，支持路径导航 |
| InternetExplorer | `InternetExplorer.jsx` | 网页浏览器，支持插件系统 |
| TiebaApp | `TiebaApp.jsx` | 贴吧论坛查看器 |
| QQ | `QQ.jsx` | QQ 主界面 |
| QQChat | `QQChat.jsx` | QQ 聊天窗口 |
| QQHistory | `QQHistory.jsx` | QQ 聊天记录查看器 |
| QZone | `QZone.jsx` | QQ 空间查看器 |
| Email | `Email.jsx` | 邮件客户端（Outlook Express 风格） |
| Notepad | `Notepad.jsx` | 记事本，显示文本内容 |
| PhotoViewer | `PhotoViewer.jsx` | 图片查看器 |

### WindowFactory 组件恢复机制

位置：`src/utils/WindowFactory.jsx`

负责从持久化数据恢复 React 组件：

**工作原理**:

1. 从 localStorage 读取窗口数据（不含 component 字段）
2. 根据 `appId` 和 `componentProps` 推断应该创建哪个组件
3. 使用启发式规则匹配组件类型

**关键启发式规则**:

- 有 `initialPath` 属性 → 文件浏览器（Explorer）
- 有 `initialUrl` 属性 → 贴吧应用（TiebaApp）
- 有 `url` 或 `html` 属性 → 网页浏览器（InternetExplorer）
- 有 `content` 属性且无 url/html → 记事本（Notepad）
- 有 `src` 属性 → 图片查看器（PhotoViewer）
- `appId` 包含 "QQ" → QQ 应用
- `appId` 包含 "Tieba" → 贴吧应用
- `appId` 以 "qzone-" 开头 → QQ 空间

## 游戏数据组织

游戏内容以 JSON 文件形式存储在 `src/data/` 目录：

```
src/data/
├── filesystem.json          # 主文件系统结构
├── user_config.json         # 用户凭证和配置
├── time_info.json          # 游戏时间线信息
├── email/                  # 邮件内容
│   ├── inbox/             # 收件箱
│   ├── sent/              # 已发送
│   └── spam/              # 垃圾邮件
├── qq/                    # QQ 聊天记录
├── qzone/                 # QQ 空间内容
│   └── {user_id}/         # 按用户 ID 组织
│       ├── index.json     # 用户信息
│       ├── shuoshuo.json  # 说说
│       ├── blog.json      # 日志
│       └── pictures/      # 相册
├── tieba/                 # 贴吧内容
│   └── {forum_name}/      # 按贴吧名称组织
│       ├── index.json     # 贴吧信息
│       └── tiezi/         # 帖子
│           └── {id}.json  # 按帖子 ID
└── recycle_bin/           # 回收站（动态合并）
    └── index.json
```

### 动态内容加载机制

项目使用 Vite 的 `import.meta.glob` 实现动态内容加载：

**贴吧帖子加载**（位置：`TiebaApp.jsx`）:

```javascript
const tiebaThreads = import.meta.glob('../data/tieba/**/*.json')
```

- 支持按需加载帖子内容
- 添加新帖子只需在对应目录创建 JSON 文件，无需修改代码

**回收站加载**（位置：`FileSystemContext.jsx`）:

```javascript
const recycleBinFiles = import.meta.glob('../data/recycle_bin/*.json', { eager: true })
```

- 启动时立即加载所有回收站文件
- 自动合并到文件系统树的"回收站"节点

## 启动流程

应用启动经过三个阶段（在 `App.jsx` 中管理）：

1. **CHECKING（检查中）** - 初始状态，检查 localStorage 中的启动状态
2. **BOOTING（启动中）** - 显示开机画面组件（首次启动或关机/重启后）
3. **RUNNING（运行中）** - 根据 `isLoggedIn` 显示登录界面或桌面

**启动状态追踪**:

- `localStorage.getItem('xp_first_boot_done')` - 是否完成首次启动
- `localStorage.getItem('xp_power_state')` - 电源状态（shutdown/restart/running）

## 开发实践指南

### 添加新应用

1. 在 `src/apps/` 创建新组件（如 `YourApp.jsx`）
2. 在 `src/utils/WindowFactory.jsx` 的 `restoreComponent()` 中添加恢复逻辑
3. 在桌面图标或文件关联中添加打开入口
4. 确保组件接受 props 以支持窗口恢复

### 添加游戏内容

**贴吧帖子**:

- 在 `src/data/tieba/{贴吧名}/tiezi/{id}.json` 创建帖子文件
- 更新 `src/data/tieba/{贴吧名}/index.json` 中的帖子列表

**QQ 空间**:

- 创建 `src/data/qzone/{用户ID}/` 目录
- 添加 `index.json`（用户信息）、`shuoshuo.json`（说说）、`blog.json`（日志）
- 在 `pictures/` 子目录添加相册内容

**邮件**:

- 在 `src/data/email/{inbox|sent|spam}/` 添加 JSON 文件
- 每个文件代表一封邮件

**文件系统**:

- 编辑 `src/data/filesystem.json` 添加新文件夹或文件
- 支持 `locked` 和 `password` 属性实现加密文件夹
- 支持 `broken` 属性模拟损坏文件

### 调试和开发注意事项

**防调试功能**（位置：`App.jsx`）:

- 应用阻止了 F12、Ctrl+Shift+I/J/C、Ctrl+U 等开发者工具快捷键
- 禁用了右键菜单
- 这是游戏设计的一部分，用于保持沉浸感
- **开发时建议**：可以临时注释掉这些事件监听器以便调试

**localStorage 使用**:

- `xp_open_windows` - 打开的窗口列表
- `xp_first_boot_done` - 首次启动标记
- `xp_power_state` - 电源状态
- 清除 localStorage 可以重置游戏状态

## 组件层次结构

```
main.jsx
└─ UserSessionProvider
   └─ FileSystemProvider
      └─ WindowManagerProvider
         └─ App.jsx
            └─ ModalProvider
               ├─ BootScreen (启动阶段)
               ├─ LoginScreen (未登录)
               └─ Desktop (已登录)
                  ├─ Taskbar
                  ├─ ContextMenu
                  └─ Window[] (动态窗口列表)
                     └─ [应用组件]
```

## 关键架构决策

### 为什么使用 WindowFactory？

由于 React 组件无法直接序列化到 localStorage，WindowFactory 提供了一个映射层，将持久化的 `appId` 和 `componentProps` 转换回 React 组件实例。这使得窗口状态可以在页面刷新后恢复。

### 为什么使用 import.meta.glob？

Vite 的 `import.meta.glob` 允许动态导入文件，这意味着：

- 添加新游戏内容（贴吧帖子、QQ空间等）不需要修改代码
- 支持按需加载，提高性能
- 内容和代码解耦，便于内容创作

### 插件系统

InternetExplorer 组件支持插件系统（如 `tiebaPlugin`），允许扩展浏览器功能以支持特定的游戏内网站。
