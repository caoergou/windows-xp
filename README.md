# Windows XP Simulator 🖥️

<div align="center">

![Windows XP Logo](public/icons/xp-logo.png)

**A faithful recreation of the classic Windows XP desktop experience in your browser**

[Live Demo](http://eric.run.place/windows-xp/) | [Report Bug](https://github.com/caoergou/windows-xp/issues) | [Request Feature](https://github.com/caoergou/windows-xp/issues)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.21-646CFF.svg)](https://vitejs.dev/)

English | [简体中文](README.zh-CN.md)

</div>

---

## ✨ Features

- 🎨 **Authentic Y2K Aesthetic** - Pixel-perfect recreation of the iconic Windows XP Luna theme
- 🪟 **Full Window Management** - Draggable, resizable windows with minimize/maximize/close
- 📁 **Virtual File System** - Browse folders, open files, and manage a simulated filesystem
- 🌐 **Internet Explorer** - Built-in browser with history and iframe rendering
- 📝 **Classic Applications** - Notepad, Photo Viewer, File Explorer, and more
- 🔐 **Login System** - Boot sequence and user authentication flow
- 💾 **Persistent State** - Windows and session state saved to localStorage
- 🎵 **XP Sounds** - Authentic startup, shutdown, and UI sound effects
- ♻️ **Recycle Bin** - Delete and restore files
- 🖱️ **Right-Click Menus** - Context menus throughout the interface

## 🎯 Why This Project?

Relive the nostalgia of the millennium era! This project captures the essence of Windows XP - the operating system that defined an entire generation's computing experience. Perfect for:

- 🕰️ **Nostalgia enthusiasts** who miss the simpler times of computing
- 🎨 **Designers** exploring Y2K and retro aesthetics
- 🎓 **Educators** teaching UI/UX history
- 🎮 **Game developers** needing a retro OS interface
- 💻 **Developers** learning React and complex state management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/caoergou/windows-xp.git
cd windows-xp

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the simulator in action!

### Default Login Credentials

- **Username:** `User`
- **Password:** `password`

## 📦 Usage as npm Component

Install the package:

```bash
npm install @caoergou/windows-xp
```

Use in your React application:

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  return <WindowsXP />;
}
```

For detailed usage and customization options, see [USAGE.md](USAGE.md).
```

## 🏗️ Project Structure

```
windows-xp/
├── src/
│   ├── apps/              # Application components
│   │   ├── Explorer.jsx
│   │   ├── InternetExplorer.jsx
│   │   ├── Notepad.jsx
│   │   └── PhotoViewer.jsx
│   ├── components/        # UI components
│   │   ├── Desktop.jsx
│   │   ├── Taskbar.jsx
│   │   ├── StartMenu.jsx
│   │   └── Window.jsx
│   ├── context/           # React Context providers
│   │   ├── FileSystemContext.jsx
│   │   ├── WindowManagerContext.jsx
│   │   └── UserSessionContext.jsx
│   ├── data/              # Static data and configuration
│   │   ├── filesystem.json
│   │   ├── user_config.json
│   │   └── recycle_bin/
│   └── utils/             # Helper functions
├── public/                # Static assets
└── CLAUDE.md             # Development guidelines
```

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool and dev server
- **styled-components** - CSS-in-JS styling
- **xp.css** - Windows XP theme library
- **Framer Motion** - Smooth animations
- **react-draggable** - Window dragging
- **react-resizable** - Window resizing

## 🎨 Customization

### Adding New Files

Edit `src/data/filesystem.json`:

```json
{
  "MyFile.txt": {
    "type": "file",
    "name": "MyFile.txt",
    "app": "Notepad",
    "content": "Your content here"
  }
}
```

### Creating New Applications

1. Create component in `src/apps/YourApp.jsx`
2. Register in `src/utils/WindowFactory.jsx`
3. Add file association in `filesystem.json`

See [CLAUDE.md](CLAUDE.md) for detailed development guidelines.

## 🌐 Deployment

This project is configured for GitHub Pages deployment:

```bash
npm run build
# Automatically deploys via GitHub Actions on push to main
```

## 📸 Screenshots

*(Add screenshots here)*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [xp.css](https://botoxparty.github.io/XP.css/) - Windows XP CSS framework
- Microsoft - For creating the iconic Windows XP
- The open source community

## 📧 Contact

Project Link: [https://github.com/caoergou/windows-xp](https://github.com/caoergou/windows-xp)

---

<div align="center">
Made with ❤️ and nostalgia for the millennium era
</div>
