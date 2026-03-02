# Windows XP 模拟器 🖥️

<div align="center">

![Windows XP Logo](public/icons/xp-logo.png)

**在浏览器中忠实重现经典的 Windows XP 桌面体验**

[在线演示](http://eric.run.place/windows-xp/) | [报告问题](https://github.com/caoergou/windows-xp/issues) | [功能建议](https://github.com/caoergou/windows-xp/issues)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.21-646CFF.svg)](https://vitejs.dev/)

[English](README.md) | 简体中文

</div>

---

## ✨ 特性

- 🎨 **千禧年美学** - 像素级还原标志性的 Windows XP Luna 主题
- 🪟 **完整窗口管理** - 可拖拽、可调整大小的窗口，支持最小化/最大化/关闭
- 📁 **虚拟文件系统** - 浏览文件夹、打开文件、管理模拟文件系统
- 🌐 **Internet Explorer** - 内置浏览器，支持历史记录和 iframe 渲染
- 📝 **经典应用程序** - 记事本、图片查看器、资源管理器等
- 🔐 **登录系统** - 完整的启动序列和用户认证流程
- 💾 **持久化状态** - 窗口和会话状态保存到 localStorage
- 🎵 **XP 音效** - 真实的开机、关机和 UI 音效
- ♻️ **回收站** - 删除和恢复文件
- 🖱️ **右键菜单** - 全界面的上下文菜单

## 🎯 项目意义

重温千禧年代的怀旧情怀！本项目捕捉了 Windows XP 的精髓——这个定义了整整一代人计算体验的操作系统。适用于：

- 🕰️ **怀旧爱好者** - 怀念计算机时代的简单美好
- 🎨 **设计师** - 探索千禧年和复古美学
- 🎓 **教育工作者** - 教授 UI/UX 历史
- 🎮 **游戏开发者** - 需要复古操作系统界面
- 💻 **开发者** - 学习 React 和复杂状态管理

## 🚀 快速开始

### 前置要求

- Node.js 18+ 和 npm

### 安装

```bash
# 克隆仓库
git clone https://github.com/caoergou/windows-xp.git
cd windows-xp

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 即可看到模拟器运行！

### 默认登录凭据

- **用户名：** `User`
- **密码：** `password`

## 📦 作为 npm 组件使用

安装包：

```bash
npm install @caoergou/windows-xp
```

在 React 应用中使用：

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  return <WindowsXP />;
}
```

详细使用和自定义选项请参阅 [USAGE.md](USAGE.md)。
```

## 🏗️ 项目结构

```
windows-xp/
├── src/
│   ├── apps/              # 应用程序组件
│   │   ├── Explorer.jsx
│   │   ├── InternetExplorer.jsx
│   │   ├── Notepad.jsx
│   │   └── PhotoViewer.jsx
│   ├── components/        # UI 组件
│   │   ├── Desktop.jsx
│   │   ├── Taskbar.jsx
│   │   ├── StartMenu.jsx
│   │   └── Window.jsx
│   ├── context/           # React Context 提供者
│   │   ├── FileSystemContext.jsx
│   │   ├── WindowManagerContext.jsx
│   │   └── UserSessionContext.jsx
│   ├── data/              # 静态数据和配置
│   │   ├── filesystem.json
│   │   ├── user_config.json
│   │   └── recycle_bin/
│   └── utils/             # 辅助函数
├── public/                # 静态资源
└── CLAUDE.md             # 开发指南
```

## 🛠️ 技术栈

- **React 18** - UI 框架
- **Vite 5** - 构建工具和开发服务器
- **styled-components** - CSS-in-JS 样式方案
- **xp.css** - Windows XP 主题库
- **Framer Motion** - 流畅动画
- **react-draggable** - 窗口拖拽
- **react-resizable** - 窗口调整大小

## 🎨 自定义

### 添加新文件

编辑 `src/data/filesystem.json`：

```json
{
  "MyFile.txt": {
    "type": "file",
    "name": "MyFile.txt",
    "app": "Notepad",
    "content": "你的内容"
  }
}
```

### 创建新应用程序

1. 在 `src/apps/YourApp.jsx` 创建组件
2. 在 `src/utils/WindowFactory.jsx` 注册
3. 在 `filesystem.json` 添加文件关联

详细开发指南请参阅 [CLAUDE.md](CLAUDE.md)。

## 🌐 部署

本项目已配置 GitHub Pages 部署：

```bash
npm run build
# 推送到 main 分支后通过 GitHub Actions 自动部署
```

## 📸 截图

*（在此添加截图）*

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [xp.css](https://botoxparty.github.io/XP.css/) - Windows XP CSS 框架
- Microsoft - 创造了标志性的 Windows XP
- 开源社区

## 📧 联系方式

项目链接：[https://github.com/caoergou/windows-xp](https://github.com/caoergou/windows-xp)

---

<div align="center">
用 ❤️ 和对千禧年代的怀念制作
</div>
