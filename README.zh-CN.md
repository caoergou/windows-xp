# Windows XP 模拟器 🖥️

<div align="center">

**将经典的 Windows XP 桌面体验封装为 React 组件**

[![npm version](https://img.shields.io/npm/v/@caoergou/windows-xp.svg)](https://www.npmjs.com/package/@caoergou/windows-xp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

[在线演示](http://eric.run.place/windows-xp/) | [使用文档](USAGE.md) | [报告问题](https://github.com/caoergou/windows-xp/issues)

[English](README.md) | 简体中文

</div>

---

## ✨ 特性

- 🎨 **千禧年美学** - 像素级还原标志性的 Windows XP Luna 主题
- 🪟 **完整窗口管理** - 可拖拽、可调整大小的窗口，支持最小化/最大化/关闭
- 📁 **虚拟文件系统** - 浏览文件夹、打开文件、管理模拟文件系统
- 🌐 **Internet Explorer** - 内置浏览器，支持历史记录和 iframe 渲染
- 📝 **丰富的应用程序** - 记事本、画图、计算器、扫雷、纸牌、媒体播放器等
- 🔐 **完整启动流程** - 真实的启动画面、登录系统和屏幕保护程序
- 💾 **持久化状态** - 窗口和会话状态保存到 localStorage
- 🎵 **XP 音效** - 真实的开机、关机和 UI 音效
- ♻️ **回收站** - 完整的文件删除和恢复功能
- 🖱️ **上下文菜单** - 全界面的右键菜单
- 🌍 **双语支持** - 支持中英文切换
- 🎮 **经典游戏** - 内置扫雷和纸牌游戏

## 📦 安装

```bash
npm install @caoergou/windows-xp
```

## 🚀 快速开始

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  return <WindowsXP />;
}
```

### 默认登录凭据

- **用户名：** `User`
- **密码：** `password`

## 📖 使用方法

### 基础配置

```jsx
<WindowsXP
  username="Admin"
  password="mypassword"
  language="zh"
  skipBoot={false}
  autoLogin={false}
/>
```

### 自定义文件系统

```jsx
const customFS = {
  "Desktop": {
    "type": "folder",
    "name": "Desktop",
    "children": {
      "MyApp.txt": {
        "type": "file",
        "name": "MyApp.txt",
        "app": "Notepad",
        "content": "你好 Windows XP！"
      }
    }
  }
};

<WindowsXP customFileSystem={customFS} />
```

详细使用和 API 参考请查看 [USAGE.md](USAGE.md)。

## 🎨 内置应用程序

- 📝 **记事本** - 文本编辑器
- 🖼️ **图片查看器** - 图像查看器
- 🌐 **Internet Explorer** - 带历史记录的网页浏览器
- 📁 **资源管理器** - 文件管理器
- 🎨 **画图** - 绘图应用
- 🧮 **计算器** - 基础计算器
- 💣 **扫雷** - 经典游戏
- 🃏 **纸牌** - 卡牌游戏
- 🎵 **媒体播放器** - 音频/视频播放器
- ⚙️ **控制面板** - 系统设置
- 💻 **命令提示符** - 终端模拟器

## 🛠️ 技术栈

- **React 18** - 使用 Hooks 的 UI 框架
- **TypeScript 5** - 类型安全开发
- **styled-components** - CSS-in-JS 样式方案
- **xp.css** - Windows XP 主题库
- **Framer Motion** - 流畅动画
- **react-draggable** - 窗口拖拽
- **react-resizable** - 窗口调整大小
- **i18next** - 国际化框架

## 🌐 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 📝 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [xp.css](https://botoxparty.github.io/XP.css/) - Windows XP CSS 框架
- [winXP](https://github.com/ShizukuIchi/winXP) - 灵感来源
- Microsoft - 创造了标志性的 Windows XP

---

<div align="center">
用 ❤️ 和对千禧年代的怀念制作
</div>
