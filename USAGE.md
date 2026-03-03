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

The `WindowsXP` component accepts the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `username` | string | `'User'` | Default username for login screen |
| `password` | string | `'password'` | Default password for authentication |
| `language` | string | `'en'` | Initial language (`'en'` or `'zh'`) |
| `customFileSystem` | object | `null` | Custom file system structure (see below) |
| `skipBoot` | boolean | `false` | Skip boot screen on first load |
| `autoLogin` | boolean | `false` | Automatically login without showing login screen |

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

### Skip Boot and Auto Login

```jsx
<WindowsXP
  skipBoot={true}
  autoLogin={true}
/>
```

### Custom File System

You can provide a custom file system structure to replace or extend the default one:

```jsx
const myFileSystem = {
  "Desktop": {
    "type": "folder",
    "name": "Desktop",
    "children": {
      "MyApp.exe": {
        "type": "file",
        "name": "MyApp.exe",
        "icon": "application",
        "app": "Notepad",
        "content": "Welcome to my custom app!"
      },
      "MyFolder": {
        "type": "folder",
        "name": "MyFolder",
        "children": {
          "Document.txt": {
            "type": "file",
            "name": "Document.txt",
            "app": "Notepad",
            "content": "This is a document inside a folder."
          }
        }
      }
    }
  },
  "My Documents": {
    "type": "folder",
    "name": "My Documents",
    "children": {}
  }
};

<WindowsXP customFileSystem={myFileSystem} />
```

### File System Structure

Each file or folder in the file system follows this structure:

**Folder:**
```json
{
  "type": "folder",
  "name": "Folder Name",
  "children": {
    // nested files and folders
  }
}
```

**File:**
```json
{
  "type": "file",
  "name": "File.txt",
  "icon": "text",
  "app": "Notepad",
  "content": "File content here"
}
```

**Supported file types:**
- `Notepad` - Text files (.txt)
- `PhotoViewer` - Image files (.jpg, .png, .gif, .bmp)
- `InternetExplorer` - HTML files (.html, .htm)
- `WindowsMediaPlayer` - Media files (.mp3, .wav, .avi, .wmv)

## Styling

The component comes with default Windows XP styling via `xp.css`. You can override styles using CSS:

```css
/* Customize taskbar color */
.taskbar {
  background: linear-gradient(to bottom, #245EDC 0%, #3E87EB 10%, #245EDC 100%);
}

/* Customize window title bar */
.window-title-bar {
  background: linear-gradient(to bottom, #0997FF 0%, #0053EE 100%);
}

/* Customize desktop background */
.desktop {
  background-image: url('/path/to/your/background.jpg');
}
```

## Features

### Window Management
- ✅ Drag windows by title bar
- ✅ Resize windows from edges and corners
- ✅ Minimize, maximize, and close buttons
- ✅ Window focus management (click to bring to front)
- ✅ Persistent window state (saved to localStorage)

### File System
- ✅ Virtual file system with folders and files
- ✅ Navigate through folders
- ✅ Open files with associated applications
- ✅ Right-click context menus
- ✅ File properties dialog
- ✅ Recycle Bin functionality

### Built-in Applications
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

### System Features
- 🔐 Boot screen and login system
- 🖥️ Desktop with icons and shortcuts
- 📊 Taskbar with Start menu
- 🕐 System clock
- 🔊 Volume control
- 🌍 Language switcher (English/Chinese)
- 💤 Screensaver
- 🔌 Shutdown/Restart/Logout options

## API Reference

### Context Providers

The component internally uses several React Context providers:

- `UserSessionProvider` - Manages user authentication and session
- `FileSystemProvider` - Manages virtual file system state
- `WindowManagerProvider` - Manages open windows and their state
- `ModalProvider` - Manages modal dialogs (alerts, confirms, prompts)

### Custom Hooks

If you're extending the component, you can use these hooks:

```jsx
import { useFileSystem } from '@caoergou/windows-xp';
import { useWindowManager } from '@caoergou/windows-xp';
import { useUserSession } from '@caoergou/windows-xp';

function MyCustomComponent() {
  const { openFile, deleteFile } = useFileSystem();
  const { openWindow, closeWindow } = useWindowManager();
  const { isLoggedIn, login, logout } = useUserSession();

  // Your custom logic here
}
```

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Internet Explorer not supported

## Performance Tips

1. **Limit open windows** - Too many open windows can impact performance
2. **Use production build** - Always use the production build for deployment
3. **Lazy load applications** - Applications are lazy-loaded by default
4. **Clear localStorage** - Periodically clear localStorage if state becomes corrupted

## Troubleshooting

### Windows not persisting after refresh
- Check that localStorage is enabled in your browser
- Ensure you're not in private/incognito mode

### Styling conflicts
- Make sure to import the CSS file: `import '@caoergou/windows-xp/style.css'`
- Check for CSS conflicts with your existing styles

### Custom file system not working
- Verify your file system structure matches the expected format
- Check browser console for errors

## Advanced Usage

### Programmatic Window Control

```jsx
import { WindowsXP, useWindowManager } from '@caoergou/windows-xp';

function MyApp() {
  const windowManager = useWindowManager();

  const openNotepad = () => {
    windowManager.openWindow({
      appId: 'Notepad',
      title: 'Untitled - Notepad',
      component: 'Notepad',
      componentProps: { content: 'Hello World!' }
    });
  };

  return (
    <div>
      <button onClick={openNotepad}>Open Notepad</button>
      <WindowsXP />
    </div>
  );
}
```

### Custom Application Integration

```jsx
import { WindowsXP } from '@caoergou/windows-xp';

// Register your custom app
const customApps = {
  'MyCustomApp': () => import('./MyCustomApp')
};

<WindowsXP customApps={customApps} />
```

## License

MIT

## Support

For issues, questions, or contributions, visit:
- GitHub: [https://github.com/caoergou/windows-xp](https://github.com/caoergou/windows-xp)
- Issues: [https://github.com/caoergou/windows-xp/issues](https://github.com/caoergou/windows-xp/issues)
