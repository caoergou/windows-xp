---
title: 性能
---

# 性能

## 选择正确的入口

只导入你需要的内容。完整桌面会打包所有应用；如果只需要更小的体积，使用子路径导入：

```jsx
// 完整桌面 —— 最大包
import { WindowsXP } from '@caoergou/windows-xp';

// 单个应用，不带桌面外壳
import { Minesweeper } from '@caoergou/windows-xp/apps';

// 独立 UI 基础组件
import { XPButton, XPDialog } from '@caoergou/windows-xp/components';
```

完整列表见[子路径导入与基础组件](/zh/guide/subpaths)。

## 最快的嵌入启动

要让桌面最快出现，可以跳过开机和登录：

```jsx
<WindowsXP skipBoot autoLogin username="Guest" />
```

如果也不需要持久化，设置 `persistence="none"`，这样每次挂载都从干净状态开始：

```jsx
<WindowsXP skipBoot autoLogin persistence="none" />
```

## 包体积

应用默认懒加载；完整桌面入口的发布包约 3 MB（未 gzip），最大 chunk 约 0.4 MB。通过上面的子路径入口引入重型应用，可以保持代码分割，而不是重新打包它们的源码。
