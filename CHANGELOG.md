# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed (persistence correctness, #81)

- Structural changes now persist: user-created folders (including empty
  ones), nested files, and renames survive a refresh. Deleting a built-in
  file records a deletion tombstone, so it no longer resurrects on reload.
- Files inside user-created folders no longer relocate to the root on
  reload: persisted entries whose parent folder is gone are skipped with a
  warning instead of being re-attached to the nearest ancestor.
- Recycle bin entries are keyed uniquely: deleting `a/f.txt` then `b/f.txt`
  keeps both items with their own original paths. Restoring an item whose
  original folder no longer exists falls back to the desktop and tells the
  user via an XP dialog instead of silently mis-placing it.
- `pasteFile` validates the destination (and source) before mutating: a
  paste into a missing folder now returns `false` and keeps the cut
  clipboard intact instead of "losing" the file.
- Start-menu launch paths (Internet Explorer, QQMail, Explorer) now store
  their serializable launch state in `componentProps`, so those windows
  restore with their page/path after a refresh instead of coming back blank.
- Window ids use `crypto.randomUUID()` - `Date.now()` collided when several
  windows opened in the same millisecond.
- localStorage quota errors now surface as an XP warning dialog (once per
  session) instead of a silent console error.

### Changed (persistence performance, #81)

- Filesystem persistence is debounced (300ms, flushed on unload/unmount)
  and diff-aware: operations report their dirty/removed content paths and
  only those files are written to IndexedDB, instead of rewriting every
  file on every operation. The IndexedDB connection is opened once and
  reused instead of once per operation.
- Persisted metadata is now a diff against the default filesystem
  (user/edited nodes + deletion tombstones, schema v2) rather than a dump
  of every content file.

### Added (test coverage, #83)

- Core-path test suites (unit tests 174 -> 245, +5 tracked todos), the
  safety net for the #80/#81 refactors:
  - `test/WindowFactory.test.tsx`: every `restoreComponent` branch (registry
    exact match, properties-*, initialPath/url/html/content/src heuristics,
    legacy aliases, unknown-app fallback) plus the WindowManager
    localStorage round-trip (serialization strips functions, restore
    rebuilds windows, unrestorable entries are pruned).
  - `test/persistence.test.ts` (fake-indexeddb): file-content IndexedDB
    round-trips, metadata/recycle-bin localStorage round-trips,
    corrupt-JSON handling, storagePrefix tenant isolation, persist->load
    merge.
  - `test/recycleBinClipboard.test.tsx`: soft-delete/restore/empty recycle
    bin, copy/cut/paste incl. multi-select and cross-directory.
  - `test/bootAndShortcuts.test.tsx`: boot state machine (first boot,
    power_state shutdown/restart/logout, logged-in resume via screensaver),
    Alt+F4 / Alt+Tab / BSOD shortcuts, screensaver idle/dismiss/disable,
    fullscreen-vs-embedded interception behavior.
  - `e2e/persistence.spec.ts`: "the world survives a refresh" - restored
    window and its position after a real reload; known #81 gaps marked as
    `test.fixme`.
- Known persistence bugs are pinned as `it.todo('#81: ...')` placeholders;
  four newly confirmed issues were reported to #81 (files in user folders
  relocate to root on reload; pasteFile clears the clipboard even when the
  destination is missing; element-baked props never persist; dead legacy
  branches in WindowFactory).
- CONTRIBUTING.md: persistence/window-restore changes now MUST come with
  tests; UI changes must update the matching FIDELITY.md entry.

### Fixed (docs/API alignment, #75)

- README(+zh) component example imported a non-existent `Button`; now uses
  real exports (`Window`, `Taskbar`, `XPIcon`).
- Removed the JSDoc example advertising a `/apps/Minesweeper` subpath that
  is not declared in `exports`.
- `language` prop widened from `'en' | 'zh'` to `string`: the documented
  custom-culture path (`language="ja"` + culture package) now type-checks;
  built-ins remain en/zh with English fallback for missing keys.
- USAGE.md claimed `style.css` and `dist/style.css` were two different
  stylesheets (full vs scoped); there is exactly one (scoped) file. Docs
  corrected and `./dist/style.css` added to `exports` as a compat alias so
  the previously documented path resolves under strict resolvers.
- Moved Solitaire game logic out of `src/lib/` (reserved for package entry
  points) to `src/apps/solitaireLogic.ts`.
- Added `test/doc-examples.test.ts`: extracts every
  `import ... from '@caoergou/windows-xp[/subpath]'` in README/USAGE code
  blocks and asserts the names really are exported - docs can no longer
  drift from the API silently (it caught the zh README `Button` on its
  first run).

### Changed (dependencies, #74)

- Peer dependencies reduced from 8 to 3: only `react` (^18 || ^19, verified
  against React 19 by the full unit suite), `react-dom` and
  `styled-components` (^6, the tested major). `react-draggable`,
  `react-resizable`, `i18next` and `react-i18next` are implementation
  details and moved to regular dependencies.
- Dropped the `xp.css` peer dependency: its `external` entry never matched
  the actual `xp.css/dist/XP.css` import, so the (scoped) CSS has always
  been compiled into `dist/style.css` - installing the package separately
  was pointless.
- Aligned `@types/react`/`@types/react-dom` with the developed runtime
  (v18) and fixed three React-19-style `RefObject<T | null>` prop types
  that the correct typings surfaced.
- Removed the no-op `peerDependenciesMeta` block.

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
