# Windows XP Component - Usage Guide

## Installation

```bash
npm install @caoergou/windows-xp
```

## Basic Usage

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  return <WindowsXP />;
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `username` | string | `'User'` | Default username for login screen |
| `password` | string | `'password'` | Default password for authentication |
| `language` | string | `'en'` | Initial language (`'en'` or `'zh'`) |
| `customFileSystem` | object | `null` | Custom file system structure (see below) |

## Examples

### Custom Login Credentials

```jsx
<WindowsXP
  username="Admin"
  password="mypassword123"
/>
```

### Chinese Language

```jsx
<WindowsXP language="zh" />
```

### Custom File System

```jsx
const myFileSystem = {
  "Desktop": {
    "type": "folder",
    "children": {
      "MyApp.exe": {
        "type": "file",
        "name": "MyApp.exe",
        "icon": "application",
        "app": "Notepad",
        "content": "Welcome to my custom app!"
      }
    }
  }
};

<WindowsXP customFileSystem={myFileSystem} />
```

## Styling

The component comes with default Windows XP styling. You can override styles using CSS:

```css
/* Customize taskbar color */
.taskbar {
  background: linear-gradient(to bottom, #245EDC 0%, #3E87EB 10%, #245EDC 100%);
}

/* Customize window title bar */
.window-title-bar {
  background: linear-gradient(to bottom, #0997FF 0%, #0053EE 100%);
}
```

## Features

- ✅ Full window management (drag, resize, minimize, maximize)
- ✅ Virtual file system with folders and files
- ✅ Built-in applications (Explorer, Notepad, IE, Photo Viewer)
- ✅ Authentic XP boot and login sequence
- ✅ Bilingual support (English/Chinese)
- ✅ Persistent state (localStorage)
- ✅ Right-click context menus
- ✅ System tray with clock
- ✅ Start menu with programs

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT
