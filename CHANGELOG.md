# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added (Explorer Details view, #120)

- **Explorer view switcher with a sortable Details view** (EXP-02, the
  highest-perceptibility Explorer gap): the toolbar "Views" button and the
  View menu now switch between the Icons grid and a **Details** table with
  Name / Size / Type / Date-modified columns (click a header to sort). The
  chosen view is persisted per instance via `useStorage`. Rows support
  selection, double-click-to-open, context menu and the #87 keyboard ops.
  Covered by `e2e/explorer.spec.ts`. FIDELITY EXP-02 → 🟡 (Thumbnails/Tiles/
  List and the Folders tree pane / address-history dropdown remain for a
  follow-up batch; EXP-03/04 keyboard already shipped in #87).

## [0.3.0] - 2026-07-11

This release turns the XP desktop into an **embeddable, scriptable engine** — an
event stream, an imperative handle, portable state snapshots, replaceable
content, and a standalone component library — on top of a leaner, faster, fully
type-safe core, plus a broad visual/behavior fidelity pass and a real CI gate.

### Added

- **Event stream + imperative handle** (#76, #115): the `onEvent` prop exposes a
  single typed `XPEvent` stream (`app:*`, `window:*`, `file:*`, `session:*`,
  `cmd:exec`), and the `ref` handle (`XPHandle`) grew into a full actuation
  surface so a host can drive the desktop with no custom apps or context —
  `fs` (`readFile`/`writeFile`/`createFile`/`deleteFile`/`getNode`/`exists`/`unlockNode`),
  `session` (`login`/`logout`/`shutdown`/`restart`), `appearance`
  (`setWallpaper`/`setLanguage`), `windows` (`list`/`focus`/`minimize`/`maximize`/`restore`),
  plus `sound.play(name)` and `emit(event)`. `useXPEvents()`/`useXPEventBus()`
  subscribe from inside the tree; the original 5 handle methods stay top-level.
  `unlockNode` persistently clears a node's `locked` flag. Foundation for the
  scenario system (#84).
- **Save / load snapshots** (#117): a versioned `XPSnapshot` (filesystem +
  contents, recycle bin, open windows, wallpaper, language, and a reserved
  `flags` slot) with `getSnapshot()` / `loadSnapshot()` — export a save and
  rehydrate it under another prefix or in another browser ("share a save").
  Loading a newer-version snapshot throws `XPSnapshotVersionError`. Exports
  `XP_SNAPSHOT_VERSION` and `assertLoadableSnapshot`.
- **Standalone component library** (#78, #99): provider-free, xp.css-accurate
  primitives from `/components` — `XPButton`, `XPTextInput`, `XPCheckbox`,
  `XPRadio`, `XPSelect`, `XPProgressBar`, `XPTooltip`, `XPGroupBox`,
  `XPStatusBar` (+ `XPStatusBarField`), `XPTabs`, `XPMenuBar`, and a composable
  `XPDialog`. A `?gallery` route renders every primitive in isolation.
- **Replaceable content** (#77): `fileSystemMode="replace"` makes a consumer's
  `customFileSystem` the entire desktop; `wallpapers` / `defaultWallpaper`
  inject custom wallpapers (id or URL) and pick the initial one; `avatar`
  overrides the login avatar; `CulturePackage.wallpaper` is now honored.
- **Behavior-fidelity keyboard** (#87): Ctrl+Esc opens the Start menu; with the
  desktop focused, F2 / Delete / Enter / Ctrl+A / arrow keys act on icons;
  inside a file window, Backspace goes up a level and F5 / F2 / Delete work.
  (FIDELITY KBD-03, DSK-03/04/05, EXP-03/04 → ✅.)
- **Activated easter eggs** (#85): CMD `matrix` / `color` / `telnet` / `format c:`;
  Run `winver` / `sol` / `winmine` / `bsod`; a BSOD that fake-reboots; a working
  Windows Media Player chime; the 360 "found threats" → clean gag; and the 4399
  mini-games portal in IE.
- **Reactive props + `useApp` writes + bus exports** (#122): `apps` and
  `cultures` re-merge after mount (prop wins on id collision; runtime
  registrations + built-ins preserved); `useApp().fs` gains
  `writeFile`/`createFile`/`deleteFile`; `EventBusProvider`, `XPEventBus` and a
  `createXPEventBus()` factory are exported for bare-provider composition.
- **Public type exports** (#79): every `CulturePackage` sub-type,
  `WallpaperItem`, `ModalContextType`, `TrayItem`/`TrayContextType`, `ExifData`
  and `JsonValue`, guarded by a compile-time export test.
- **`mode="embedded"`** (#73): one switch disables host-page hijacking
  (right-click/devtools blocks, global shortcuts, idle screensaver); individual
  `disable*` props still override.

### Changed

- **Visual fidelity sweep to the xp.css Luna baseline** (#99): shared primitives
  (`XPButton`, `XPTextInput`, `XPCheckbox`/`XPRadio`, `XPSelect`,
  `xpTrackbarStyles`, `XPMenuBar`, `XPDialogChrome`) replace ~a dozen divergent
  hand-rolled controls — including checkboxes that were **completely invisible**,
  host-OS dropdowns, flat sliders, the Windows-2000-gray Calculator/Paint/menus,
  and the horizontal-gradient dialog title bars. Palette corrected to XP values
  (`#ECE9D8` surfaces, `#004E98` desktop). Locked by a component gallery +
  `toHaveScreenshot` visual-regression baselines running in the Playwright
  container (`visual.yml`).
- **Per-instance storage isolation** (#95): `createStorage(prefix)` +
  `StorageProvider` / `useStorage()` give each `<WindowsXP>` its own namespaced
  localStorage and private IndexedDB connection; two instances on one page no
  longer share state. The module-level storage functions remain a
  backward-compatible facade over a default instance.
- **WindowManager performance** (#80): context split into window-list / active-id
  / actions, so interacting with one window no longer re-renders the others, the
  taskbar and the desktop; stable action identities, debounced persistence, and
  StrictMode-safe side effects.
- **Persistence performance** (#81): debounced, diff-aware IndexedDB writes (only
  dirty content is written), a single reused connection, and metadata stored as
  a diff against the defaults (schema v2) instead of a full dump.
- **Type-safety debt cleared** (#82): removed every `@ts-nocheck` from `src/`
  (fixing 94 hidden type errors with no `any` / `@ts-ignore`); a `guard:nocheck`
  script keeps them out. `useFileOperations` rewritten without `any`.
- **Real CI gate** (#112): `ci.yml` runs lint, typecheck, `guard:nocheck`, the
  full `vitest run` suite, `size:check` and the Playwright e2e suite on every
  pull request and push to `main` — previously only the visual-snapshot job ran
  on PRs.
- **Leaner dependencies** (#74): peer dependencies reduced 8 → 3 (`react`
  18 or 19, `react-dom`, `styled-components` 6); `react-draggable`,
  `react-resizable`, `i18next` and `react-i18next` moved to regular deps; the
  unused `xp.css` peer was dropped.
- **Package size 17.2MB → 3.0MB** (#72): assets are extracted into
  `dist/assets/` instead of base64-inlined (largest JS chunk 11.5MB → 0.4MB),
  source assets optimized, and a `size:check` guard wired into `prepublishOnly`.
- **Scoped styles + isolated i18n** (#73): all xp.css rules are built under
  `:where(.windows-xp-root, .windows-xp-portal)` so importing `style.css` can't
  restyle the host page; the library never initializes the global i18next
  singleton.

### Fixed

- **Correctness batch** (#121): Notepad shortcuts are scoped to the focused
  window (no more window-level `keydown` leaking Ctrl+S/F/H into the host page or
  double-firing across instances); taskbar cascade/tile are no longer
  enabled-but-no-op; `getFileProperties` is fully localized (no hardcoded
  Chinese under `language="en"`); Notepad Find/Replace dialogs and MobileWarning
  now use the shared XP dialog chrome (STY-15).
- **Persistence correctness** (#81): user folders / renames / empty folders
  survive a refresh; deleting a built-in file leaves a tombstone (no
  resurrection); files in user folders no longer relocate to root; recycle-bin
  entries are keyed uniquely; `pasteFile` validates its destination; start-menu
  launches restore their page/path; window ids use `crypto.randomUUID()`; and
  storage-quota errors surface as an XP dialog.
- **Bugs revealed by removing `@ts-nocheck`** (#82): Explorer delete/rename
  captured their target lazily (could act on the wrong item); the Hao123 search
  crashed without navigation handlers; IEToolbar silently ignored
  `onPrint`/`onHelp`; ContextMenu leaked invalid DOM attributes.
- **QQ + Run dialog fidelity** (#99): the QQ banner penguin is no longer clipped
  (real `qq.png`); QQ 2007 login is QQ-number-only (removed the anachronistic
  phone/email option); the Run dialog is rebuilt to the authentic XP layout with
  real i18n keys.
- **Release workflow** (#113): `publish.yml` uses npm OIDC trusted publishing
  (no token or secret required); the dead `sideEffects` field (which pointed at
  non-existent `src/` paths) is now `["**/*.css"]`; the `[0.1.0]` changelog date
  is corrected.

### Docs

- **Documentation truth sweep** (#114, #75): README is rewritten around the
  engine story with a full props table and `onEvent`/ARG examples, corrected
  app-maturity claims and custom-filesystem example (mirrored in zh-CN); USAGE
  gained SSR/Next.js, snapshot and host-driving sections and dropped stale
  caveats; CLAUDE.md and FIDELITY.md were re-aligned with shipped reality. The
  `doc-examples` test asserts every documented import against the real exports.

### Internal

- **Test coverage** (#83) grew the unit suite substantially (WindowFactory,
  persistence via fake-indexeddb, recycle-bin/clipboard, boot state machine)
  alongside e2e for persistence, keyboard, nostalgia and snapshots. CONTRIBUTING
  now requires tests for persistence/window-restore changes and a matching
  FIDELITY.md update for UI changes.

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

## [0.1.0] - 2026-03-03

### Added

- Initial Windows XP desktop simulator in React.
- Start menu, taskbar, draggable windows, and file explorer.
- Classic apps: Internet Explorer 6, Notepad, Calculator, Minesweeper, Solitaire, Paint, Windows Media Player, QQ Login, 360 Safe Guard, Thunder, Baofeng Player, Kugou Music, and more.
- i18n support for Simplified Chinese and English.
