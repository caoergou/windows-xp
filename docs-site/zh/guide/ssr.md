---
title: SSR / Next.js
---

# SSR / Next.js

这个库在模块作用域上是 SSR 安全的（不会在顶层访问 `window` 或存储），但组件本身只能在浏览器端运行——请务必以 client-only 方式渲染。

## Next.js App Router

在根布局里全局导入 CSS（App Router 只允许在根布局导入全局 CSS）：

```tsx
// app/layout.tsx
import '@caoergou/windows-xp/style.css';
```

然后在页面中用动态导入把组件标记为 client-only：

```tsx
// app/xp-page.tsx
'use client';

import dynamic from 'next/dynamic';

const WindowsXP = dynamic(() => import('@caoergou/windows-xp').then(m => m.WindowsXP), {
  ssr: false,
});

export default function XpPage() {
  return <WindowsXP autoLogin skipBoot />;
}
```

## Next.js Pages Router

在 `_app.tsx` 里导入 CSS，并在页面中动态加载组件：

```tsx
// pages/_app.tsx
import '@caoergou/windows-xp/style.css';

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

```tsx
// pages/xp.tsx
import dynamic from 'next/dynamic';

const WindowsXP = dynamic(() => import('@caoergou/windows-xp').then(m => m.WindowsXP), {
  ssr: false,
});

export default function XpPage() {
  return <WindowsXP autoLogin skipBoot />;
}
```

## Vite / 纯 React

不需要 SSR 特殊处理。直接导入 CSS 并渲染组件：

```tsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

export default function App() {
  return <WindowsXP autoLogin skipBoot />;
}
```

## Astro

使用 client-only island，让组件只在浏览器中运行：

```astro
---
// pages/xp.astro
---

<WindowsXP client:only="react" />
```

```tsx
// components/WindowsXP.tsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

export default function WindowsXPEmbed() {
  return <WindowsXP autoLogin skipBoot />;
}
```

## 已验证的消费方式

每次 push 到 `main`，以及标记为 release 的 PR，都会触发 **consumer-smoke** CI 任务：先用 `npm pack` 把包打成 tarball，再在一个干净的 Vite + React 应用里安装、构建，并在真实浏览器中渲染 `<WindowsXP>`。它从包的外部验证：

- `.`、`./components`、`./style.css` 这些导出子路径都能正确解析；
- i18n `init()` 副作用不会被 tree-shaking 误删；
- 重型应用被代码分割出首屏；
- 发布的 `.d.ts` 能同时通过 `@types/react@18` 和 `@19` 的类型检查。

**Next.js** 路径就是上面的 `dynamic(..., { ssr: false })` 包装：consumer-smoke 验证的是同一个 tarball，只是以 client-only 方式加载。如果你遇到 SSR 边界情况，可以以 `scripts/consumer-smoke/` 下的 Vite 示例为起点复现：

```bash
cp -r scripts/consumer-smoke /tmp/my-consumer-test
cd /tmp/my-consumer-test
# 修改 package.json 中的 tarball 路径，然后安装并复现问题
```
