# Windows XP Simulator 🖥️

<div align="center">

**A love letter to the 2000s internet — recreated as a React component**

[![npm version](https://img.shields.io/npm/v/@caoergou/windows-xp.svg)](https://www.npmjs.com/package/@caoergou/windows-xp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

[Live Demo](https://eric.run.place/windows-xp/) | [Documentation](USAGE.md) | [Report Bug](https://github.com/caoergou/windows-xp/issues)

English | [简体中文](README.zh-CN.md)

</div>

---

## 🕰️ A Tribute to the 2000s Internet

Remember the sound of a dial-up modem connecting? The thrill of opening MSN Messenger, the bliss of a clean Luna desktop wallpaper, the hours lost to Minesweeper and Solitaire?

This project is a nostalgic tribute to that era — the early 2000s internet, when the web felt new, personal homepages were everywhere, and Windows XP was the backdrop to countless memories. Whether you grew up with it or just want to experience what it felt like, this component brings that world back to life in the browser.

> **Disclaimer:** This project is an independent, fan-made recreation built purely for nostalgic and educational purposes. It is not affiliated with, endorsed by, or in any way connected to Microsoft Corporation or the Windows operating system. All trademarks belong to their respective owners.

---

## ✨ Features

- 🎨 **Authentic Y2K Aesthetic** - Pixel-perfect recreation of the iconic Windows XP Luna theme
- 🪟 **Full Window Management** - Draggable, resizable windows with minimize/maximize/close
- 📁 **Virtual File System** - Browse folders, open files, and manage a simulated filesystem
- 🌐 **Internet Explorer** - Built-in browser with history and iframe rendering
- 📝 **Rich Applications** - Notepad, Paint, Calculator, Minesweeper, Solitaire, Media Player, and more
- ❓ **Help and Support Center** - Built-in help documentation with multiple topics
- 🔐 **Complete Boot Flow** - Authentic boot screen, login system, and screensaver
- 💾 **Persistent State** - Windows and session state saved to localStorage
- 🎵 **XP Sounds** - Authentic startup, shutdown, and UI sound effects via Web Audio API
- ♻️ **Recycle Bin** - Delete and restore files with full functionality
- 🖱️ **Context Menus** - Right-click menus throughout the interface
- 🌍 **Culture Profiles** - English and Chinese use distinct desktops, Start menus, browser homepages, and application sets
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

- **Live Demo**: https://eric.run.place/windows-xp/
  - Username: `User`
  - Password: `forthe2000s`

- **Using as a Component**: Customize via props
  ```jsx
  <WindowsXP username="Admin" password="yourpassword" />
  ```

## 📖 Usage

### Basic Configuration

```jsx
<WindowsXP
  username="Admin"
  password="mypassword"
  language="en"
  skipBoot={false}
  autoLogin={false}
  storagePrefix="xp_"
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

## 📦 Package Exports

Besides the main `WindowsXP` component, the package exposes focused subpath imports so you can build your own XP-style UI:

```jsx
// Main bundled experience
import { WindowsXP } from '@caoergou/windows-xp';

// Pick only what you need
import { Button, Window, Taskbar } from '@caoergou/windows-xp/components';
import { Notepad, Minesweeper } from '@caoergou/windows-xp/apps';
import { useWindowManager, useFileSystem, useApp, useCulture, useAppRegistry } from '@caoergou/windows-xp/hooks';
import { xpScrollbarStyles } from '@caoergou/windows-xp/theme';
import { APP_REGISTRY } from '@caoergou/windows-xp/registry';
```

You can also extend the simulator with custom [culture packages](USAGE.md#custom-culture-packages) and [applications](USAGE.md#custom-applications).

## 🎨 Built-in Applications

### Fully Implemented
- 📝 **Notepad** - Text editor with file support
- 🖼️ **Photo Viewer** - Image viewer
- 🌐 **Internet Explorer** - Web browser with history and hao123 portal
- 📁 **Explorer** - File manager with navigation
- 🧮 **Calculator** - Basic calculator
- 💬 **QQ Login** - QQ login dialog
- ❓ **Help and Support** - Help center
- 🏃 **Run Dialog** - Run command dialog with common XP commands
- 🔊 **Volume Control** - Volume settings

### Playable / Working Core
- 💣 **Minesweeper** - Classic game with difficulty menu, real XP sprites, and best-time tracking per difficulty

### Partial Functionality
- 🎨 **Paint** - Brush, line, rectangle, circle drawing; save/load and advanced tools coming soon
- 📝 **Notepad** - Edit/save works; Undo, Find/Replace, Word Wrap, Font are stubbed
- 💻 **Command Prompt** - Basic commands work; `exit` closes the window
- 🃏 **Solitaire** - Card UI rendered; move logic and win detection not yet implemented

### Basic UI (Limited Functionality)
- 🎵 **Windows Media Player** - Media player UI with visualizations, no audio playback yet
- ⚙️ **Control Panel** - System settings UI, applets not yet functional
- 🖧 **Network Connections** - Network status UI

## 🛠️ Tech Stack

- **React 18** - UI framework with hooks
- **TypeScript 5** - Type-safe development
- **styled-components** - CSS-in-JS styling solution
- **xp.css** - Windows XP theme library
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

- [xp.css](https://botoxparty.github.io/XP.css/) - Windows XP CSS framework and bundled retro fonts
- [winXP](https://github.com/ShizukuIchi/winXP) - Inspiration
- Microsoft - For creating the iconic Windows XP

### Asset Sources

This project uses assets extracted or derived from original Windows XP media and community preservation efforts **for educational and nostalgic purposes only**.

- **System icons** - Based on the [XPIcons/XP](https://github.com/iconicX/XPIcons) collection and [react-xp](https://github.com/zyishai/react-xp), which preserve Windows XP shell icons at 48×48 and larger sizes.
- **Wallpapers** - Official Windows XP default wallpapers (Bliss, Luna, etc.) and high-resolution community scans.
- **Cursors** - Real Windows XP `.cur` / `.ani` cursor files and hand-redrawn SVG/PNG equivalents based on the XP pointer set.
- **Sounds** - Original Windows XP WAV event sounds (startup, error, click, notify, etc.).
- **Fonts** - `"Pixelated MS Sans Serif"` and `"Perfect DOS VGA 437 Win"` from the xp.css distribution; fallback to Tahoma and Microsoft YaHei / SimSun for CJK text.
- **Minesweeper sprites** - Extracted from the Windows XP Minesweeper game files.
- **Boot screen palette & animation behavior** - Referenced from [PlymouthXP](https://github.com/nulln/PlymouthXP) for the authentic Windows XP boot-screen color palette and progress-bar timing.

All trademarks, icon designs, sound recordings, wallpapers, and sprite artwork remain the property of their respective owners. These assets are not covered by the project MIT license and are included solely to recreate the authentic Windows XP experience.


<div align="center">
Made with &#10084;&#65039; and nostalgia for the millennium era
</div>
