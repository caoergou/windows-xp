# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

A simulated **Windows XP desktop environment** built with React + TypeScript. Faithfully recreates the classic Windows XP UI experience in the browser, including a working file system, multiple applications, boot/login flow, window management, and the iconic XP visual style.

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run tests
```

## Tech Stack

- **Framework**: React 18 + Vite 5
- **Language**: TypeScript 5
- **Styling**: styled-components + xp.css (Windows XP theme)
- **Animation**: Framer Motion
- **Window interaction**: react-draggable + react-resizable
- **Internationalization**: i18next

## Architecture

### Context Providers (in `src/main.tsx`)

```
UserSessionProvider
└─ FileSystemProvider
   └─ WindowManagerProvider
      └─ App
         └─ ModalProvider
```

### Window Management (`src/context/WindowManagerContext.tsx`)

Each window object:
```typescript
{
  id, appId, title, component, componentProps,
  icon, props, isMinimized, isMaximized,
  zIndex, width, height, left, top
}
```

Windows persist across refreshes via localStorage('xp_open_windows'). Components are restored by WindowFactory.tsx using appId + componentProps.

### App Registry (`src/registry/apps.tsx`) ⭐ NEW

All applications are registered in `APP_REGISTRY`, which is the single source of truth for:
- Application metadata (id, name, icon)
- Default window configuration (width, height, singleton, resizable)
- File associations
- Restoration logic

```typescript
export const APP_REGISTRY: Record<string, AppRegistryEntry> = {
  Calculator: {
    id: 'Calculator',
    name: '计算器',
    icon: 'calculator',
    window: { width: 260, height: 340, resizable: false, singleton: true },
    associations: [{ appField: 'Calculator', getProps: () => ({}) }],
    restore: (props) => <Calculator {...props} />,
  },
  // ... more apps
};
```

Use `resolveFileOpen(key, item)` to resolve a filesystem node to window props.

### File System (`src/context/FileSystemContext.tsx`)

- Structure defined in `src/data/filesystem.json`
- Recycle Bin items loaded dynamically from `src/data/recycle_bin/*.json`
- File node properties: `type`, `name`, `icon`, `locked`, `password`, `broken`, `children`

### User Session (`src/context/UserSessionContext.tsx`)

- User config in `src/data/user_config.json`
- `login(password)` / `logout()` methods
- Session state in localStorage

## Applications (`src/apps/`)

| App | File | Description |
|-----|------|-------------|
| Explorer | Explorer.tsx | File browser with path navigation |
| InternetExplorer | InternetExplorer.tsx | Web browser with history, iframe rendering |
| Notepad | Notepad.tsx | Text file viewer/editor |
| PhotoViewer | PhotoViewer.tsx | Image viewer |
| Calculator | Calculator.tsx | Calculator with full functionality |
| MicrosoftPaint | MicrosoftPaint.tsx | Drawing application |
| Minesweeper | Minesweeper.tsx | Classic minesweeper game |
| Solitaire | Solitaire.tsx | Classic solitaire card game |
| WindowsMediaPlayer | WindowsMediaPlayer.tsx | Media player UI |
| CommandPrompt | CommandPrompt.tsx | CMD terminal emulator |
| ControlPanel | ControlPanel.tsx | System settings UI |
| QQLogin | QQLogin.tsx | QQ login dialog |
| HelpAndSupport | HelpAndSupport.tsx | Help center |
| RunDialog | RunDialog.tsx | Run command dialog |
| VolumeControl | VolumeControl.tsx | Volume settings |
| NetworkConnections | NetworkConnections.tsx | Network status |
| BrowserPlugins | BrowserPlugins.tsx | Browser plugins management |
| DummyApp | (in registry) | Placeholder for unimplemented apps |

## Adding Content

**New files in the filesystem**: Edit `src/data/filesystem.json`

```json
{
  "MyFile.txt": {
    "type": "file",
    "name": "MyFile.txt",
    "app": "Notepad",
    "content": "File content here"
  }
}
```

**Recycle Bin items**: Add JSON files to `src/data/recycle_bin/`

**Desktop shortcuts**: Add entries to the root.children section of filesystem.json

## Adding a New Application

1. Create component in `src/apps/YourApp.tsx`
2. Add entry in `src/registry/apps.tsx` (APP_REGISTRY)
3. Add a desktop shortcut or file association in `filesystem.json`

**Example registry entry**:
```typescript
YourApp: {
  id: 'YourApp',
  name: '你的应用',
  icon: 'app_window',
  window: { width: 400, height: 300, singleton: true },
  associations: [{ appField: 'YourApp', getProps: () => ({}) }],
  restore: (props) => <YourApp {...props} />,
},
```

## Boot Flow (in `src/App.tsx`)

1. BOOTING - shows boot screen (first launch or after shutdown/restart)
2. RUNNING - shows login screen or desktop based on isLoggedIn
3. SCREENSAVER - black screen with floating logo, click to dismiss

localStorage keys:
- xp_open_windows - persisted window list
- xp_first_boot_done - skip boot screen on subsequent loads
- xp_power_state - running / shutdown / restart / logout
- xp_logged_in - skip login screen on page refresh
- xp_ie_history - Internet Explorer browsing history

## WindowFactory Heuristics (`src/utils/WindowFactory.tsx`)

The new registry-based system:

1. **First try**: Exact appId match in APP_REGISTRY
2. **Second try**: Dynamic appId like 'properties-xxx'
3. **Fallback**: Old heuristic matching for backward compatibility

| Props / appId | Restored as |
|---|---|
| initialPath | Explorer |
| appId === 'Internet Explorer' or url/html props | InternetExplorer |
| content prop (no url/html) | Notepad |
| src prop | PhotoViewer |
| appId starts with 'properties-' | FileProperties |
| My Computer, Recycle Bin, My Documents | Explorer |
| Any appId in APP_REGISTRY | Exact match restoration |
