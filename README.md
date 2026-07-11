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

### It's an engine, not just a screenshot

Beyond the desktop, `<WindowsXP>` is built to be embedded, scripted and extended:

- 📡 **Event stream** — subscribe to everything happening inside the desktop with `onEvent` (`app:launch`, `file:open`, `cmd:exec`, `session:*`, …), the foundation for analytics, guided demos and the scenario system
- 🎛️ **Imperative control** — drive the desktop from your app via a `ref` (`XPHandle`: `openApp`, `openFile`, `closeWindow`, `showAlert`, `reset`)
- 🧩 **Embeddable** — `mode="embedded"` disables host-page hijacking (right-click/devtools blocks, global shortcuts, screensaver) in one switch; styles are scoped so nothing leaks onto your page
- 🗂️ **Replaceable content** — bring your own filesystem (`customFileSystem` + `fileSystemMode`), wallpapers (`wallpapers`/`defaultWallpaper`), login `avatar`, `cultures` and `apps`
- 🧱 **Standalone primitives** — import XP-styled React components (`XPButton`, `XPDialog`, `XPTabs`, …) with no providers, like xp.css but as controlled components

## 📦 Installation

```bash
npm install @caoergou/windows-xp
```

Peer dependencies: `react` (18 or 19), `react-dom`, `styled-components` v6 — everything else is installed automatically.

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

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `username` | `string` | `'User'` | Username shown on the login screen |
| `password` | `string` | `'forthe2000s'` | Password for authentication |
| `language` | `string` | `'en'` | Initial language (`'en'` or `'zh'`, or a custom culture locale) |
| `customFileSystem` | `Record<string, FileNode>` | `null` | Files/folders to seed the desktop (see below) |
| `fileSystemMode` | `'merge' \| 'replace'` | `'merge'` | Merge into the built-in filesystem, or replace it entirely |
| `avatar` | `string` | – | Login avatar: an `XPIcon` id or an image URL |
| `wallpapers` | `WallpaperItem[]` | – | Extra wallpapers selectable in Display properties |
| `defaultWallpaper` | `string` | – | Initial wallpaper id or URL |
| `cultures` | `CulturePackage[]` | – | Custom culture packages that extend/override `en`/`zh` |
| `apps` | `AppRegistryEntry[]` | – | Custom applications that extend/override the registry |
| `skipBoot` | `boolean` | `false` | Skip the boot screen on first load |
| `autoLogin` | `boolean` | `false` | Log in automatically without the login screen |
| `storagePrefix` | `string` | `'xp_'` | Per-instance namespace for localStorage / IndexedDB |
| `mode` | `'fullscreen' \| 'embedded'` | `'fullscreen'` | `'embedded'` disables host-page hijacking by default |
| `disableContextMenuBlock` | `boolean` | `mode==='embedded'` | Disable the global right-click block |
| `disableDevToolsBlock` | `boolean` | `mode==='embedded'` | Disable the F12 / devtools-shortcut block |
| `disableGlobalShortcuts` | `boolean` | `mode==='embedded'` | Disable Alt+F4 / Alt+Tab / BSOD easter egg |
| `disableScreenSaver` | `boolean` | `mode==='embedded'` | Disable the idle screensaver |
| `onEvent` | `(e: XPEvent) => void` | – | Listener for every desktop event (see below) |

The component also accepts a `ref` (`XPHandle`) for imperative control. See [USAGE.md](USAGE.md) for the complete reference.

### Events & imperative control

```jsx
import { useRef } from 'react';
import { WindowsXP } from '@caoergou/windows-xp';
import type { XPHandle, XPEvent } from '@caoergou/windows-xp';

function App() {
  const xp = useRef<XPHandle>(null);

  return (
    <>
      <button onClick={() => xp.current?.openApp('Notepad')}>Open Notepad</button>
      <WindowsXP
        ref={xp}
        autoLogin
        onEvent={(e: XPEvent) => {
          // Drive an ARG: unlock the next clue when a specific file is opened
          if (e.type === 'file:open' && e.name === 'secret.txt') {
            xp.current?.showAlert('You found it', 'The password is: bliss');
          }
          if (e.type === 'cmd:exec') console.log('ran command', e.command);
        }}
      />
    </>
  );
}
```

### Custom File System

Top-level keys are merged into the desktop root — so put files and folders at the top level (do **not** wrap them in a `"Desktop"` folder):

```jsx
const customFS = {
  "MyApp.txt": {
    "type": "file",
    "name": "MyApp.txt",
    "app": "Notepad",
    "content": "Hello Windows XP!"
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
import { Window, Taskbar, XPIcon } from '@caoergou/windows-xp/components';
import { Notepad, Minesweeper } from '@caoergou/windows-xp/apps';
import { useWindowManager, useFileSystem, useApp, useCulture, useAppRegistry } from '@caoergou/windows-xp/hooks';
import { xpScrollbarStyles } from '@caoergou/windows-xp/theme';
import { APP_REGISTRY } from '@caoergou/windows-xp/registry';
```

You can also extend the simulator with custom [culture packages](USAGE.md#custom-culture-packages) and [applications](USAGE.md#custom-applications).

## 🎨 Built-in Applications

### Fully Implemented
- 📝 **Notepad** - Text editor with Undo/Redo, Find/Replace, Word Wrap, and save to the virtual filesystem
- 🖼️ **Photo Viewer** - Image viewer
- 🌐 **Internet Explorer** - Web browser with history and hao123 portal
- 📁 **Explorer** - File manager with navigation and keyboard shortcuts (F2/F5/Del, Backspace = up)
- 🧮 **Calculator** - Basic calculator
- 🎨 **Paint** - Brush, line, rectangle, circle drawing; saves the canvas (data URL) into the virtual filesystem
- 🃏 **Solitaire** - Full move logic, auto-flip, stock recycling, and win detection (unit-tested)
- 💣 **Minesweeper** - Classic game with difficulty menu, real XP sprites, and best-time tracking per difficulty
- 💬 **QQ Login** - QQ login dialog
- ❓ **Help and Support** - Help center
- 🏃 **Run Dialog** - Run command dialog with common XP commands
- 🔊 **Volume Control** - Volume settings

### Partial Functionality
- 💻 **Command Prompt** - Basic commands work; `exit` closes the window

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
