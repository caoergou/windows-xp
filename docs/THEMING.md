# Theme layer (`src/themes/`)

Status: **Phase ① — the seam exists; XP is the only theme.** Shipping a second
theme (Win7 / macOS / custom) is a non-goal here (see #135); this document
describes the architecture that keeps that door open without the engine paying
for it up front.

## Why

The long-term direction (#143, `OS-PLATFORM-VISION.md`) decouples the engine
from "XP": the look becomes a definable package. A coupling audit (#135) found
the codebase was already *more* theme-ready than expected — the engine layer
(`src/context`, `src/hooks`, `src/utils`, `events.ts`, `snapshot.ts`) carries no
visual styling, window *mechanics* are already split from window *skin*, icons
sit behind a name→file registry, and sounds go through a named facade. The work
is **consolidation behind a contract**, not untangling.

## The contract

```
src/themes/
  contract.ts        # OSTheme — the abstraction a theme fills
  index.ts           # barrel: contract types + xpTheme
  xp/
    index.ts         # xpTheme: OSTheme
    tokens.ts        # COLORS (re-exported by src/constants.ts for back-compat)
    styles.ts        # xpButtonStyles/… (re-exported by src/theme/index.ts)
    assets/
      index.ts       # XP_ASSETS registry
      window-controls/*.png   # Luna min/max/restore/close button states
      start-button-sprite.png # the English Start button spritesheet
      start-flag.png          # the waving XP flag (for the localized button)
```

A theme owns its assets: the XP chrome image files live **beside** the registry
under `src/themes/xp/assets/`, not in the shared `src/assets/` tree, so the
theme is a self-contained package. A second theme ships its own `assets/` folder
of the same shape.

`OSTheme` = `{ id, name, tokens, assets, styles, chrome? }`:

- **`tokens`** — colours, gradients and chrome dimensions (the XP set is
  `COLORS`).
- **`assets`** — the image registry. The two out-of-band importers the audit
  named (Luna window-control buttons, the Start-button spritesheet) now resolve
  through `XP_ASSETS`; `WindowControls.tsx` and `StartButton.tsx` read from it.
- **`styles`** — reusable styled-components fragments (`button`, `scrollbar`,
  `titleBar`, `trackbar`).
- **`chrome?`** — the *shape* of the window/taskbar/menu component slots. Left
  unpopulated: XP wires its chrome directly, and authoring real alternate chrome
  (Aero glass, macOS traffic lights, a dock) is the large tail that only pays off
  once a second theme exists.

The contract and `xpTheme` are exported from the public `./theme` subpath
alongside the existing `COLORS` / `xpButtonStyles`.

## The invariant (CI-enforced)

The engine must never import the theme layer — a theme is selected *above* the
engine, not reached into from inside it. `npm run guard:purity` fails if any file
under `src/context`, `src/hooks`, `src/utils`, `events.ts` or `snapshot.ts`
imports from `src/themes/`. (`src/themes/` may of course use colour literals —
that is the whole point of the layer.)

## De-hardcoding is opportunistic

~1,373 inline hex literals across the components still bypass `COLORS`. Routing
them through tokens is the dominant cost of runtime theme-switching, and it is
**not** a workstream of its own: migrate inline values to `COLORS` **whenever you
touch a component**, which is exactly FIDELITY §K STY-03's existing plan. The
`guard:purity` hex ratchet only ratchets down, so the debt can only shrink.

## Known follow-ups (deferred from #135)

- **Sounds**: `soundManager` lives in `src/utils` (engine) and so cannot import
  `src/themes` under the invariant. Moving sound-file bindings behind the theme
  needs runtime injection (register the theme's sound map into the facade at
  startup) — a follow-up. The `sounds.*` API is already theme-neutral.
- **`scoped.css` split**: separate the XP-specific slice (Tahoma `@font-face`,
  `.cur` cursors, focus overrides) from the theme-agnostic scaffold. The CSS
  scoping plugin's file matcher is already parameterised (`xpCssScopePlugin`) so a
  second sheet can be scoped identically.
- **Chrome slots**: populate `OSTheme.chrome` and select chrome by theme — only
  meaningful with a real second theme.
