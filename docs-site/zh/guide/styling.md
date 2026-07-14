---
title: 样式定制
---

# 样式定制

## 作用域 CSS

样式表被完整限定在 `.windows-xp-root` 之下（见[嵌入](./embedding)）。如果需要在支持范围之外做定制，请从宿主上下文中针对这些有作用域的类名写样式：

```css
.my-page-wrapper .windows-xp-root .taskbar {
  /* 这里的覆盖只影响这个实例 */
}
```

始终把覆盖限定在宿主上下文中；不要写全局选择器。

## 推荐扩展点

在伸手改 CSS 类名之前，优先使用这些支持的扩展点：

- **壁纸** —— 传入自定义壁纸组件或图片 URL：
  ```jsx
  <WindowsXP
    wallpapers={[{ id: 'brand', name: 'Brand', src: '/brand-wallpaper.jpg' }]}
    defaultWallpaper="brand"
  />
  ```
- **文化包** —— 用区域特定的图标、音效和文案替换内容，无需碰 CSS。见[打造你的专属桌面](./content#文化包)。
- **主题 token** —— 从 `@caoergou/windows-xp/theme` 导入 `COLORS`、`xpButtonStyles`、`xpScrollbarStyles`、`xpTitleBarStyles`、`WINDOW_DEFAULTS`、`DESKTOP_DEFAULTS` 等：
  ```jsx
  import { COLORS } from '@caoergou/windows-xp/theme';
  console.log(COLORS.DIALOG_BLUE); // '#2267CB'
  ```

这些扩展点在语义化版本范围内可安全依赖；跨 major 版本请查看迁移指南。

## 类名警告

作用域类名（`taskbar`、`window`、`xp-button` 等）是内部实现细节，可能在任何 minor 版本中变化。如果必须使用它们，请固定包版本并把升级视为破坏性变更。一个正式的公开主题层正在规划中。

## Portal 与弹出层

部分 UI（菜单、工具提示、对话框、拖拽预览）可能通过 portal 渲染到 `.windows-xp-root` 之外的 `.windows-xp-portal` 容器中。如果需要给它们写样式，请针对这个 portal 容器，而不是全局选择器：

```css
.my-page-wrapper .windows-xp-portal .xp-menu {
  /* 只影响这个桌面实例的弹出菜单 */
}
```

Portal 标记共享同样的前缀类名命名空间，并且被限定在嵌入实例内。
