---
title: 键盘快捷键
---

# 键盘快捷键

所有**全局**和**应用内**快捷键都走同一个 keymap。`Mod` 是平台主修饰键——在 Windows/Linux 上是 **Ctrl**，在 macOS 上是 **⌘ Cmd**——所以绑定在 Mac 上无需额外配置就能工作。

| id                          | 默认绑定           | 作用域  | 动作                       |
| --------------------------- | ------------------ | ------- | -------------------------- |
| `startMenu.toggle`          | `Ctrl+Esc`         | global  | 打开开始菜单（Win 键替代） |
| `window.close`              | `Alt+F4`           | global  | 关闭聚焦窗口               |
| `switcher.next`             | `Alt+Tab`          | global  | 应用切换器                 |
| `egg.bsod`                  | `Ctrl+Shift+Alt+B` | global  | 蓝屏彩蛋                   |
| `desktop.selectAll`         | `Mod+A`            | desktop | 全选桌面图标               |
| `desktop.rename`            | `F2`               | desktop | 重命名图标                 |
| `desktop.delete`            | `Delete`           | desktop | 移入回收站                 |
| `desktop.open`              | `Enter`            | desktop | 打开选中项                 |
| `paint.save` / `paint.open` | `Mod+S` / `Mod+O`  | app     | 画图保存 / 打开            |
| `minesweeper.newGame`       | `F2`               | app     | 新游戏                     |

用 `keymap` prop 可以**重映射或禁用**任意快捷键——宿主应用无需 fork 即可回收按键：

```jsx
<WindowsXP
  keymap={{
    'startMenu.toggle': 'Mod+Shift+X', // 重映射
    'window.close': null, // 禁用
  }}
/>
```

`disableGlobalShortcuts` 相当于一次性禁用整个 `global` 作用域：

```jsx
<WindowsXP disableGlobalShortcuts />
```

**可行性说明。**浏览器会保留一些按键（`Ctrl+W`/`T`/`N`、`Ctrl+L`、`F11`）——按下它们可能关闭访问者的标签页或打开新窗口，页面无法阻止。因此这些键没有作为绑定（例如记事本的“新建”只放在菜单里，而不是 `Ctrl+N`）。
