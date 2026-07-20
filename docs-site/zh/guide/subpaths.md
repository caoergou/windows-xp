---
title: 子路径导入与基础组件
---

# 子路径导入与基础组件

为了更小的包体积，只导入你需要的内容：

```jsx
// 完整桌面（最大包）
import { WindowsXP } from '@caoergou/windows-xp';

// 单个应用
import { Minesweeper } from '@caoergou/windows-xp/apps';

// 系统组件 —— 必须渲染在桌面 provider 内部
import { Window, Desktop, Taskbar } from '@caoergou/windows-xp/components';

// 独立 UI 基础组件 —— 无需 provider
import { XPButton, XPDialog, XPIcon } from '@caoergou/windows-xp/components';

// Hooks 和 providers
import {
  useWindowManager,
  useFileSystem,
  useAppRegistry,
  useCulture,
} from '@caoergou/windows-xp/hooks';

// 主题 token
import { COLORS, xpButtonStyles, xpScrollbarStyles } from '@caoergou/windows-xp/theme';

// 应用注册表辅助函数
import { APP_REGISTRY, resolveFileOpen, getAppDisplayName } from '@caoergou/windows-xp/registry';

// 可选的 .xpspack 验证与加载入口（不会进入默认 bundle）
import { loadContentPackFromXpspack } from '@caoergou/windows-xp/content-pack-loader';
```

ContentPack loader 会先验证受限 ZIP 容器、规范化 manifest、SHA-256 payload
摘要、独立存储的二进制资产以及可选的宿主可信 Ed25519 签名，再返回
`ContentPack`。验证后的资产会恢复为保留媒体类型的 `data:` URL。浏览器中原生
支持未压缩和 gzip chunk；宿主没有通过 Compression Streams API 暴露 Brotli
时，可通过 `decompress` 回调提供 Brotli 解压能力。
加密章节通过 `loadChunk(id)` 懒加载，仅在此时通过宿主拥有的 `keyProvider`
请求不可导出的 AES-GCM 密钥；loader 不会持久化该密钥。

> `Window`、`Taskbar`、`Desktop` 和上面的 hooks 都连接着桌面的 context，必须渲染在根入口导出的 providers 内部（或 `AppProviders` 内）。下方的 `XP*` 基础组件什么都不需要。

## Provider 内的系统组件

大多数用户直接渲染 `<WindowsXP>`，会自动获得完整的 provider 树。如果你要构建自定义外壳，可以导入 `AppProviders` 并在里面渲染系统组件：

```jsx
import { AppProviders } from '@caoergou/windows-xp';
import { Desktop, Taskbar, Window } from '@caoergou/windows-xp/components';
import '@caoergou/windows-xp/style.css';

function CustomShell() {
  return (
    <AppProviders>
      <Desktop />
      <Window id="my-window" appId="Notepad" title="Notepad" />
      <Taskbar />
    </AppProviders>
  );
}
```

## 独立 UI 基础组件（无需 provider）

`@caoergou/windows-xp/components` 提供**零依赖的基础组件**，可以随处拖放——不需要 `<WindowsXP>`，也不需要 provider——用来构建 XP 风格的 UI（类似 [xp.css](https://botoxparty.github.io/XP.css/)，但是是受控的 React 组件，逐像素匹配 xp.css 规范）：

- `XPButton`
- `XPTextInput`
- `XPCheckbox`
- `XPRadio`
- `XPSelect`
- `XPProgressBar`
- `XPTooltip`
- `XPGroupBox`
- `XPStatusBar`（+ `XPStatusBarField`）
- `XPTabs`
- `XPMenuBar`（+ `XPMenuBarItem`、`XPMenuDropdown`、`XPMenuDropdownItem`、`XPMenuMark`、`XPMenuSeparator`、`XPMenuSlot`）
- `XPIcon`
- `XPDialog`

```jsx
import { XPDialog, XPButton } from '@caoergou/windows-xp/components';
import '@caoergou/windows-xp/style.css';

// 一个经典的 XP 消息框 —— 不需要 provider。
function SaveDialog({ onSave, onDiscard, onCancel }) {
  return (
    <XPDialog
      title="Notepad"
      icon="alert_warning"
      modal
      onClose={onCancel}
      footer={
        <>
          <XPButton onClick={onSave}>Yes</XPButton>
          <XPButton onClick={onDiscard}>No</XPButton>
          <XPButton onClick={onCancel}>Cancel</XPButton>
        </>
      }
    >
      The text in the Untitled file has changed. Do you want to save the changes?
    </XPDialog>
  );
}
```

```jsx
import {
  XPGroupBox,
  XPCheckbox,
  XPTabs,
  XPProgressBar,
  XPStatusBar,
  XPStatusBarField,
} from '@caoergou/windows-xp/components';
```

在独立的[组件画廊](/windows-xp/gallery/)可以看到每个基础组件单独渲染的效果。
