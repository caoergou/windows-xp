# AGENTS.md — Project Overview & Core Principles

> This is the high-level overview (similar in role to `CLAUDE.md`): it only explains what the project is, the three core principles, and "where to find the detailed rules". **Do not pile concrete rules into this file** — each rule has its proper home (see the doc map).

## Project Positioning

An **embeddable, customizable, scriptable Windows XP desktop engine npm package** (`@caoergou/windows-xp`), not a one-off simulator page. Target scenarios: personal homepage shell, brand marketing pages, web puzzle games, nostalgia content sites, teaching sandbox (scenario-by-scenario requirements are derived in `docs/USE-CASES.md`).

Platform-level vision (#143 RFC, `docs/OS-PLATFORM-VISION.md`): the engine gradually decouples from "XP"; the OS itself becomes a definable package — XP is the first and default OS package. Until then, the fidelity-first principle remains unchanged.

## Three Core Principles (in priority order)

1. **Fidelity first**: faithfully reproduce XP, do not produce a "modernized" version. Every visual/interaction decision should map to a counterpart in XP (screenshot, screen recording, or reference implementation); do not "beautify" on your own, even if it looks better. The only exception is accessibility improvements (keyboard reachability, ARIA), and these must not change the visual presentation.
2. **Package-first (embedding-safe)**: any code may run inside someone else's application. Do not add new global side effects, do not hijack the host page, and storage must always go through the prefixed utility layer.
3. **Mechanism and content separation**: desktop content (files, shortcuts, story, cultural elements) is described with declarative data; components only implement mechanisms. Test: **adding one piece of content should not require writing React code**.

## Doc Map

| You want to know… | Go here |
|-----------|--------|
| Consumer API: props, events, ref, subpath imports, content/culture package authoring | `USAGE.md` |
| Architecture, directory structure, dev commands, how to add an app/file | `CLAUDE.md` |
| What a visual/interaction looks like in real XP, how far it is now, authoritative **token values** for colors/fonts | `FIDELITY.md` (§K.1 token table, every value with source) |
| How to write code: component conventions, quality red lines, i18n, Easter-egg policy, pre-commit checklist | `docs/DEVELOPMENT.md` |
| Workflow: how to run checks, open PRs | `CONTRIBUTING.md` |
| Roadmap and task breakdown | GitHub issue #86 (Roadmap) + #143 (platformization RFC) |
| What each of the five usage scenarios needs (blog/marketing/game/nostalgia/teaching) | `docs/USE-CASES.md` |
| Mechanism → event → orchestration derivation for the puzzle game | `docs/PUZZLE-DESIGN.md` |
| Multi-OS / custom OS platform architecture | `docs/OS-PLATFORM-VISION.md` |
| July 2026 full audit (current state, gaps, issue index) | `docs/PROJECT-ANALYSIS-2026-07.md` |

## Top Ten Most Frequently Violated Red Lines (quick reference)

1. Do not add visuals/interactions that XP did not have (modern rounded corners, soft shadows, edge snapping, smooth scrolling).
2. Colors/fonts must use the token values in `FIDELITY.md` §K.1, **no ad-hoc color values**; for Chinese fonts prefer Songti (YaHei is Vista+).
3. No new `window`-level listeners, bare global CSS selectors, or module-level singletons.
4. localStorage/IndexedDB must go through the `storagePrefix`-aware utility layer.
5. Window `componentProps` must be serializable (the key to refresh recovery).
6. Non-DOM props on styled-components must be prefixed with `$`.
7. Do not add new `@ts-nocheck` / `any`.
8. All user-facing copy must be i18n keys; hardcoded Chinese or English is forbidden.
9. Sounds must go through the `soundManager` event mapping; `new Audio` is forbidden.
10. PRs that change interaction/style must update the corresponding entry status in `FIDELITY.md`.
11. **Mechanism and "the XP look" must be layered** (preparation for #143): engine directories (`context`/`hooks`/`utils`/`events.ts`/`snapshot.ts`) must not contain color literals, xp.css dependencies, or XP-specific chrome assumptions — `guard:purity` is enforced in CI.
12. Inline hex color stock must only **decrease** (`guard:purity` ratchet count); new app menus pass structured data to `XPMenuBar`, never hand-roll menu DOM (paving the way for #128 `menus:` migration).

## Reference Resources

- `FIDELITY.md` appendix lists all authoritative references (xp.css, winXP, system color对照表 / system color mapping table, sound scheme documentation).
- Final arbiter: real Windows XP SP3 virtual machine testing.
