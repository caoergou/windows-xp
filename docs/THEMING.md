# Theme layer (`src/themes/`)

Status: **#213 B1–B5 implemented.** `OSTheme` remains the asset/style contract;
the higher-level `OSPackage` now owns that theme plus chrome slots, a closed
`BehaviorProfile`, conventions, and app-role mappings. XP is the default
package (`xpOS`). The original `paperOS` reference package replaces the skin,
window decoration, shell surface, boot/login screens, menu renderer, modifier,
window animation and maximize behavior without changing engine code.

## The runtime seam (B1, #213)

```
<WindowsXP os={xpOS}> → OSPackageProvider → chrome / behavior / conventions
                              └────────────→ ThemeProvider(os.theme)
```

- **`theme?: OSTheme`** on `WindowsXP` / `AppProviders`, defaulting to `xpTheme`
  remains a backwards-compatible skin-only override.
- **`os?: OSPackage`** defaults to `xpOS`. This is the complete replacement seam;
  `useOSPackage()` reads it and `defineOS()` validates authored packages. Public
  exports live at the package root and the `./os` subpath.
- The composition root wraps the desktop in a styled-components `ThemeProvider`
  carrying the selected theme; `DefaultTheme` is augmented to `OSTheme`
  (`src/styled.d.ts`) so `props.theme` is fully typed inside styled components.
- `useOSTheme()` (`src/themes/useOSTheme.ts`, re-exported from the public
  `./theme` subpath and the package root) is the typed accessor for non-styled
  TSX.
- **Sounds follow the theme**: the old module-level `registerSounds(XP_SOUNDS)`
  is replaced by `registerSounds(theme.sounds)` at the composition root, so the
  scheme swaps with the theme. App-owned sounds (QQ) still self-register.
- **The skin follows the theme**: `OSTheme.css` carries the theme's sheet as a
  string (XP packs the postcss-scoped xp.css via `?inline` + its chrome sheet
  from `chromeCss.ts`). `AppProviders` mounts it into `<head>` at runtime via
  `mountThemeCss(theme)` (layout effect, refcounted per theme id, removed on
  last unmount) — entries no longer `import 'xp.css/dist/XP.css'`. Entries that
  render without providers (the gallery) and bare `/apps`/`/components`
  consumers call `mountThemeCss(xpTheme)` from their own bootstrap instead.
- **Every theme read goes through `resolveOSTheme()`**
  (`src/themes/useOSTheme.ts`): bare renders of the public `/apps` and
  `/components` subpaths have no `ThemeProvider` above them, and an
  unguarded `theme.tokens` read crashes there — a breaking change for
  package consumers. The resolver falls back to the default `xpTheme` in
  that case (mirroring AppProviders' own default) and is a pass-through
  under a provider. Inside styled components the idiom is
  `({ theme }) => resolveOSTheme(theme).tokens.X`; in plain TSX,
  `useOSTheme()` already applies the same fallback.

## Why

The long-term direction (#143, `OS-PLATFORM-VISION.md`) decouples the engine
from "XP": the look becomes a definable package. A coupling audit (#135) found
the codebase was already _more_ theme-ready than expected — the engine layer
(`src/context`, `src/hooks`, `src/utils`, `events.ts`, `snapshot.ts`) carries no
visual styling, window _mechanics_ are already split from window _skin_, icons
sit behind a name→file registry, and sounds go through a named facade. The work
is **consolidation behind a contract**, not untangling.

## The contract

```
src/themes/
  contract.ts        # OSTheme — the abstraction a theme fills
  index.ts           # barrel: contract types + xpTheme
  useOSTheme.ts      # useOSTheme() / resolveOSTheme() — the runtime accessor (+ bare-render fallback)
  mountThemeCss.ts   # mounts OSTheme.css into <head> (refcounted per theme id)
  xp/
    index.ts         # xpTheme: OSTheme (css = scoped xp.css `?inline` + XP_CHROME_CSS)
    tokens.ts        # COLORS + FONTS (public outlet: the `./theme` subpath)
    styles.ts        # xpButtonStyles/… (re-exported by src/theme/index.ts)
    icons.ts         # XP_ICONS: icon name → URL (consumed via theme.assets.icons; #213)
    sounds.ts        # XP_SOUNDS: sound name → URL (registered at the composition root; #213)
    chromeCss.ts     # XP_CHROME_CSS: the XP chrome sheet as a string — Tahoma
                     #   @font-face, .cur cursor set, XP focus affordances (#213 B1)
    assets/
      index.ts       # XP_ASSETS registry (windowControls / startButton / icons)
      window-controls/*.png   # Luna min/max/restore/close button states
      start-button-sprite.png # the English Start button spritesheet
      start-flag.png          # the waving XP flag (for the localized button)
      cursors/*.cur           # the authentic XP cursor set (#213)
      fonts/Tahoma*.woff      # the Tahoma webfont (#213)
      audio/*.wav             # the XP sound scheme samples (#213)
```

A theme owns its assets: the XP chrome files — images, cursors, fonts, audio —
live **beside** the registry under `src/themes/xp/assets/`, not in the shared
`src/assets/` tree, so the theme is a self-contained package. A second theme
ships its own `assets/` folder of the same shape.

`OSTheme` = `{ id, name, tokens, fonts, assets, styles, sounds, css? }`:

- **`tokens`** — colours, gradients and chrome dimensions (the XP set is
  `COLORS`, ~130 entries). Groups: core chrome (surface/highlight/borders),
  button chrome (gradients + hover/focus shadows), window frame (title
  gradients, frame shadows, border blues), taskbar/tray/Start, Start menu,
  login screen, Explorer/IE panes, PhotoViewer, panels/progress/misc, and a
  clearly-marked **unverified neutral grey** section (`GREY_33`…`GREY_F8`,
  FIDELITY §K.1 待核查 — value-preserving captures of the pre-#213 inline
  stock; verify against a real XP reference before building on them).
  `src/themes/xp/tokens.ts` is the canonical list — this doc names the groups
  so the list can't drift.
- **`fonts`** — the font stacks (STY-03): `UI`, `TITLEBAR`, `CLASSIC`, `MONO`,
  `EDITOR`, `CONSOLE`, `BOOT`. Public outlet: the `./theme` subpath.
- **`assets`** — the image registry: window controls, Start button, and the
  full icon name→URL map (`XP_ICONS`) that `XPIcon` resolves against — so
  `icon: 'folder'` never knows which OS look is installed.
- **`styles`** — reusable styled-components fragments (`button`, `scrollbar`,
  `titleBar`, `trackbar`).
- **`sounds`** — the sound scheme (`XP_SOUNDS`). The engine's `soundManager`
  binds **no** audio: the composition root (`AppProviders`) calls
  `registerSounds(theme.sounds)` for the active theme at startup (B1, #213);
  app-owned sounds (QQ) register themselves from their own package
  (`src/apps/QQ/sounds.ts`).
- **`css?`** — the theme's skin sheet as one string, mounted into `<head>` by
  the composition root via `mountThemeCss` (#213 B1). XP packs the postcss-scoped
  xp.css table (imported `?inline` so `vite.xp-css-scope.ts` still applies)
  plus `XP_CHROME_CSS` (Tahoma webfont, `.cur` cursors, focus affordances —
  asset URLs are JS imports, so the lib build keeps extracting them to
  `dist/assets/`). `dist/style.css` consequently shrinks to the neutral
  scaffold (`scoped.css`); consumers importing it are unaffected, and bare
  `/apps` renders that previously relied on `style.css` for the skin should
  call `mountThemeCss(xpTheme)` from their entry.

`OSPackage` adds:

- **`chrome`** — required `WindowDecoration`, `shellSurfaces`, `BootScreen`,
  `LoginScreen`, `MenuBar`, and `SystemDialogs` slots, plus an optional
  `Launcher`. Engine surfaces select these slots; XP components are bound
  only by `xpOS`.
- **`behavior`** — closed decisions for menu placement, minimize target,
  maximize semantics, primary modifier, animation, focus, and dialog modality.
  These are enums, not arbitrary callbacks into the window manager.
- **`conventions`** — path style, terminal dialect, icon sizes and wallpaper.
- **`appRoles`** — semantic `files/editor/browser/terminal/media` mappings.
  Content can use `role:<name>` and resolve through the active package.

The theme contract and `xpTheme` are exported from `./theme`; `OSPackage`,
`defineOS`, `xpOS`, `paperOS`, role helpers and the runtime accessor are exported
from `./os`.

## Brand palettes: what deliberately does NOT theme

Culture/era apps (QQ, 360, Thunder, Winamp, the fictional era-web pages …) and
app content palettes (Paint's 16 colours, cmd.exe's VGA table, Solitaire's felt,
Calculator's key colours) are **app identity, not OS chrome**: QQ 2006 must
still look like QQ 2006 if the OS theme is swapped (#143). They therefore do
NOT reference `COLORS`; each app centralizes its colours in one
`brand-palette:start`…`brand-palette:end` block (guard-enforced: the block is
ratchet-exempt only in files allow-listed in `scripts/guard-purity.mjs`, and
inline hexes outside a block still count against the zero baseline).

## The invariants (CI-enforced)

- The engine must never import the theme layer — a theme is selected _above_
  the engine, not reached into from inside it. `npm run guard:purity` fails if
  any file under `src/context`, `src/hooks`, `src/utils`, `events.ts` or
  `snapshot.ts` imports from `src/themes/`.
- The engine must never import asset files (images/cursors/audio) either
  (#213): look and sound reach the mechanism layer through the theme asset
  registries and `registerSounds` runtime injection only.
- Inline hexes are **zero** outside the two sanctioned stores (`HEX_BASELINE = 0`):
  the theme token layer (`src/themes/`, ratchet-exempt — colour literals are
  the _point_ of this layer) and declared brand-palette blocks (above).
- xp.css is imported only by the theme layer (`src/themes/`, as an `?inline`
  string feeding `OSTheme.css`) — entries mount the skin at runtime, they never
  hardcode it.
- Apps / components / devtools never import `themes/xp` directly (#213 B1
  end-state): XP reaches them only through the theme context / contract. The
  single allow-listed exception is the composition root (`AppProviders`), which
  binds the default OS package until the engine/os-xp package split (#143/B5).

## De-hardcoding: done (#213)

The ~1,480 inline hex literals that bypassed `COLORS` were migrated in #213
(fonts → `FONTS`, chrome colours/gradients → `COLORS`, app identity →
brand-palette blocks) with pixel-identical screenshots as the acceptance bar.
The dominant cost of a future theme swap at the skin level is paid. The OS
package layer now also selects layout and the supported behavior decisions.

## Known follow-ups

- **Official fidelity depth**: `paperOS` is intentionally a small authoring and
  contract reference, not a claim of fidelity to a historical OS. A future
  official real-OS-like package needs its own evidence table and visual suite.
- **Per-app icon contribution**: `XP_ICONS` still carries app/brand icons
  alongside system icons; apps contributing their own icons through the
  registry is a `defineApp` (#128) follow-up.
- **Unverified neutrals**: the `GREY_*` token section is a value-preserving
  capture of the old inline stock — verify each against a real XP reference
  (FIDELITY §K.1) and re-map to semantic tokens where wrong.
