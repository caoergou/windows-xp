# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

An **embeddable, scriptable Windows XP desktop engine** for React + TypeScript, published as `@caoergou/windows-xp`. It faithfully recreates the XP experience (file system, apps, boot/login flow, window management, Luna visuals) while exposing it as a product: content is injectable (`customFileSystem`, culture packages, custom apps), every user action emits a typed event (`onEvent`), and the desktop is drivable via an imperative `ref` handle.

Principles, red lines, and the doc map live in `AGENTS.md`; code-level rules in `docs/DEVELOPMENT.md`; the XP-authenticity baseline in `FIDELITY.md`; roadmap in issue #86; design/analysis docs in `docs/` (`USE-CASES.md`, `PUZZLE-DESIGN.md`, `OS-PLATFORM-VISION.md`).

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
- **Window interaction**: react-draggable + react-resizable
- **Internationalization**: i18next

## Architecture

### Context Providers (in `src/components/AppProviders.tsx`)

```
I18nextProvider
└─ AppRegistryProvider
   └─ CultureProvider
      └─ CultureAwareProviders
         └─ StorageProvider
            └─ EventBusProvider
               └─ UserSessionProvider
                  └─ FileSystemProvider
                     └─ WindowManagerProvider
                        └─ TrayProvider
                           └─ ModalProvider
                              └─ App
```

- `AppRegistryProvider` — injectable app registry (`apps` prop) and `useAppRegistry()`.
- `CultureProvider` — injectable culture packages (`cultures` prop) and `useCulture()`.
- `StorageProvider` — per-instance isolated storage handle (`storagePrefix`); all localStorage/IndexedDB access goes through `useStorage()`.
- `EventBusProvider` — one typed event bus per instance (`src/events.ts`); bridged to the `onEvent` prop and `useXPEvents()`.
- `UserSessionProvider` — login state, wallpaper, screensaver.
- `FileSystemProvider` — virtual file system with persistence.
- `WindowManagerProvider` — window lifecycle, z-index, focus.
- `TrayProvider` — system tray icon registry.
- `ModalProvider` — alert/confirm/prompt/password dialogs.

### Events & Imperative API (`src/events.ts`, `src/components/XPBridge.tsx`)

- `src/events.ts` is the single event catalog (typed `XPEvent` union, `domain:action` naming). Contexts emit; consumers subscribe via the `onEvent` prop or `useXPEvents()`.
- `XPBridge.tsx` wires the `ref` handle (`XPHandle`) via `useImperativeHandle`: top-level `openApp`/`openFile`/`closeWindow`/`showAlert`/`reset` plus the grouped actuation APIs from #115 — `fs.*` (read/write/create/delete/unlock), `session.*`, `appearance.*`, `windows.*`, `sound.play`, `emit`. New host-facing capabilities belong on this handle.
- Rule: new user-visible interactions should emit an event; names follow the #130 grammar.

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

### App Registry (`src/registry/apps.tsx`)

All applications are registered in `APP_REGISTRY`, the single source of truth for:
- Application metadata (id, `nameKey`/`name`, icon)
- Default window configuration (width, height, singleton, resizable)
- Locale gating: `locales` — optional list of culture ids (e.g. `['zh']` for the China-only apps); omit for apps available everywhere
- File associations and restoration logic

Prefer `nameKey` (an i18n key resolved via `getAppDisplayName`) over a hardcoded
`name`; `name` remains as the fallback when no `nameKey` is set.

```typescript
export const APP_REGISTRY: Record<string, AppRegistryEntry> = {
  Calculator: {
    id: 'Calculator',
    name: 'Calculator',            // fallback only —
    nameKey: 'apps.calculator',    // display name resolves through i18n first
    icon: 'calculator',
    window: { width: 208, height: 196, resizable: false, singleton: true },
    associations: [{ appField: 'Calculator', getProps: () => ({}) }],
    restore: (props) => <Calculator {...props} />,
  },
  // ... more apps
};
```

Use `resolveFileOpen(key, item)` to resolve a filesystem node to window props, and `getAppDisplayName(entry)` for names (nameKey translation → `name` fallback).

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
| InternetExplorer | InternetExplorer/ | Web browser with history, favorites, era portals |
| Notepad | Notepad.tsx | Text editor (undo, find/replace, word wrap, save to FS) |
| PhotoViewer | PhotoViewer.tsx | Image viewer |
| Calculator | Calculator.tsx | Calculator with full functionality |
| MicrosoftPaint | MicrosoftPaint.tsx | Drawing app; saves PNG into the virtual FS |
| Minesweeper | Minesweeper.tsx | Classic minesweeper (XP sprites, best times) |
| Solitaire | Solitaire.tsx | Solitaire with full move rules & win detection |
| WindowsMediaPlayer | WindowsMediaPlayer.tsx | Media player UI (plays bundled sample) |
| CommandPrompt | CommandPrompt.tsx | CMD emulator (real command set + easter eggs) |
| ControlPanel | ControlPanel/ + ControlPanel.tsx | System settings (display/sound/mouse applets) |
| TaskManager | TaskManager.tsx | Task manager over live window state |
| QQLogin | QQLogin.tsx | QQ login dialog (zh culture) |
| SafeGuard360 | SafeGuard360.tsx | 360 antivirus with scripted threat-scan story (zh) |
| Thunder | Thunder.tsx | Thunder download manager shell (zh) |
| KugouMusic | KugouMusic.tsx | Kugou music player shell (zh) |
| BaofengPlayer | BaofengPlayer.tsx | Baofeng video player shell (zh) |
| WPSOffice | WPSOffice.tsx | WPS Office shell (zh) |
| HelpAndSupport | HelpAndSupport.tsx | Help center |
| RunDialog | RunDialog.tsx | Run dialog (winver/sol/winmine/bsod eggs) |
| VolumeControl | VolumeControl.tsx | Volume settings |
| NetworkConnections | NetworkConnections.tsx | Network status |
| BrowserPlugins | BrowserPlugins.tsx | Browser plugins page (IE nostalgia content) |
| FileProperties | components/FileProperties.tsx | File properties dialog (registry entry) |
| DummyApp | (in registry) | "Coming soon" placeholder — no content references it anymore |

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
  name: 'Your App',              // fallback; user-facing name comes from i18n
  nameKey: 'apps.yourApp',       // add the key to both en.json and zh.json
  icon: 'app_window',
  window: { width: 400, height: 300, singleton: true },
  associations: [{ appField: 'YourApp', getProps: () => ({}) }],
  restore: (props) => <YourApp {...props} />,
},
```

Note: `restore` props are persisted for refresh-restoration and must be JSON-serializable (no functions/elements) — see `docs/DEVELOPMENT.md` §1. A `defineApp()` factory that simplifies all of this is planned in #128.

## Boot Flow (in `src/App.tsx`)

1. BOOTING - shows boot screen (first launch or after shutdown/restart)
2. RUNNING - shows login screen or desktop based on isLoggedIn
3. SCREENSAVER - black screen with floating logo, click to dismiss

Storage keys (all namespaced by the instance's `storagePrefix`, default `xp_` — never access storage directly, always via `useStorage()`):
- `<prefix>open_windows` - persisted window list
- `<prefix>first_boot_done` - skip boot screen on subsequent loads
- `<prefix>power_state` - running / shutdown / restart / logout
- `<prefix>logged_in` - skip login screen on page refresh
- `<prefix>ie_history` - Internet Explorer browsing history
- File content lives in IndexedDB behind the same per-instance handle

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
