# Windows XP Simulator 🖥️

<div align="center">

**A faithful recreation of the classic Windows XP desktop experience as a React component**

[![npm version](https://img.shields.io/npm/v/@caoergou/windows-xp.svg)](https://www.npmjs.com/package/@caoergou/windows-xp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

[Live Demo](http://eric.run.place/windows-xp/) | [Documentation](USAGE.md) | [Report Bug](https://github.com/caoergou/windows-xp/issues)

English | [简体中文](README.zh-CN.md)

</div>

---

## ✨ Features

- 🎨 **Authentic Y2K Aesthetic** - Pixel-perfect recreation of the iconic Windows XP Luna theme
- 🪟 **Full Window Management** - Draggable, resizable windows with minimize/maximize/close
- 📁 **Virtual File System** - Browse folders, open files, and manage a simulated filesystem
- 🌐 **Internet Explorer** - Built-in browser with history and iframe rendering
- 📝 **Rich Applications** - Notepad, Paint, Calculator, Minesweeper, Solitaire, Media Player, and more
- 🔐 **Complete Boot Flow** - Authentic boot screen, login system, and screensaver
- 💾 **Persistent State** - Windows and session state saved to localStorage
- 🎵 **XP Sounds** - Authentic startup, shutdown, and UI sound effects
- ♻️ **Recycle Bin** - Delete and restore files with full functionality
- 🖱️ **Context Menus** - Right-click menus throughout the interface
- 🌍 **Bilingual Support** - English and Chinese language support
- 🎮 **Classic Games** - Minesweeper and Solitaire included

## 📦 Installation

```bash
npm install @caoergou/windows-xp
```

## 🚀 Quick Start

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  return <WindowsXP />;
}
```

### Default Login Credentials

- **Username:** `User`
- **Password:** `password`

## 📖 Usage

### Basic Configuration

```jsx
<WindowsXP
  username="Admin"
  password="mypassword"
  language="en"
  skipBoot={false}
  autoLogin={false}
/>
```

### Custom File System

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
        "content": "Hello Windows XP!"
      }
    }
  }
};

<WindowsXP customFileSystem={customFS} />
```

For detailed usage and API reference, see [USAGE.md](USAGE.md).

## 🎨 Built-in Applications

- 📝 **Notepad** - Text editor
- 🖼️ **Photo Viewer** - Image viewer
- 🌐 **Internet Explorer** - Web browser with history
- 📁 **Explorer** - File manager
- 🎨 **Paint** - Drawing application
- 🧮 **Calculator** - Basic calculator
- 💣 **Minesweeper** - Classic game
- 🃏 **Solitaire** - Card game
- 🎵 **Media Player** - Audio/video player
- ⚙️ **Control Panel** - System settings
- 💻 **Command Prompt** - Terminal emulator

## 🛠️ Tech Stack

- **React 18** - UI framework with hooks
- **TypeScript 5** - Type-safe development
- **styled-components** - CSS-in-JS styling solution
- **xp.css** - Windows XP theme library
- **Framer Motion** - Smooth animations
- **react-draggable** - Window dragging
- **react-resizable** - Window resizing
- **i18next** - Internationalization

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [xp.css](https://botoxparty.github.io/XP.css/) - Windows XP CSS framework
- [winXP](https://github.com/ShizukuIchi/winXP) - Inspiration
- Microsoft - For creating the iconic Windows XP

---

<div align="center">
Made with ❤️ and nostalgia for the millennium era
</div>
