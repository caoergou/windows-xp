# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added (behavior fidelity — keyboard batch, #87)

- **Ctrl+Esc opens the Start menu** (KBD-03) — the XP-native Win-key equivalent
  the browser doesn't intercept.
- **Desktop keyboard operations** (DSK-03/04/05): with the desktop focused,
  **F2** renames the selected icon, **Delete** moves it to the Recycle Bin (with
  the usual confirm), **Enter** opens the selection, **Ctrl+A** selects all, and
  the **arrow keys** move the selection. Clicking the desktop or an icon now
  focuses the desktop so these keys target it even right after using a window;
  the handler ignores keystrokes while typing or while a window/dialog is
  focused. Covered by a new `e2e/keyboard.spec.ts`. FIDELITY DSK-03/04/05 and
  KBD-03 move to ✅.
- **Explorer keyboard operations** (EXP-03/04): inside a file window,
  **Backspace** navigates up one level (the XP-native shortcut, distinct from
  "Back"), **F5** refreshes the view, **F2** renames the selected item, and
  **Delete** moves it to the Recycle Bin. The file window takes focus on click so
  these keys target it, and the handler ignores keystrokes while the address bar
  is being edited. Covered by new Explorer cases in `e2e/keyboard.spec.ts`.
  FIDELITY EXP-03/04 move to ✅.

### Added (component library primitives, closes #78)

- **Standalone `XPDialog`**: a provider-free, XP-styled dialog (Luna title bar +
  icon + close, optional `modal` overlay and `footer` buttons) that reuses the
  real window chrome. Composes a classic XP message box from `<XPDialog>` +
  `<XPButton>` with no `<WindowsXP>` and no providers.
- **New zero-dependency primitives**: `XPGroupBox` (grooved fieldset + legend),
  `XPStatusBar` / `XPStatusBarField`, and `XPTabs` (controlled or uncontrolled),
  all value-for-value from xp.css. Together with the primitives added earlier
  (`XPButton`, `XPTextInput`, `XPCheckbox`, `XPRadio`, `XPSelect`,
  `XPProgressBar`, `XPTooltip`, `XPMenuBar`) this fills out the "usable like
  xp.css" component set.
- **Gallery covers the primitives**: the `?gallery` route now renders group box,
  tabs, standalone dialog and status bar too, each with a committed
  visual-regression baseline (13 total).
- **Docs**: new USAGE "Standalone UI Primitives (no providers)" section that
  spells out the two layers (standalone primitives vs. provider-backed system
  components) with a real `XPDialog` + `XPButton` example; the doc-examples test
  validates every documented import against the real exports.

### Added (activated easter eggs, closes #85)

- **CMD easter-egg commands**: `matrix` (green "wake up, Neo" screen), `color`
  (real XP console recolor), `telnet towel.blinkenlights.nl` (Star Wars ASCII),
  and `format c:` (crashes to the BSOD). `COLOR`/`FORMAT`/`TELNET` are listed in
  `help` so they're discoverable.
- **Run dialog hidden commands**: `winver` (About Windows dialog), `sol` /
  `winmine` (Solitaire / Minesweeper), `bsod`, and `format` (access denied).
- **BSOD is now reachable in-game and fake-reboots**: `format c:` (CMD) and
  `bsod` (Run) trigger it via a DOM event; clicking the blue screen restarts the
  machine (marks a restart + replays the boot sequence) instead of just
  vanishing.
- **Windows Media Player works out of the box**: the default source pointed at a
  non-existent `/audio/sample.mp3` (also ignoring the base URL). Replaced with a
  bundled, synthesized no-copyright chime imported as a hashed asset.
- **360 Safe Guard "found threats" story**: the scan now "discovers" real
  filesystem entries as fake trojans and offers a Clean button that removes
  them; the panel scrolls so the list/button are always reachable.
- **IE nostalgia page**: `http://www.4399.com` renders a period mini-games
  portal, linked from the hao123 homepage's new "休闲游戏" section.
- Covered by `test/bootAndShortcuts` (BSOD reboot) and new `e2e/nostalgia`
  specs (winver, `format c:`→BSOD→reboot, 360 scan→clean).

### Added (fully replaceable content, closes #77)

- **`fileSystemMode="replace"`**: keeps only OS scaffolding (Recycle Bin + an
  empty My Computer) and drops the built-in desktop app shortcuts, My
  Documents, Network Neighbourhood, preset content, AND culture shortcuts — so
  a consumer's `customFileSystem` becomes the entire desktop (personal home
  page / portfolio / branded page). Default `"merge"` is unchanged.
- **`wallpapers` / `defaultWallpaper` props**: inject custom wallpapers
  (merged over the built-in list, custom wins by id) and pick the initial one.
  `defaultWallpaper` accepts a wallpaper id or a direct image URL. UserSession
  now exposes `wallpapers` + `resolveWallpaperSrc()`; Desktop, Display Settings
  and Desktop Properties resolve through it, so raw URLs and custom entries
  render and appear in the picker.
- **Activated `CulturePackage.wallpaper`** (previously a dead field): a culture
  package can now declare its default wallpaper; `defaultWallpaper` prop wins.
- **`avatar` prop**: override the login/user avatar (XPIcon id or image URL).
- Documented that content props (`customFileSystem`) are applied at mount;
  exported the `FileSystemMode` type. New `test/contentReplaceable.test.tsx`
  proves replace mode yields a clean desktop with only injected content and
  that a custom wallpaper URL is applied.

### Changed (per-instance storage isolation, closes #95)

- Storage is no longer a process-wide global. `createStorage(prefix)` builds an
  isolated `Storage` handle (its own namespaced keys + private IndexedDB
  connection); a new `StorageProvider` / `useStorage()` distributes one handle
  per `<WindowsXP/>` instance. Two instances with different `storagePrefix`
  values on the same page now keep fully separate file systems, windows, and
  login state.
- Migrated the stateful consumers off the module-level storage functions to
  `useStorage()`: FileSystem (context, persistence helpers, file operations),
  WindowManager, UserSession, App boot flow, Taskbar, LoginScreen, Control
  Panel, and the IE history/favorites hooks. `persistFs` / `loadPersistedFileSystem`
  now take an explicit `storage` handle.
- The module-level functions (`getStorageKey`, `safeLocalStorage`,
  `saveFileContent`, …) remain as a backward-compatible facade over a default
  instance, so single-instance apps and non-React callers are unchanged.
  `useStorage()` falls back to that default when no `StorageProvider` is present.
- New `test/storageIsolation.test.tsx` proves two prefixes never share
  localStorage keys, metadata, recycle bin, or IndexedDB content, and that
  `useStorage()` is provider-scoped.

### Added (public type exports, closes #79)

- The entry point now re-exports every `CulturePackage` sub-type
  (`CulturalItem`, `DesktopShortcut`, `StickyNoteContent`, `StartMenuApp`,
  `StartMenuProfile`, `BrowserCultureProfile`, `CultureKey`) plus
  `WallpaperItem`, `ModalContextType`, `TrayItem`, `TrayContextType`, and
  `ExifData` — so a custom culture package or app can be authored fully
  type-safe without hand-copying types.
- New `JsonValue` type + a JSDoc note on `AppRegistryEntry` documenting that
  restore/`componentProps` must be JSON-serializable (they are persisted for
  window restore); runtime callbacks belong on the event bus / `AppLifecycle`,
  not in props.
- `test/lib-exports.test.tsx` gained a compile-time guard that constructs
  values from each newly-exported type, so dropping an export fails `tsc`.

### Added (micro-component gallery + visual-regression CI, closes #99)

- **Micro-component gallery** (`?gallery` route, `src/gallery/Gallery.tsx`):
  renders every shared XP primitive (buttons, text inputs, checkbox/radio,
  combobox, trackbar, progress bar, tooltip, menu bar) on one page — the
  deterministic surface for screenshot comparison, and a component catalog
  that also serves #78.
- **Visual-regression baselines in CI** (the #99 acceptance gate): new
  `e2e-visual/gallery.spec.ts` locks 9 `toHaveScreenshot` baselines (full page
  + 8 sections) via a dedicated `playwright.visual.config.ts` (isolated from
  the behavioural e2e suite). A new `.github/workflows/visual.yml` runs it in
  the official Playwright container (`mcr.microsoft.com/playwright:v1.57.0-jammy`)
  so Chromium + fonts match the committed `-linux` baselines. Regenerate with
  `npm run test:visual:update`.
- **`XPTooltip`** (exported from `/components`): the XP yellow tooltip
  (`#FFFFE1`, 1px black border, Tahoma, ~500ms delay, fade-in) rendered into a
  body portal so it is never clipped. Replaces browser-native `title=` where
  the authentic look is wanted (adoption incremental).
- **`XPProgressBar`** (exported from `/components`): the Luna progress bar,
  value-for-value from xp.css `progress` — white rounded trough (1px `#686868`,
  radius 4px, 14px) with the segmented green fill.

### Changed (palette sweep, #99)

- Replaced the Windows 2000 gray `#d4d0c8` with XP Luna `#ECE9D8` across
  Microsoft Paint (toolbar/palette), Windows Media Player, the taskbar clock's
  calendar, Desktop Properties, and the Control Panel Display/Mouse/Sound
  dividers. (Minesweeper/Solitaire keep the classic 3D gray by design.)

### Fixed (QQ login + Run dialog fidelity, #99)

- **QQ login header penguin was clipped and inconsistent.** The blue banner
  drew a crude hand-rolled SVG penguin (52x62) bottom-aligned in an
  `overflow:hidden` header that flex-compressed to 51px, cutting the penguin's
  entire head off. Replaced with the real `qq.png` icon (the same asset the
  avatar and loading spinner already use), `flex-shrink:0` header, and bumped
  the window to 400px tall so the footer stops clipping.
- **QQ 2007 login placeholder was anachronistic** ("QQ号/手机号/邮箱" /
  "QQ/Phone/Email"). QQ 2007 only supported QQ-number login; phone/email
  came years later. Now "QQ号码" / "QQ Number".
- **Run dialog rebuilt to the authentic XP layout.** It was a bare bold
  "运行...:" label (the Start-menu string with its ellipsis leaking in) + input
  + OK/Cancel, with the descriptive text stuffed into the placeholder and no
  `runDialog.*` i18n keys (all inline defaults). Now: the run icon + real
  description line, an "打开(O):" combobox row, and OK / Cancel / Browse
  buttons (Browse opens Explorer at My Computer). Added the missing
  `runDialog.description/open/browse/errorTitle/errorMessage` keys to zh/en.

### Changed (checkbox / radio consistency, #99)

- New shared `XPCheckbox` / `XPRadio` (exported from `/components`). xp.css
  ships a global `input[type=checkbox]{opacity:0;position:fixed}` that hides
  the native control and repaints it via an adjacent `input + label` sibling;
  the app's markup rarely matched that structure, so those checkboxes were
  **completely invisible** (the volume mute toggle, the QQ remember/auto/
  invisible-login row, Control Panel mute/pointer-trails). The new components
  draw the 13px sunken white box + 7px checkmark bitmap (and the 12px radio
  circle + dot) themselves, value-for-value from xp.css, so they render
  identically regardless of surrounding DOM. Migrated VolumePopup,
  VolumeControl, ControlPanel Sound/Mouse settings, and QQ login.

### Changed (combobox consistency, #99)

- New shared `XPSelect` (exported from `/components`). Native `<select>`
  elements (ControlPanel system language, Display settings wallpaper/
  resolution/screensaver, Desktop Properties background/position) rendered
  the host-OS dropdown. `XPSelect` matches xp.css's `select`: a `#7f9db9`
  sunken white field with the beige raised drop-button + black arrow bitmap.

### Changed (trackbar / slider consistency, #99)

- New shared `xpTrackbarStyles` (in `src/theme`). The volume and Control
  Panel sliders used flat 16px square thumbs; now they render the XP Luna
  trackbar (2px sunken groove + pointed 11x21 indicator), value-for-value
  from xp.css's `input[type=range]`. Note: the thumb rule needs `!important`
  to beat xp.css's higher-specificity `input[type=range]::-webkit-slider-thumb`,
  otherwise the browser's default thumb leaks green through the indicator's
  transparent corners. Migrated VolumeControl, VolumePopup, Sound/Mouse.

### Changed (palette, #99)

- Desktop fallback background corrected from `#3A6EA5` (the Windows 2000
  desktop blue) to `#004E98` (XP Luna Desktop system color) in
  `constants.ts` and `Desktop.tsx` - the exact errata flagged in
  FIDELITY.md K.1.

### Changed (text input consistency, #99)

- New shared `XPTextInput` (exported from `/components`): value-for-value
  matched to xp.css's `input[type=text|password]` (border `#7f9db9`,
  `#fff` background, 23px height, `3px 4px` padding, no focus outline -
  real XP text boxes show no color-change ring, only the caret). XPInput
  (21px tall, `2px 3px` padding), PasswordDialog (invented blue focus
  outline + inset shadow + `border-radius: 1px`, none of which exist in
  xp.css) and RunDialog (missing height/background) each diverged
  slightly; all three now share the one field. RunDialog's OK/Cancel
  buttons, previously a standalone flat gradient never migrated to
  `XPButton` in the earlier button pass, are now on `XPButton` too.
  Verified with component-level screenshots of all three dialogs
  (Run, Enter Password, Rename).

### Changed (dialog chrome consistency, #99)

- All four dialogs (XPAlert, XPConfirm, PasswordDialog, XPInput) now reuse
  the real window chrome pieces (`WindowChrome`'s `TitleBar` +
  `WindowContainer`) via new `XPDialogChrome` wrappers. Their title bars
  were a flat HORIZONTAL `#0058EE -> #3593FF` gradient with a divergent
  frame - visibly different from every window on screen, which uses the
  vertical 8-stop Luna gradient. Dialog chrome can no longer drift from
  window chrome. Verified with component-level element screenshots.
- Fidelity verification note: the minimize glyph's low-left dash placement
  was audited against xp.css's pixel-traced SVG (dash at x=5-11, y=13-15
  in the 21x21 button) - our Luna artwork matches pixel-for-pixel; the
  "low" position is authentic XP design.

### Changed (micro-component visual consistency, #99)

- New shared `XPButton` (exported from `/components`): value-for-value
  identical to xp.css's Luna button (white gradient face, `#003C74` border,
  3px radius, orange hover glow, pressed gradient). XPAlert, XPConfirm,
  PasswordDialog and XPInput each duplicated a slightly different flat
  `#ECE9D8` button (one even square-cornered) - all migrated.
- Calculator keys rebuilt on the same Luna values - they were the
  Windows 2000 look (`#d4d0c8` face, two-tone 1px border, visibly flat).
- Dialog close buttons were a hand-drawn orange gradient bar; all four
  dialogs now reuse the real Luna close-button artwork (`CloseBtn`).
- `XPMenuBar` primitives exported from `/components` alongside `XPButton`.
- All fixes verified visually via Playwright screenshots against the
  running app; FIDELITY.md §K updated.

### Changed (menu-bar consistency, #99)

- Added shared `XPMenuBar` primitives (`src/components/XPMenuBar.tsx`) and
  migrated Solitaire, Minesweeper and Notepad onto them. The three apps
  previously hand-rolled menu bars with three different backgrounds
  (`#d4d0c8` / `#ece9d8` / `#f0f0f0` gradient) and highlight colors; they
  now share one canonical XP look (surface `#ECE9D8`, highlight `#316AC5`,
  no hard divider) sourced from FIDELITY.md §K.1. Solitaire's Game/Help
  menu — the most visibly off — is fully rewritten with real dropdowns.

### Added (event bus + imperative control, #76)

- `onEvent` prop on `<WindowsXP/>`: a single typed stream of everything that
  happens inside the desktop - `app:launch`/`app:close`,
  `window:focus`/`minimize`/`maximize`/`restore`,
  `file:open`/`create`/`delete`/`rename`/`restore`/`unlock`,
  `session:login`/`logout`/`boot-complete`/`shutdown`, and `cmd:exec`.
  Exported `XPEvent` union, `XPEventType`, `XPEventListener`.
- Imperative handle via `ref` (`XPHandle`): `openApp`, `openFile`,
  `closeWindow`, `showAlert`, `reset`. `<WindowsXP/>` is now a
  `forwardRef` component.
- `useXPEvents(listener)` / `useXPEventBus()` hooks for subscribing from
  inside the tree (custom apps) without prop-drilling.
- This is the foundation for the scenario system (#84): host code and
  scenario scripts observe progress and drive the desktop through the same
  bus + handle.

### Changed (type-safety debt, #82)

- Removed every `@ts-nocheck` from `src/` (11 files) and fixed all 94 real
  type errors they were hiding - with zero escape hatches (no `any`,
  `@ts-ignore` or `@ts-expect-error`). Three of the files (Desktop,
  PhotoViewer, QQLogin) had no errors at all and were suppressed for
  nothing. A `guard:nocheck` script now fails CI if `@ts-nocheck`
  reappears.
- `useFileOperations` rewritten without `any` (was 15) or the file-level
  eslint-disable: a single `getContainerAtPath` helper replaces nine
  hand-rolled path-walk loops; move/cut relocate the immer draft node and
  copy uses `current()` instead of `JSON.parse(JSON.stringify())`, so
  structural sharing works again.
- Removed the `renameNode` alias (callers use `renameFile`); collapsed
  WindowFactory's unreachable legacy exact-id branches into an explicit
  alias map.

### Fixed (revealed by typing, #82)

- Explorer delete/rename dialogs captured the context-menu target lazily:
  if the menu state reset while the dialog was open, confirming threw (and
  could act on the wrong item). The target is now captured up front.
- Hao123 search crashed when neither `onOpenNew` nor `onNavigate` was
  provided; now a safe no-op.
- IEToolbar destructured non-existent prop names (`_onPrint`/`_onHelp`),
  silently ignoring callers' `onPrint`/`onHelp`; dead bindings removed.
- ContextMenu leaked non-transient `x`/`y` props as invalid DOM attributes.

### Changed (WindowManager performance, #80)

- WindowManagerContext split into three contexts (window list / active id /
  actions): interacting with one window no longer re-renders every other
  window, the taskbar and the desktop. `<Window/>` now subscribes only to
  the stable actions and the active id; its own data arrives via props, so
  `React.memo` finally takes effect. New hooks `useWindowManagerActions()`
  and `useActiveWindowId()`; `useWindowManager()` keeps the merged API.
- All window actions are referentially stable (ref-mirrored state); side
  effects (onFocus/onClose, z-index bookkeeping) moved out of setState
  updaters - StrictMode no longer double-fires them.
- Window-list persistence to localStorage is debounced (300ms, flushed on
  beforeunload/unmount): drag/focus bursts write once instead of per event.
- Fixed: minimizing a background window no longer steals focus from the
  active one; the auto-focus fallback no longer re-activates a window the
  user just minimized; flashWindow timers restart cleanly and are cleared
  on close/unmount.

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
