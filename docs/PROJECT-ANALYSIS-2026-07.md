# Project Analysis & Supplementary Issue Plan — July 2026

> A deep-dive audit of the project against the roadmap (#86): what has actually
> landed, which serious problems remain across functional design, architecture,
> packaging/exports, gameplay, customizability, API ergonomics and overall
> completeness — and the resulting supplementary issue list (#112–#125).
>
> Method: three independent code audits (public API & packaging; scenario-engine
> readiness; behavioral fidelity & completeness), each verified against the
> working tree with file:line evidence, cross-checked against FIDELITY.md,
> CHANGELOG.md, the CI workflows, the npm registry, and the issue tracker.

## 1. Executive summary

The roadmap's engineering phases are in better shape than the tracker suggests:
Phase 0 (packaging), Phase 2 (architecture debt) and Phase 1 (customization +
component productization) have all landed on `main` — event bus, imperative
ref, replaceable content, per-instance storage, standalone primitives, the
first #87 fidelity batches. Code quality gates (`tsc` clean, no `@ts-nocheck`,
~250 unit tests) are real.

The severe problems are no longer *inside* the code — they are at the
boundaries:

1. **The product has never shipped.** npm still serves 0.2.0; there are zero
   git tags; ~457 CHANGELOG lines sit under `[Unreleased]`. Every advertised
   differentiator (events, embedded mode, 3MB bundle, primitives) is
   uninstallable. (#113)
2. **CI does not guard what the roadmap says it guards.** PRs run only a visual
   snapshot job; the full unit suite runs nowhere on PRs; e2e runs nowhere at
   all; the publish workflow can never authenticate to npm; one e2e spec is
   known-failing. (#112)
3. **The imperative/actuation half of the engine API is missing.** Hosts can
   *observe* the desktop (`onEvent`) but barely *drive* it — no filesystem
   writes, no unlock, no wallpaper/session control, no state snapshot, and
   `reset()` leaks IndexedDB. The scenario system (#84) cannot be built on the
   current surface. (#115, #116, #117, #118)
4. **The narrative delivery layer for the ARG vision doesn't exist.** No QQ
   chat, no generic notification API, no flags, no save-sharing. The content
   seeds are authored; the machinery to *push* story at the player is absent.
   (#118, #119, #84)
5. **Docs have drifted from reality in both directions** — README hides the
   product's best features and falsely calls finished apps "coming soon";
   USAGE carries obsolete caveats. (#114)

## 2. Findings by dimension

### 2.1 Functional design & completeness

**Strong:** boot/login/desktop loop, window management (post-#80 refactor),
virtual FS with locked/password/broken semantics and robust persistence
(post-#81), 20+ apps of which Notepad, Paint, Solitaire, Minesweeper,
Calculator, Explorer and CMD are genuinely deep. The gallery route +
visual-regression baselines productize the primitives.

**Gaps (highest user-perceived first):**

- Signature XP behaviors still missing: minimize/maximize animations
  (`Window/index.tsx:65` returns `null` instantly), true modal behavior
  (parent-disable + flash + ding; `ModalContext` renders one global overlay
  with no window association), taskbar grouping, cascade/tile. These remain
  #87's second batch — correctly tracked, not re-filed.
- **Cascade/tile regressed from "disabled" to "enabled no-op"**
  (`Taskbar/index.tsx:383-385` — items lost their `action`). Filed in #121.
- Explorer is one fixed view with zero keyboard support while the Desktop got
  full keyboard treatment in #87 — the asymmetry is now conspicuous. Filed as
  its own scoped issue, #120.
- Error/warning sounds are defined but have **no callers** (`criticalStop()`
  / `exclamation()` never invoked) — stays in #87 batch 2.
- Mobile: a dismissable warning, then a desktop that ignores touch. #125.
- Accessibility: ~48 scattered aria attributes, no focus management at all;
  notably, the missing pieces (focus trap, Enter/Esc semantics, dotted focus
  rectangle) are *also* XP fidelity items DLG-03/04/STY-09. #124.

### 2.2 Architecture

Post-refactor architecture is sound: provider layering, single app registry,
per-instance `StorageProvider`, one event bus per instance, diff-aware
persistence with tombstones. Two structural debts worth naming:

- **Event emission lives in an inconsistent layer**: wrapped mutations in
  `FileSystemContext/index.tsx` emit; pass-throughs (`updateFile`, `moveFile`,
  `copyFile`, `deleteFolder`, `emptyRecycleBin`) don't, and
  `useFileOperations.ts` emits nothing. Content edits — the classic puzzle
  signal — are invisible to the bus. #116.
- **Red-line violations crept back in**: Notepad's global
  `window.addEventListener('keydown')` (`Notepad.tsx:1173`) breaks the
  embedding-safety rule the project itself wrote; `getFileProperties` returns
  hardcoded Chinese regardless of locale. #121.

### 2.3 Packaging & exports

- `sideEffects` lists `src/` paths that never ship in the tarball, so the
  built entry carrying the i18n `init()` side effect is implicitly declared
  side-effect-free — a tree-shaking time bomb. #113.
- No `/events` subpath; `EventBusProvider` unexported; `XPEvent`/`XPHandle`
  types reachable only from the root entry. #122.
- `.d.ts` generated against `@types/react@18` while peers allow React 19. #122.
- SSR: no module-scope crashes (storage access is guarded), but Next.js users
  need `ssr: false` and nothing documents it. #114.
- Release discipline: see §1 item 1. #113.

### 2.4 Gameplay & scenario-engine readiness (vs #84)

The observation half (event bus) is ~70% ready; the actuation and state halves
are at zero:

| #84 needs | Status | Filed |
|---|---|---|
| Triggers on events | Bus exists; key events missing (`file:update`, `password:fail`, `ie:navigate`, move/copy) | #116 |
| `unlockNode` action | `checkAccess` never persistently unlocks | #115 |
| `addFile`/`removeFile` actions | Exist in context, unreachable from outside React | #115 |
| `showPopup` action | Only the hardcoded, zh-only `AntivirusPopup` | #118 |
| `qqMessage` action | No QQ chat exists at all; `qqMessage()` sound + `emojiRenderer` are dead code | #119 |
| `flags` + persistence | Nothing; persistence schema has no slot | #117 |
| Timer triggers | Nothing | stays in #84 |
| Save/share progress | No serialize/import anywhere | #117 |

With #115–#119 landed, #84's interpreter becomes a thin JSON-driven client of
already-tested APIs — the right shape for "scenario authors don't write React".

### 2.5 Customizability

#77 delivered genuine strength: `fileSystemMode="replace"`, wallpapers/avatar
injection, culture packages, custom apps, storage isolation. Remaining gaps:

- `apps`/`cultures` props are mount-only while USAGE implies re-passing works —
  silent contract mismatch. #122.
- `useApp().fs` is read-only, so sanctioned custom apps can't write files. #122.
- The `en` culture package is a skeleton (1 desktop shortcut vs zh's 6; the
  five planned western apps exist only as strings), which also keeps one e2e
  spec permanently red. #123.

### 2.6 API ergonomics

The declarative surface is good. The imperative surface (`XPHandle`, 5 methods)
is ~20% of what the target scenarios need; `reset()` is the one outright bug
(clears localStorage but not IndexedDB, hardcodes the `xp_` prefix). #115.

### 2.7 Documentation & process

Docs are unusually disciplined in structure but drifted in content — README
understates (missing every Phase-0/1 feature; false "coming soon" claims),
USAGE carries an obsolete storage caveat, CLAUDE.md's app table is 6 apps
behind, FIDELITY.md underscores itself on several now-fixed items. #114 files
the sweep and extends the doc-examples regression test to README.

## 3. The supplementary issue list

Filed as #112–#125, designed to slot between the current Phase 1 wrap-up and
Phase 3 (#84/#85) in the #86 roadmap:

| # | P | Title (short) | Unblocks |
|---|---|---|---|
| #112 | P0 | CI gates tell the truth: full units + e2e on PRs, fix failing smoke spec, fix npm token | #113, all future work |
| #113 | P0 | Ship the promised releases: tag/publish 0.4.0, backfill CHANGELOG, fix `sideEffects` | the entire product story |
| #114 | P0 | Documentation truth sweep | adoption |
| #115 | P1 | XPHandle v2: full imperative surface + `reset()` IndexedDB fix | #84, #117, #118 |
| #116 | P1 | Event bus coverage completion | #84 |
| #117 | P1 | Save/load snapshots + flags slot ("share a save") | #84 |
| #118 | P1 | BalloonTip notification API (generalize AntivirusPopup) | #84, FIDELITY TSK-08 |
| #119 | P1 | QQ Messenger MVP (typing effect, scripted buddies) | #84, #13 spirit |
| #120 | P1 | Explorer depth: Details view, tree pane, keyboard nav, address history | #87's Explorer chapter |
| #121 | P1 | Correctness debt batch (Notepad global keydown, no-op cascade/tile, i18n leak, dialog chrome, MobileWarning style) | embedding trust |
| #122 | P2 | Prop reactivity & composability (apps/cultures sync, useApp writes, EventBusProvider export) | integrators |
| #123 | P2 | en culture parity (western shortcuts + Winamp-class app) | intl audience, e2e green |
| #124 | P2 | Accessibility & focus management (= DLG-03/04 + STY-09) | a11y + fidelity |
| #125 | P3 | Touch support (tap/long-press/drag mapping) | mobile visitors |

### Dependency sketch

```
#112 ──→ #113 (publish needs working CI/token)
#115 ──→ #117 (snapshot rides the handle)
#115 + #116 + #117 + #118 + #119 ──→ #84 (scenario = JSON client of these APIs)
#123 ──→ closes the e2e spec #112 fixmes
#121/#120 ──→ FIDELITY score updates (#87 bookkeeping)
```

### Suggested phase mapping (proposal for updating #86)

- **Phase 1.5 — "Actually ship it" (0.4.x):** #112, #113, #114, #121. One
  short hardening pass; ends with the first real npm release since 0.2.0.
- **Phase 2.5 — "Engine API" (0.5.0-pre):** #115, #116, #117, #118, #119 —
  the concrete prerequisites #84 was waiting on, plus #120 for daily-driver
  depth. #87 batch 2 (animations, modality, sounds) continues in parallel as
  the fidelity thread.
- **Phase 3 — unchanged (#84 MVP + prologue demo)**, now with a much thinner
  interpreter to build.
- **Phase 4 — reach:** #122, #123, #124, #125 — integrators, international
  audience, accessibility, mobile.

## 4. What was deliberately *not* filed

- Window animations, true modality, taskbar grouping, sound wiring — already
  tracked as #87 batch 2; re-filing would fragment it.
- Scenario schema/interpreter — remains #84; this analysis only extracted its
  hard prerequisites into separately-shippable issues.
- Screensaver variety, Clippy, Konami, dial-up interstitial — remain #13;
  #119 covers the one #13 item (messenger) that graduated into a P1 because
  the scenario system depends on it.
- A docs site / Storybook — the `?gallery` route + USAGE are adequate until
  after the 0.4.x release; revisit when #78's audience materializes.
