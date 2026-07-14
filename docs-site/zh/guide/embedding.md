---
title: 嵌入宿主应用
---

# 嵌入宿主应用

把组件放进一个有尺寸的容器里，并开启 `mode="embedded"`，这样它就不会劫持宿主页面：

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

export default function HostPage() {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <WindowsXP mode="embedded" storagePrefix="myapp_xp_" />
    </div>
  );
}
```

- **`mode="embedded"`** 一键关闭所有全局拦截（右键拦截、开发者工具拦截、Alt+F4/Alt+Tab、闲置屏保）。单个 `disable*` prop 可覆盖该模式默认值，例如 `mode="embedded" disableScreenSaver={false}` 会保留屏保。
- **样式不会泄漏。** 构建时所有 xp.css 规则都会被重写到 `:where(.windows-xp-root, .windows-xp-portal)` 之下——引入 `style.css` 不会重新设置宿主页面 body、按钮或表单控件的样式。
- **存储按实例隔离。** 每个 `<WindowsXP/>` 实例都会获得独立的存储句柄，并通过 `storagePrefix` 命名空间化（独立的 localStorage 键 + 独立的 IndexedDB 连接）。同一页面上两个不同前缀的实例会保持完全独立的文件系统、窗口和登录状态。
- **i18n 是隔离的。** 库使用自己的 i18next 实例，从不会初始化全局单例，因此不会与宿主应用的 i18next 配置冲突。

## 持久化模式

持久化按实例可选——因为营销活动页希望每位访客都从干净状态开始，而游戏则需要保存进度：

```jsx
<WindowsXP persistence="none" /> // 每次挂载都保持初始状态（营销活动、博客、沙盒）
```

| 模式                 | 元数据（窗口、文件系统树、壁纸） | 文件内容  | 存活范围                             |
| -------------------- | -------------------------------- | --------- | ------------------------------------ |
| `'local'` _（默认）_ | localStorage                     | IndexedDB | 跨访问保留                           |
| `'session'`          | sessionStorage                   | 内存中    | 标签页内刷新保留；关闭后清除         |
| `'none'`             | 内存中                           | 内存中    | 不保留任何内容——每次挂载都是初始状态 |

- `'none'` **不会打开 IndexedDB**，因此在共享或 kiosk 设备上不留痕迹，连续两次挂载会渲染出完全相同的桌面，不受前一位访客操作影响。
- `customFileSystem`、文化包和 `openOnLoad` 在**每次**挂载时仍然生效——只有*用户产生*的更改才会被保留（或不保留）。
- `getSnapshot()` 在所有模式下都可用，因此访客仍然可以从原本短暂的 `'none'` 或 `'session'` 桌面导出（"保存你的玩具"）。
- 在 `'session'`/`'none'` 模式下，刷新后恢复窗口不会执行任何操作——这是预期行为。

## 营销活动品牌化

在营销或个人品牌部署中，启动和登录屏幕就是开场画面。使用 `boot` 和 `login` prop 组为它们换肤——在保持 XP 流程形态的前提下，可传入图片 URL、字符串和 CSS 值。默认仍是像素级还原 XP；一旦为某个屏幕设置了**任意**字段，就会压制该屏幕上剩余的微软商标（不会出现品牌元素和 XP 原生元素混在一起的拼凑界面）：

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

const campaignFiles = {
  'Teaser.txt': {
    type: 'file',
    name: 'Teaser.txt',
    app: 'Notepad',
    content: 'Welcome to ACME 2000.',
  },
};

<WindowsXP
  // 整个桌面都是你的（没有内置快捷方式），每位访客都从干净状态开始……
  fileSystemMode="replace"
  persistence="none"
  customFileSystem={campaignFiles}
  openOnLoad="Teaser.txt" // 直接打开核心内容
  // ……前五秒是品牌定制画面：
  boot={{
    logo: '/brand/logo.png',
    text: 'ACME 2000',
    progressColor: '#ff6600',
    startupSound: '/brand/chime.mp3',
  }}
  login={{
    title: 'ACME Portal',
    background: '/brand/login-bg.jpg',
    userTile: '/brand/tile.png',
    userName: 'Guest',
  }}
/>;
```

- `login.userTile` / `login.userName` 扩展了顶层 `avatar` / `username` prop——任一组均可设置；在登录屏幕上 `login` 组优先级更高。
- `boot.startupSound` 会替代 XP 启动音效播放，并遵循音量/静音管线；`boot.progressColor` 会将 XP 加载 GIF 替换为品牌进度条。
- 关机和蓝屏文字保持 XP 风格（蓝屏文案属于场景动作，而非品牌元素）。

结合 `fileSystemMode="replace"`、`persistence="none"`（如上）以及[深度链接](./events#永久链接与分享链接)，即可仅通过 props 实现"启动 → 登录 → 桌面"流程，且不含任何微软品牌标识——无需 fork，无需改动 CSS。

## 小屏与移动端

外壳以 **1024×768 为基准**开发。我们不会在手机上重排它（XP 没有竖屏形态——重排会破坏模拟效果），而是让整个桌面**缩放适配**，并以黑边填充。元素位置不变，只是整体变小，并且所有触控手势仍然可以驱动它。

通过 `viewportPolicy` prop 控制：

| 取值                         | 行为                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `'auto'` — `fullscreen` 默认 | 在 ≥ 基准分辨率时原生显示；当容器宽度小于 1024px 时缩放适配。桌面本身不变；手机会获得完整桌面。 |
| `'native'` — `embedded` 默认 | 永不缩放——由宿主控制嵌入桌面的大小。                                                            |
| `'scale'`                    | 始终将基准分辨率适配到容器（即使在桌面端）。                                                    |
| `'warn'`                     | 永不缩放；显示移动端提示。                                                                      |

### 常见视口下的推荐方案

| 视口                           | 方案                                                 |
| ------------------------------ | ---------------------------------------------------- |
| ≥ 1024×768（桌面、平板横屏）   | 原生显示，不做改动。                                 |
| 横屏手机（812×375、667×375）   | 缩放适配——完整桌面，触控体验舒适。                   |
| 竖屏手机（375×667、iPhone SE） | 缩放适配（约 0.37×）**并**提示"旋转以获得更大画面"。 |
| 嵌入模式                       | 按宿主容器缩放，而非按窗口缩放（默认 `'native'`）。  |

```jsx
// 让嵌入桌面在手机上也缩放适配：
<WindowsXP mode="embedded" viewportPolicy="auto" />
```
