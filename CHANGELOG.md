# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- `mode="embedded"` prop (#73): one switch that makes `<WindowsXP/>` a
  well-behaved guest in a host app - right-click block, devtools block,
  global shortcuts and the idle screensaver are disabled by default.
  Individual `disable*` props still override.

### Changed

- All xp.css rules are now scoped under
  `:where(.windows-xp-root, .windows-xp-portal)` at build time (#73):
  importing `style.css` can no longer restyle the host page's `body`,
  buttons or form controls. Portal-rendered content (context menus,
  Notepad dialogs, Solitaire drag overlay) carries the
  `.windows-xp-portal` scope marker.
- The library no longer initializes the global i18next singleton at module
  load (#73); it only uses its own isolated instance, so it cannot conflict
  with a host app's i18next setup.
- `setStoragePrefix` now warns once when two instances set conflicting
  prefixes on the same page (full per-instance isolation still tracked in
  #73).

### Changed

- Package size reduced from 17.2MB to 3.0MB (#72):
  - Library build now extracts referenced assets into `dist/assets/` as real
    files via `@laynezh/vite-plugin-lib-assets` instead of inlining everything
    as base64 into JS chunks (largest chunk: 11.5MB -> 0.4MB). Wallpapers and
    audio are now fetched on demand at runtime instead of shipping in the
    initial JS payload.
  - Optimized source assets: control-panel icons resized from 1024px to 96px
    (rendered at 48px), all icons palette-quantized, wallpapers capped at
    1280px width with mozjpeg q80 (`src/assets`: 12MB -> 4.2MB).
- Added `npm run size:check` size guard, wired into `prepublishOnly`, to
  prevent the package from regressing toward base64-inlined bloat.
- Playwright config now honors `PW_CHROMIUM_PATH` for sandboxed environments
  with a preinstalled Chromium.

## [0.2.0] - 2026-07-10

### Added

- Package is now a consumable React library with multiple subpath exports:
  - `@caoergou/windows-xp` – main `WindowsXP` component.
  - `@caoergou/windows-xp/components` – reusable UI components.
  - `@caoergou/windows-xp/apps` – built-in applications.
  - `@caoergou/windows-xp/hooks` – system hooks (`useWindowManager`, `useFileSystem`, `useApp`, `useCulture`, `useAppRegistry`).
  - `@caoergou/windows-xp/theme` – theme tokens and scrollbar styles.
  - `@caoergou/windows-xp/registry` – app registry helpers.
- Pluggable culture packages via `CultureProvider`/`useCulture` and the `cultures` prop on `WindowsXP`.
- Pluggable app registry via `AppRegistryProvider`/`useAppRegistry` and the `apps` prop on `WindowsXP`.
- Scoped global CSS via `.windows-xp-root` to avoid leaking XP styles into host apps.
- New `disableGlobalShortcuts` prop to disable Alt+F4 / Alt+Tab / BSOD easter egg handlers.
- `WindowIdContext` so app components no longer rely on `cloneElement` injecting `windowId`.
- Cultural packs: desktop shortcuts and sticky notes are now localized per language.
- Added English locale e2e smoke tests for Western cultural icons and Run Dialog app launching.
- CI quality gates: lint, typecheck, and a smoke test run before GitHub Pages deploy; full unit tests run before npm publish.
- Added `CONTRIBUTING.md` and this changelog.
- BSOD easter egg triggered by Ctrl+Shift+Alt+B.
- Sticky note password hint for both locales.

### Changed

- `src/i18n/index.ts` now creates an isolated i18n instance for `AppProviders` while still initializing the global singleton as a fallback for standalone components.
- `useApp` now uses refs internally so its returned API object is stable and safe to use in `useEffect` dependency arrays.
- `UserSessionContext` action callbacks are now memoized with `useCallback`.
- `useCulture` and `useAppRegistry` return sensible defaults when used outside their providers instead of throwing.
- Replaced deprecated Prettier option `jsxBracketSameLine` with `bracketSameLine`.
- Expanded Prettier format globs to cover `e2e/`, `test/`, and root config files.
- Run Dialog now resolves localized app titles from registry `nameKey` entries.

### Fixed

- Fixed unit-test hang caused by an unstable `useApp` API object interacting with `WindowManagerContext` state updates.
- Removed hard-coded Chinese strings from IE toolbar, IE address bar, and login screen; they now use i18n keys.
- Fixed Run Dialog so `calc` launches Calculator with the correct localized title.

## [0.1.0] - 2024-XX-XX

### Added

- Initial Windows XP desktop simulator in React.
- Start menu, taskbar, draggable windows, and file explorer.
- Classic apps: Internet Explorer 6, Notepad, Calculator, Minesweeper, Solitaire, Paint, Windows Media Player, QQ Login, 360 Safe Guard, Thunder, Baofeng Player, Kugou Music, and more.
- i18n support for Simplified Chinese and English.
