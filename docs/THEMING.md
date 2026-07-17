# Theme layer (`src/themes/`)

Status: **Phase ①+ / B1 seam — the asset/style level is fully consolidated
behind the contract (#213), AND the theme is now selectable at runtime.** XP is
the only theme, and shipping a second one (Win7 / macOS / custom) is still a
non-goal; but every _asset-level_ XP-specific element — colours, fonts, icons,
cursors, sounds, the XP slice of the scoped stylesheet — now lives inside
`src/themes/xp/` and reaches the rest of the code only through this layer's
exports or runtime registration. On top of that, **B1 (#213)** wires the
runtime selection seam: a `theme?: OSTheme` prop (default `xpTheme`) is injected
through a styled-components `ThemeProvider`, the active theme's sound scheme is
registered from it, and `useOSTheme()` / `props.theme` expose it to consumers.
The remaining XP coupling is _structural_ (chrome slots, behavior profile,
menus-as-data — #143 Phase B proper) plus the per-directory `COLORS`/`FONTS`
consumer codemod onto `props.theme` (below), not asset-level.

## The runtime seam (B1, #213)

```
<WindowsXP theme={xpTheme}>  →  AppProviders  →  <ThemeProvider theme={theme}>
                                                      │  props.theme  = OSTheme
                                                      └  useOSTheme() = OSTheme
```

- **`theme?: OSTheme`** on `WindowsXP` / `AppProviders`, defaulting to `xpTheme`
  — passing nothing is byte-identical to before, so existing usage is unchanged.
- The composition root wraps the desktop in a styled-components `ThemeProvider`
  carrying the selected theme; `DefaultTheme` is augmented to `OSTheme`
  (`src/styled.d.ts`) so `props.theme` is fully typed inside styled components.
- `useOSTheme()` (`src/themes/useOSTheme.ts`, re-exported from the public
  `./theme` subpath and the package root) is the typed accessor for non-styled
  TSX.
- **Sounds follow the theme**: the old module-level `registerSounds(XP_SOUNDS)`
  is replaced by `registerSounds(theme.sounds)` at the composition root, so the
  scheme swaps with the theme. App-owned sounds (QQ) still self-register.
- **Follow-up (incremental, zero-diff per step)**: components still read the
  static `COLORS` / `FONTS` re-exports. Migrating each directory to
  `props.theme.tokens` / `useOSTheme()` is the remaining B1 codemod — done a
  directory at a time with a pixel-identical screenshot gate, until only the
  theme layer imports the static tokens.

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
  xp/
    index.ts         # xpTheme: OSTheme
    tokens.ts        # COLORS + FONTS (re-exported by src/constants.ts for back-compat)
    styles.ts        # xpButtonStyles/… (re-exported by src/theme/index.ts)
    icons.ts         # XP_ICONS: icon name → URL (consumed by XPIcon; #213)
    sounds.ts        # XP_SOUNDS: sound name → URL (registered at the composition root; #213)
    xp-chrome.css    # XP slice of the scoped stylesheet: Tahoma @font-face,
                     #   .cur cursor set, XP focus affordances (#213)
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

`OSTheme` = `{ id, name, tokens, fonts, assets, styles, sounds, chrome? }`:

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
  `EDITOR`, `CONSOLE`, `BOOT`. Exported via `src/theme` and `src/constants`.
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
- **`chrome?`** — the _shape_ of the window/taskbar/menu component slots. Left
  unpopulated: XP wires its chrome directly, and authoring real alternate chrome
  (Aero glass, macOS traffic lights, a dock) is the large tail that only pays off
  once a second theme exists.

The contract and `xpTheme` are exported from the public `./theme` subpath
alongside the existing `COLORS` / `FONTS` / `xpButtonStyles`.

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

## De-hardcoding: done (#213)

The ~1,480 inline hex literals that bypassed `COLORS` were migrated in #213
(fonts → `FONTS`, chrome colours/gradients → `COLORS`, app identity →
brand-palette blocks) with pixel-identical screenshots as the acceptance bar.
The dominant cost of a future theme swap at the _skin_ level is paid; what a
second theme still cannot change is layout/behavior (below).

## Known follow-ups

- **Consumer codemod (B1 tail)**: migrate each `src/` directory's static
  `COLORS` / `FONTS` reads to `props.theme.tokens` / `useOSTheme()`, one
  directory at a time behind a zero-diff screenshot gate, until only the theme
  layer imports the static tokens. The seam is in place; this pays it off.
- **Chrome slots**: populate `OSTheme.chrome` and select chrome by theme — only
  meaningful with a real second theme (#143 Phase B).
- **BehaviorProfile / menus-as-data / app roles**: the structural
  (layout/behavior) levels of an OS package — #143 Phase B + #128; out of the
  theme layer's scope.
- **Per-app icon contribution**: `XP_ICONS` still carries app/brand icons
  alongside system icons; apps contributing their own icons through the
  registry is a `defineApp` (#128) follow-up.
- **Unverified neutrals**: the `GREY_*` token section is a value-preserving
  capture of the old inline stock — verify each against a real XP reference
  (FIDELITY §K.1) and re-map to semantic tokens where wrong.
