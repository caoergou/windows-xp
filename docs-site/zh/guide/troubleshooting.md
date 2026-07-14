---
title: 故障排查
---

# 故障排查

## 安装后屏幕空白

- 确认已导入样式：`import '@caoergou/windows-xp/style.css';`
- 确认容器有非零尺寸。在嵌入模式下，`<WindowsXP mode="embedded" />` 默认不会缩放，如果父容器高度为 0，就什么都看不到。给父容器加 `height`：
  ```jsx
  <div style={{ height: '100vh', width: '100vw' }}>
    <WindowsXP mode="embedded" />
  </div>
  ```

## 刷新后窗口/文件没有保留

- 检查 localStorage 是否可用（某些隐私模式/无痕窗口会禁用）。
- 自定义应用必须在挂载时通过 [`apps` prop](/zh/guide/props) 注册，这样恢复时才能找到它们的 [`restore`](/zh/guide/content#编写你的第一个应用) 函数。
- [`componentProps`](/zh/guide/content#编写你的第一个应用) 必须是 JSON 可序列化的，否则会被丢弃。

## 两个实例互相干扰

给每个实例一个不同的 `storagePrefix`：

```jsx
<WindowsXP storagePrefix="campaign_a_xp_" />
<WindowsXP storagePrefix="campaign_b_xp_" />
```

## 样式冲突

- 确认导入了 `style.css`。
- 组件根节点是 `.windows-xp-root`，portal 使用 `.windows-xp-portal`。作用域样式表不会泄漏出去；如果宿主页面的样式泄漏**进来**，请把宿主样式远离这两个类名。

## 自定义文件系统没有显示

顶层键会直接合并到桌面根目录，不要包在 `"Desktop"` 文件夹里；并且内容类 props 是[挂载时生效](/zh/guide/props)的。

## 自定义应用没有出现在开始菜单

应用必须通过 `apps` prop 注册；如果希望固定到开始菜单，需要在文化包的 `startMenu` 中引用它的 `id`。见[打造你的专属桌面](/zh/guide/content)。

## TypeScript 定义应用时报错

自定义应用的 props 必须是 JSON 可序列化的。不要在 props 里放函数或 React 元素——`defineApp` 会在类型层面强制这一点。

## SSR 报 `window is not defined`

把组件包在 client-only 动态导入里。Next.js 示例：

```tsx
'use client';
import dynamic from 'next/dynamic';

const WindowsXP = dynamic(() => import('@caoergou/windows-xp').then(m => m.WindowsXP), {
  ssr: false,
});
```

详见 [SSR / Next.js](/zh/guide/ssr)。

## 仍然卡住？

如果还有问题，请在 [GitHub 上开 issue](https://github.com/caoergou/windows-xp/issues)。
