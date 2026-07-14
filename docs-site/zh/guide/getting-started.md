---
title: 安装与快速开始
---

# 安装

```bash
npm install @caoergou/windows-xp
```

对等依赖（peer dependencies）：`react`（18 或 19）、`react-dom`、
`styled-components`（v6）——基本上你已经装好了。其余实现细节
（`react-draggable`、`react-resizable`、`i18next`、`react-i18next`、`immer`）
都是普通依赖，会自动安装；XP 主题样式已编译进 `style.css`，无需额外安装。

## 快速开始

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  return <WindowsXP autoLogin skipBoot />;
}
```

不加 `autoLogin`/`skipBoot` 就是完整体验：开机画面 → 登录（默认用户 `User`，
密码 `forthe2000s`）→ 桌面。

::: tip 更多内容
中文文档：[打造你的专属桌面](/zh/guide/content)、[在桌面上搭建博客](/zh/guide/blog)。
英文文档更完整：[Props 参考](/guide/props)、
[事件与命令式控制](/guide/events)、[嵌入宿主应用](/guide/embedding)。中文页面正逐页迁移中。
:::
