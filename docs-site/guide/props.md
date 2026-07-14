---
title: Props reference
---

# Props reference

Below is the full `<WindowsXP>` prop reference. If you are new to the
component, start with [Make the desktop yours](/guide/content) to learn how
files, apps, and culture packages work, then return here for the complete
list.

## Identity & flow

| Prop        | Type            | Default               | Description                                                                                                                                                           |
| ----------- | --------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `username`  | string          | `'User'`              | Login screen username                                                                                                                                                 |
| `password`  | string          | `'forthe2000s'`       | Login password                                                                                                                                                        |
| `avatar`    | string          | built-in XP user tile | Login/user avatar — an `XPIcon` id or an image URL                                                                                                                    |
| `language`  | string          | `'en'`                | Initial language (`'en'` or `'zh'`; other codes need a culture package providing `i18n` resources)                                                                    |
| `skipBoot`  | boolean         | `false`               | Skip the boot screen on first load                                                                                                                                    |
| `autoLogin` | boolean         | `false`               | Skip the login screen                                                                                                                                                 |
| `boot`      | `BootBranding`  | —                     | Boot-screen branding: `logo`, `text`, `progressColor`, `startupSound`. Opt-in; defaults render pixel-faithful XP and suppresses Microsoft trademarks when set         |
| `login`     | `LoginBranding` | —                     | Login-screen branding: `background`, `title`, `userTile`, `userName`. Opt-in; extends `avatar`/`username` and suppresses the "Microsoft Windows XP" wordmark when set |

## Content

| Prop               | Type                     | Default       | Description                                                                                                                                              |
| ------------------ | ------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customFileSystem` | object                   | `null`        | Your filesystem nodes (see [Content](/guide/content)) — applied at mount                                                                                 |
| `fileSystemMode`   | `'merge'` \| `'replace'` | `'merge'`     | `'replace'` keeps only OS scaffolding; your content becomes the entire desktop                                                                           |
| `wallpapers`       | `Wallpaper[]`            | built-in list | Custom wallpapers, merged over the built-in list (custom wins by id)                                                                                     |
| `defaultWallpaper` | string                   | built-in      | Initial wallpaper — a wallpaper id or a direct image URL                                                                                                 |
| `cultures`         | `CulturePackage[]`       | `[]`          | Culture packages extending/overriding built-in `en`/`zh`                                                                                                 |
| `apps`             | `AppRegistryEntry[]`     | `[]`          | Custom applications merged over the built-in registry                                                                                                    |
| `scenario`         | `Scenario`               | —             | Declarative scenario/story script: flags, triggers, and gated actions authored as plain JSON. See [Scenario system](/guide/scenarios)                    |
| `lessons`          | `Lesson[]`               | —             | Guided lessons: data-driven Watch/Try/Do tutorials. Register them here, then start one via the `ref` handle. See [Guided lessons](/guide/lessons)        |
| `markdown`         | `MarkdownOptions`        | —             | Markdown viewer options: `linkTarget` (`'ie'` \| `'external'`), custom `components`, and `remarkPlugins`. See [Build a blog on the desktop](/guide/blog) |

## Host integration

| Prop                 | Type                                            | Default           | Description                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`               | `'fullscreen'` \| `'embedded'`                  | `'fullscreen'`    | `'embedded'` disables all host-page hijacking in one switch                                                                                                                                                |
| `viewportPolicy`     | `'auto'` \| `'scale'` \| `'native'` \| `'warn'` | depends on `mode` | Small-screen strategy. `'auto'` in fullscreen, `'native'` in embedded. See [Small screens & mobile](/guide/embedding#small-screens-mobile)                                                                 |
| `storagePrefix`      | string                                          | `'xp_'`           | Storage namespace — each instance is fully isolated                                                                                                                                                        |
| `persistence`        | `'local'` \| `'session'` \| `'none'`            | `'local'`         | Storage backend. `'local'` survives across visits (localStorage + IndexedDB); `'session'` is per-tab; `'none'` is pure in-memory — every mount starts pristine (campaign pages, blogs, teaching sandboxes) |
| `openOnLoad`         | `string` \| `string[]`                          | —                 | Deep link: key path(s) — e.g. `'My Documents/readme.txt'` — to open once the desktop is interactive. Invalid paths fail silently to the plain desktop                                                      |
| `routes`             | `DeepLinkRoutes`                                | —                 | Pretty URL routes map (``{ '/blog/:slug': ({ slug }) => ({ open: `D:/posts/${slug}.md` }) }``) matched against `location`. Host-router-agnostic                                                            |
| `location`           | string                                          | —                 | The host's current location (path[+search]) used for `routes` matching                                                                                                                                     |
| `historyIntegration` | boolean                                         | `false`           | Push/pop browser history as top-level windows open/close so Back closes the last-opened window                                                                                                             |

## Behavior

| Prop                      | Type                             | Default                               | Description                                                                                                                   |
| ------------------------- | -------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `onEvent`                 | `(e: XPEvent) => void`           | —                                     | Subscribe to every desktop event (see [Events](/guide/events))                                                                |
| `devtools`                | boolean                          | `false`                               | Mount the Scenario / event DevTools overlay (dev-time; tree-shaken out when off). See [Scenario system](/guide/scenarios)     |
| `disableContextMenuBlock` | boolean                          | `false` (`true` in `mode='embedded'`) | Allow the browser's right-click menu                                                                                          |
| `disableDevToolsBlock`    | boolean                          | `false` (`true` in `mode='embedded'`) | Allow F12 / Ctrl+Shift+I/J/C                                                                                                  |
| `disableGlobalShortcuts`  | boolean                          | `false` (`true` in `mode='embedded'`) | Disable every global-scope shortcut (Ctrl+Esc, Alt+F4, Alt+Tab, BSOD egg)                                                     |
| `keymap`                  | `Record<string, string \| null>` | —                                     | Remap or disable individual shortcuts by id (see [Keyboard shortcuts](/guide/keyboard))                                       |
| `disableScreenSaver`      | boolean                          | `false` (`true` in `mode='embedded'`) | Disable the idle screensaver                                                                                                  |
| `hourlyChime`             | boolean                          | `false`                               | Play the classic hourly chime (整点报时 — the old Windows top-of-hour bell) on the hour (a culture package can enable it too) |
| `idleThresholdMs`         | number                           | `60000`                               | Inactivity threshold before `user:idle` fires                                                                                 |

Imperative control is available via a React `ref` rather than a JSX prop. See [Events](/guide/events) for the `XPHandle` methods.

> **`apps` and `cultures` are reactive.** Adding or removing an entry after mount
> registers/updates it — the prop wins over a runtime
> `registerApp`/`registerCulture` on an id collision, and built-ins + runtime
> registrations are preserved. `customFileSystem` remains **mount-time** (it
> seeds the desktop; drive later filesystem changes through `useApp().fs` or the
> `ref` handle).
