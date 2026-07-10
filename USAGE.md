# Windows XP Component - Usage Guide

## Installation

```bash
npm install @caoergou/windows-xp
```

> Peer dependencies: `react`, `react-dom`, `styled-components`, `react-draggable`, `react-resizable`, `i18next`, `react-i18next`. The package also bundles `immer` internally.

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
| `password` | string | `'forthe2000s'` | Default password for authentication |
| `language` | string | `'en'` | Initial language (`'en'` or `'zh'`) |
| `customFileSystem` | object | `null` | Custom file system structure (see below) |
| `cultures` | `CulturePackage[]` | `[]` | Custom culture packages that extend/override built-in `en`/`zh` |
| `apps` | `AppRegistryEntry[]` | `[]` | Custom applications that extend/override built-in registry |
| `skipBoot` | boolean | `false` | Skip boot screen on first load |
| `autoLogin` | boolean | `false` | Automatically login without showing login screen |
| `storagePrefix` | string | `'xp_'` | Namespace prefix for localStorage / IndexedDB |
| `mode` | `'fullscreen'` \| `'embedded'` | `'fullscreen'` | `'embedded'` disables all host-page hijacking (right-click/devtools blocks, global shortcuts, screensaver) by default |
| `disableContextMenuBlock` | boolean | `false` | Disable the global right-click menu block |
| `disableDevToolsBlock` | boolean | `false` | Disable blocking of F12 / Ctrl+Shift+I/J/C |
| `disableGlobalShortcuts` | boolean | `false` | Disable Alt+F4 / Alt+Tab / BSOD easter egg |
| `disableScreenSaver` | boolean | `false` | Disable the idle screensaver |

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

You can provide a custom file system structure. Top-level keys are merged into the root file system (which appears on the desktop):

```jsx
const myFileSystem = {
  "MyApp.lnk": {
    "type": "app_shortcut",
    "name": "MyApp.lnk",
    "app": "Notepad",
    "icon": "journal"
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

## Subpath Imports

For smaller bundles, import only what you need:

```jsx
// Full desktop (largest bundle)
import { WindowsXP } from '@caoergou/windows-xp';

// Individual applications
import { Minesweeper } from '@caoergou/windows-xp/apps';

// UI primitives
import { Window, Desktop, Taskbar, XPIcon } from '@caoergou/windows-xp/components';

// Hooks and providers
import { useWindowManager, useFileSystem, useAppRegistry, useCulture } from '@caoergou/windows-xp/hooks';

// Theme tokens
import { COLORS, xpButtonStyles } from '@caoergou/windows-xp/theme';

// App registry helpers
import { APP_REGISTRY } from '@caoergou/windows-xp/registry';
```

> When using subpath imports, make sure the components are still rendered inside the providers exported from `@caoergou/windows-xp`.

## Custom Applications

Register your own XP-style application so it can be opened from the desktop, start menu, or programmatically, and restored after refresh:

```jsx
import { WindowsXP, useWindowManager, useApp } from '@caoergou/windows-xp';

function MyApp() {
  const { window } = useApp(); // window.id is injected automatically
  return <div>Hello from window {window.id}!</div>;
}

const myApp = {
  id: 'MyApp',
  name: 'My Application',
  icon: 'app_window',
  window: { width: 400, height: 300 },
  restore: (props) => <MyApp {...props} />,
};

function Host() {
  const { openWindow } = useWindowManager();

  return (
    <>
      <button onClick={() => openWindow('MyApp', 'My App', <MyApp />, 'app_window')}>
        Open My App
      </button>
      <WindowsXP apps={[myApp]} />
    </>
  );
}
```

## Custom Culture Packages

Culture packages let you define a complete regional/era desktop experience: desktop shortcuts, start menu, browser homepage, sticky note, and i18n resources.

```jsx
import { WindowsXP } from '@caoergou/windows-xp';

const jpRetroCulture = {
  id: 'jp-retro',
  displayName: '日本 2000s',
  locales: ['ja', 'ja-JP'],
  browser: { homepage: 'http://www.yahoo.co.jp' },
  desktopShortcuts: [
    { id: 'nicovideo', name: 'ニコニコ動画', app: 'NicoVideoPlayer', icon: 'nico' },
  ],
  startMenu: {
    pinned: [
      { id: 'ie', action: 'InternetExplorer', nameKey: 'startMenu.apps.internetExplorer', icon: 'ie' },
    ],
    recent: [
      { id: 'notepad', action: 'Notepad', nameKey: 'apps.notepad', icon: 'file' },
    ],
  },
  stickyNote: {
    id: 'default',
    title: 'メモ',
    content: 'これはカスタム文化包のテストです',
  },
  i18n: {
    ja: {
      'startMenu.apps.internetExplorer': 'Internet Explorer',
      'apps.notepad': 'Notepad',
    },
  },
};

<WindowsXP language="ja" cultures={[jpRetroCulture]} />
```

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

The stylesheet is fully scoped: every xp.css rule is rewritten at build time under `:where(.windows-xp-root, .windows-xp-portal)`, so importing it cannot restyle your host page's `body`, buttons or form controls:

```jsx
import '@caoergou/windows-xp/style.css';        // full demo experience
// or
import '@caoergou/windows-xp/dist/style.css';  // scoped to .windows-xp-root
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

#### Fully Implemented
- 📝 **Notepad** - Text editor
- 🖼️ **Photo Viewer** - Image viewer
- 🌐 **Internet Explorer** - Web browser with history
- 📁 **Explorer** - File manager
- 🎨 **Paint** - Drawing application
- 🧮 **Calculator** - Basic calculator
- 💣 **Minesweeper** - Classic game
- 🃏 **Solitaire** - Card game
- 🔊 **Volume Control** - Volume settings
- 🏃 **Run Dialog** - Run command dialog
- ❓ **Help and Support** - Help center
- 💬 **QQ Login** - QQ login dialog

#### Basic UI (Limited Functionality)
- 🎵 **Windows Media Player** - Media player UI with visualizations
- ⚙️ **Control Panel** - System settings UI
- 💻 **Command Prompt** - Terminal emulator with basic commands
- 🖧 **Network Connections** - Network status UI

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

- `AppRegistryProvider` - Manages the application registry
- `CultureProvider` - Manages active culture package
- `UserSessionProvider` - Manages user authentication and session
- `FileSystemProvider` - Manages virtual file system state
- `WindowManagerProvider` - Manages open windows and their state
- `ModalProvider` - Manages modal dialogs (alerts, confirms, prompts)

### Custom Hooks

If you're extending the component, you can use these hooks:

```jsx
import {
  useAppRegistry,
  useCulture,
  useFileSystem,
  useWindowManager,
  useUserSession,
  useApp,
} from '@caoergou/windows-xp';

function MyCustomComponent() {
  const { registry, registerApp } = useAppRegistry();
  const { culture, setCulture } = useCulture();
  const { openFile, deleteFile } = useFileSystem();
  const { openWindow, closeWindow } = useWindowManager();
  const { isLoggedIn, login, logout } = useUserSession();
  const app = useApp(); // only valid inside a window

  // Your custom logic here
}
```

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Internet Explorer not supported

## Performance Tips

1. **Use subpath imports** - Import only the apps/components you need
2. **Limit open windows** - Too many open windows can impact performance
3. **Use production build** - Always use the production build for deployment
4. **Lazy load applications** - Applications are lazy-loaded by default
5. **Clear localStorage** - Periodically clear localStorage if state becomes corrupted

## Troubleshooting

### Windows not persisting after refresh
- Check that localStorage is enabled in your browser
- Ensure you're not in private/incognito mode
- Custom apps must be passed to the `apps` prop every render so restoration can find them

### Styling conflicts
- Make sure to import the CSS file: `import '@caoergou/windows-xp/style.css'`
- For embedded usage, the component root has the `.windows-xp-root` class
- Check for CSS conflicts with your existing styles

### Custom file system not working
- Verify your file system structure matches the expected format
- Check browser console for errors

## Embedding in a host app

When `<WindowsXP />` is embedded inside an existing application, use `mode="embedded"` — it disables all global event interceptors (right-click block, devtools block, Alt+F4/Alt+Tab shortcuts, idle screensaver) in one switch. Pair it with a unique storage namespace:

```jsx
<WindowsXP mode="embedded" storagePrefix="myapp_xp_" />
```

Individual `disable*` props still work and override the mode defaults, e.g. `mode="embedded" disableScreenSaver={false}` keeps the screensaver while staying otherwise non-intrusive.

The stylesheet never leaks: all XP styles are scoped under `.windows-xp-root` (and `.windows-xp-portal` for context menus/dialogs), so your host app's controls keep their own look.

Note on storage: `storagePrefix` is currently process-wide — two instances with different prefixes on one page will share the most recently mounted prefix (a console warning is emitted). Full per-instance isolation is tracked in issue #73.

Note on i18n: the library uses its own isolated i18next instance and never initializes the global singleton, so it cannot conflict with your app's i18next setup. If you render standalone components from `@caoergou/windows-xp/components` without `<WindowsXP/>`/`<AppProviders/>`, wrap them in an `I18nextProvider` bound to the exported instance:

```jsx
import { I18nextProvider } from 'react-i18next';
import { AppProviders } from '@caoergou/windows-xp';
// AppProviders already includes the provider; for bare components use your own i18next instance.
```

## License

MIT

## Support

For issues, questions, or contributions, visit:
- GitHub: [https://github.com/caoergou/windows-xp](https://github.com/caoergou/windows-xp)
- Issues: [https://github.com/caoergou/windows-xp/issues)
