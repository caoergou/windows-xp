# OS-PLATFORM-VISION.md — From XP Simulator to OS-Simulation Platform

> Strategic design document. Question posed by the maintainer: what if this
> project is not an XP simulator but an **operating-system simulator** — able to
> host Win7, macOS-like systems, and ultimately **user-defined, custom OS
> styles**? What does that imply for the architecture and the iteration path?
>
> Companion docs: `PROJECT-ANALYSIS-2026-07.md` (state), `PUZZLE-DESIGN.md`
> (game derivation), `USE-CASES.md` (scenario derivation). Prerequisite issue:
> #135 (theme seams). This document goes one level above #135.

## 1. The central insight: an OS style is not a theme

#135 correctly handles the *visual* layer (tokens, CSS sheets, asset
registries). But a different OS is not a reskin — it differs on three levels:

| Level | Example differences | What it demands |
|---|---|---|
| **Skin** (colors, textures, fonts, sounds, cursors) | Luna gradients vs Aero glass vs Aqua brushed metal | #135's token/asset indirection — solved there |
| **Layout** (which shell surfaces exist and where) | Taskbar+Start vs Dock+global menu bar; window buttons right vs **left**; system tray vs menu extras | **Chrome slots**: pluggable components for window decoration, shell bars, launcher |
| **Behavior** (how the system *acts*) | XP minimize→taskbar button vs macOS minimize→Dock genie; maximize vs macOS "zoom"; in-window menus vs **global menu bar**; Ctrl vs **Cmd**; modal dialogs vs macOS **sheets** | **Behavior profile**: engine hooks for focus/minimize/menu/dialog/keyboard semantics |

The acid test is the **macOS global menu bar**: menus don't live in the window.
Any architecture that can't move an app's menus out of its window frame is a
theme system, not an OS platform.

## 2. The unifying concept: everything is a package

The project has independently evolved four package-shaped extension points:

- **Culture package** (#77/#129): *what content* is on the machine
- **Scenario package** (#84): *what story* the machine tells
- **Lesson package** (#141): *what the machine teaches*
- **Theme** (#135): *what the machine looks like*

The platform move is to complete the set with the **OS package** — *what
machine it is* — and make the engine a pure runtime that consumes all five:

```
Engine (window manager, FS, events, storage, scenario/lesson runtimes, registries)
  └── OS package        → the machine (chrome, behavior, sounds, conventions)
        └── Culture package  → the content on it
              └── Scenario / Lesson packages → what happens on it
```

### The OS package contract (sketch)

```ts
interface OSPackage {
  id: string;                    // 'xp' | 'win7' | 'aqua-like' | 'hypn-os' | …
  theme: ThemeSpec;              // #135: tokens, scoped CSS sheet, asset registry, cursors, fonts
  chrome: {                      // LAYOUT-level slots (React components)
    WindowDecoration;            // title bar, buttons (side, order, semantics), borders
    shellSurfaces: ShellSurface[]; // taskbar / dock / global menu bar / side panels — each with position + role
    Launcher;                    // Start menu / Dock grid / app menu
    SystemDialogs;               // alert/confirm chrome; sheets vs floating
    BootScreen; LoginScreen;     // (subsumes #139's branding at the package level)
  };
  behavior: BehaviorProfile;     // BEHAVIOR-level hooks (data + strategy fns, not free React):
                                 //  menuModel: 'in-window' | 'global-bar'
                                 //  minimizeTarget: 'shell-button' | 'dock-icon'
                                 //  maximizeSemantics: 'fill' | 'zoom'
                                 //  primaryModifier: 'ctrl' | 'meta'   (feeds #132 keymap)
                                 //  windowAnimations, focusRules, dialogModality
  sounds: SoundScheme;           // event→audio map behind the existing soundManager names
  conventions: {                 // world-shape rules
    pathStyle: 'drive' | 'unix'; // C:\ vs /Users — FS stays one tree; this is presentation+CMD dialect
    terminalDialect?: 'cmd' | 'sh-like';
    defaultWallpaper; iconSizes;
  };
  appRoles?: Partial<RoleMap>;   // role → implementation: files→Explorer|Finder-like, editor→Notepad|TextEdit-like…
  fidelity?: string;             // pointer to this package's own FIDELITY-style baseline doc
}
```

### Two engine refactors this forces (worth doing regardless)

1. **Menus become data.** Apps currently render `XPMenuBar` themselves. For a
   global-menu-bar OS, apps must *declare* menus (`menus: MenuSpec` via
   `defineApp`, #128) and the OS package decides where/how to render them.
   Side benefits are large even for XP-only: menu items become lesson anchors
   (#141), scenario-inspectable (#84), keyboard-accessible (#124, KBD-05 Alt
   accelerators), and theme-consistent for free.
2. **App roles.** The registry gains role indirection (`files`, `editor`,
   `browser`, `terminal`, `media`) so cultures/scenarios/lessons reference
   roles, not concrete app ids, and an OS package maps roles to
   implementations. Apps built purely from primitives + tokens inherit the OS
   look automatically; *signature* apps (Finder vs Explorer) are per-OS
   implementations sharing the engine-side logic (FS hooks, window plumbing).

## 3. Honest hard problems

- **Fidelity is the brand — and it doesn't scale for free.** The project's
  soul is that XP feels *real* (FIDELITY.md). Every official OS package needs
  its own fidelity baseline doc and visual-regression suite; that's the real
  cost of each official OS, far beyond the CSS. Rule: **official packages are
  few and deep; community packages set their own bar.**
- **Trademarks.** XP nostalgia has an established fan-recreation ecosystem;
  shipping "macOS" branding is legally sharper. Official non-Microsoft
  packages should be "-like" (Aqua-like, original assets); the **fantasy OS**
  path (below) is trademark-free by construction. Keep this in the contract
  docs.
- **Behavior hooks can explode.** The BehaviorProfile must stay a closed,
  documented set of decisions (enums + a few strategy functions), not
  arbitrary code injection into WindowManager — otherwise every OS package
  forks the engine informally and the purity invariant (#135's CI check) dies.
- **Don't break the one thing that works.** XP consumers must see zero change:
  XP becomes the default OS package, every current prop keeps working, and the
  package split is invisible until someone opts into another OS.

## 4. Why "custom OS" is the killer feature (not macOS)

Replicating real OSes is the obvious road; **fictional OSes are the
differentiated one** — and every prior derivation in this repo points at it:

- **Games (S1)**: Hypnospace Outlaw's HypnOS proves the pattern — a fictional
  OS makes the fiction airtight (TINAG), has **zero fidelity debt and zero
  trademark risk**, and becomes part of the puzzle itself (an OS whose quirks
  are clues). A scenario package that ships its own OS package is the
  strongest form of the "2007 county-town" concept.
- **Marketing (S3)**: "BrandCorp OS" is a stronger campaign than a reskinned
  XP (#139 branding is the entry drug; an OS package is the full experience).
- **Teaching (S5)**: lessons on a neutral fictional OS teach *concepts*
  (files, windows, installing) without brand baggage — relevant for digital
  literacy curricula.
- **Community**: `defineOS()` completes the `defineApp`/`defineCulture`/
  `defineLesson` authoring story (#128/#129/#141) — the platform's whole DX
  converges on "define a package, get validation + gallery + docs."

## 5. Iteration path (each phase shippable, each validates the previous)

- **Phase A — seams (= #135, already filed).** `themes/xp/` consolidation,
  token indirection, asset registries, engine-purity CI. No behavior change.
- **Phase B — the shell contract.** Define `OSPackage`/`BehaviorProfile`
  types; carve chrome slots (WindowDecoration, shell surfaces, Launcher,
  SystemDialogs, Boot/Login); **menus-as-data**; app roles. XP becomes the
  first OS package and the engine consumes it *exclusively through the
  contract* (dogfood proof; visual suite must stay green pixel-for-pixel).
- **Phase C — second official package to validate the contract.** Recommend
  **Win98 or Win7** first (98.css/7.css exist in the same class-convention
  family; shell model is structurally close — validates skin+chrome cheaply),
  and only then an **Aqua-like** (validates the hard parts: global menu bar,
  dock, left-side buttons, sheets, Cmd). Each ships with its own fidelity doc
  + visual baselines.
- **Phase D — `defineOS()` and the fantasy path.** Authoring factory +
  validation + docs + a small **original fictional OS** as the reference
  package (doubles as the official puzzle-game's OS). Community packages
  become possible; the marketplace story (packages referencing packages)
  starts here.
- **Naming/positioning (decision for the maintainer, no action now):** the
  npm name `@caoergou/windows-xp` describes phase-A reality. If phases B–D
  land, an engine/package split (`…/engine` + `…/os-xp` + …) becomes natural;
  structure today's subpath exports so that split stays possible without
  breaking consumers.

## 6. What this changes about current issues (nothing breaks, some get context)

- #135 is Phase A verbatim — unchanged, now with a stated destination.
- #139 (branded boot/login) becomes the prop-level subset of the OS package's
  Boot/Login slots — build it as designed; it migrates into the contract later.
- #132 (keymap) gains `primaryModifier` as an OS-package input.
- #128's `defineApp` should anticipate `menus:` (data) and `role:` fields —
  cheap to reserve now, expensive to retrofit.
- FIDELITY.md scopes to the XP package (rename/move when Phase B lands);
  AGENTS.md's visual rules likewise become XP-package rules.
- Everything engine-side already filed (#84/#115–#119/#130/#136–#138/#141/#142)
  is OS-agnostic by construction and unaffected.
