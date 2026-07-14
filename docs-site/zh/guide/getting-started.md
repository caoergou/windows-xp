---
title: 安装与快速开始
---

# 安装

在一个已有的 React 18/19 项目里（Vite、Next.js、Create React App 等）：

```bash
npm install @caoergou/windows-xp react react-dom styled-components
```

`react`、`react-dom`、`styled-components`（v6）是对等依赖。其余实现细节
（`react-draggable`、`react-resizable`、`i18next`、`react-i18next`、`immer`）
都是普通依赖，会自动安装；XP 主题样式已编译进 `style.css`，无需额外安装。

## 快速开始

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  // 开发时 autoLogin 和 skipBoot 直接跳到桌面；去掉它们可看到开机和登录。
  return <WindowsXP autoLogin skipBoot />;
}
```

不加 `autoLogin`/`skipBoot` 就是完整体验：开机画面 → 登录（默认用户 `User`，
密码 `forthe2000s`）→ 桌面。

::: tip 继续学习
建议按这个顺序阅读：

1. [Props 参考](/zh/guide/props) — `<WindowsXP>` 全部 props 与默认值。
2. [打造你的专属桌面](/zh/guide/content) — 自定义文件、壁纸、文化包。
3. [事件与命令式控制](/zh/guide/events) — 监听用户操作并用 `ref` 驱动桌面。
4. [场景系统](/zh/guide/scenarios) — 用 JSON 让桌面响应玩家。
5. [嵌入宿主应用](/zh/guide/embedding) — 把桌面嵌入到宿主页面。

核心 API 参考已提供[中文文档](/zh/api/)，完整 TypeDoc 仍可在英文站点阅读。
:::
