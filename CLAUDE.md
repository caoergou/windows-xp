# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

A simulated **Windows XP desktop environment** built with React. Faithfully recreates the classic Windows XP UI experience in the browser, including a working file system, multiple applications, boot/login flow, window management, and the iconic XP visual style.

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run tests
```

## Tech Stack

- **Framework**: React 18 + Vite 5
- **Styling**: styled-components + xp.css (Windows XP theme)
- **Animation**: Framer Motion
- **Window interaction**: react-draggable + react-resizable

## Architecture

### Context Providers (in `src/main.jsx`)

```
UserSessionProvider
└─ FileSystemProvider
   └─ WindowManagerProvider
      └─ App
         └─ ModalProvider
```

### Window Management (`src/context/WindowManagerContext.jsx`)

Each window object:
```javascript
{
  id, appId, title, component, componentProps,
  icon, props, isMinimized, isMaximized,
  zIndex, width, height, left, top
}
```

Windows persist across refreshes via localStorage('xp_open_windows'). Components are restored by WindowFactory.jsx using appId + componentProps.

### File System (`src/context/FileSystemContext.jsx`)

- Structure defined in `src/data/filesystem.json`
- Recycle Bin items loaded dynamically from `src/data/recycle_bin/*.json`
- File node properties: `type`, `name`, `icon`, `locked`, `password`, `broken`, `children`

### User Session (`src/context/UserSessionContext.jsx`)

- User config in `src/data/user_config.json`
- `login(password)` / `logout()` methods
- Session state in localStorage

## Applications (`src/apps/`)

| App | File | Description |
|-----|------|-------------|
| Explorer | Explorer.jsx | File browser with path navigation |
| InternetExplorer | InternetExplorer.jsx | Web browser with history, iframe rendering |
| Notepad | Notepad.jsx | Text file viewer |
| PhotoViewer | PhotoViewer.jsx | Image viewer |

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

1. Create component in `src/apps/YourApp.jsx`
2. Add restoration logic in `src/utils/WindowFactory.jsx`
3. Add a desktop shortcut or file association in `filesystem.json`

## Boot Flow (in `src/App.jsx`)

1. BOOTING - shows boot screen (first launch or after shutdown/restart)
2. RUNNING - shows login screen or desktop based on isLoggedIn
3. SCREENSAVER - black screen with floating logo, click to dismiss

localStorage keys:
- xp_open_windows - persisted window list
- xp_first_boot_done - skip boot screen on subsequent loads
- xp_power_state - running / shutdown / restart / logout
- xp_logged_in - skip login screen on page refresh
- xp_ie_history - Internet Explorer browsing history

## WindowFactory Heuristics (`src/utils/WindowFactory.jsx`)

| Props / appId | Restored as |
|---|---|
| initialPath | Explorer |
| appId === 'Internet Explorer' or url/html props | InternetExplorer |
| content prop (no url/html) | Notepad |
| src prop | PhotoViewer |
| appId starts with 'properties-' | FileProperties |
| My Computer, Recycle Bin, My Documents | Explorer |
