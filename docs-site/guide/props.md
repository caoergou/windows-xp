---
title: Props reference
---

# Props reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `username` | string | `'User'` | Login screen username |
| `password` | string | `'forthe2000s'` | Login password |
| `avatar` | string | built-in | Login/user avatar — an `XPIcon` id or an image URL |
| `language` | string | `'en'` | Initial language (`'en'` or `'zh'`; other codes need a culture package providing `i18n` resources) |
| `skipBoot` | boolean | `false` | Skip the boot screen on first load |
| `autoLogin` | boolean | `false` | Skip the login screen |
| `customFileSystem` | object | `null` | Your filesystem nodes (see Content) — applied at mount |
| `fileSystemMode` | `'merge'` \| `'replace'` | `'merge'` | `'replace'` keeps only OS scaffolding; your content becomes the entire desktop |
| `wallpapers` | `Wallpaper[]` | `[]` | Custom wallpapers, merged over the built-in list (custom wins by id) |
| `defaultWallpaper` | string | built-in | Initial wallpaper — a wallpaper id or a direct image URL |
| `cultures` | `CulturePackage[]` | `[]` | Culture packages extending/overriding built-in `en`/`zh` |
| `apps` | `AppRegistryEntry[]` | `[]` | Custom applications merged over the built-in registry |
| `onEvent` | `(e: XPEvent) => void` | — | Subscribe to every desktop event (see Events) |
| `ref` | `Ref<XPHandle>` | — | Imperative control handle (see Events) |
| `devtools` | boolean | `false` | Mount the [Scenario / event DevTools](#scenario--event-devtools-209) overlay (dev-time; tree-shaken out when off) |
| `mode` | `'fullscreen'` \| `'embedded'` | `'fullscreen'` | `'embedded'` disables all host-page hijacking in one switch |
| `storagePrefix` | string | `'xp_'` | Storage namespace — each instance is fully isolated |
| `disableContextMenuBlock` | boolean | `false` | Allow the browser's right-click menu |
| `disableDevToolsBlock` | boolean | `false` | Allow F12 / Ctrl+Shift+I/J/C |
| `disableGlobalShortcuts` | boolean | `false` | Disable every global-scope shortcut (Ctrl+Esc, Alt+F4, Alt+Tab, BSOD egg) |
| `keymap` | `Record<string, string \| null>` | — | Remap or disable individual shortcuts by id (see [Keyboard shortcuts](#keyboard-shortcuts)) |
| `disableScreenSaver` | boolean | `false` | Disable the idle screensaver |
| `hourlyChime` | boolean | `false` | Play the classic 整点报时 chime on the hour (a culture package can enable it too) |
| `idleThresholdMs` | number | `60000` | Inactivity threshold before `user:idle` fires |

> **`apps` and `cultures` are reactive (#122).** Adding or removing an entry
> after mount registers/updates it — the prop wins over a runtime
> `registerApp`/`registerCulture` on an id collision, and built-ins + runtime
> registrations are preserved. `customFileSystem` remains **mount-time** (it
> seeds the desktop; drive later filesystem changes through `useApp().fs` or
> the `ref` handle).

