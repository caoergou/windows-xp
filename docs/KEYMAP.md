# Keyboard shortcuts — feasibility audit (#132)

The browser is **not** one platform. A shortcut that is authentic to XP may be
impossible to intercept in a web page, or — worse — a *near-miss* for a
browser/OS shortcut that does something destructive (close the tab, open a new
window). This document is the source of truth for **what actually works**, per
OS × browser, and the official substitute for every blocked XP original.

Legend:

- ✅ **works** — the page reliably receives the event and `preventDefault()` sticks.
- 🟦 **OS-reserved** — the OS/WM consumes it; the page may not see it (or can't stop the OS action). Ship only with a documented substitute.
- 🟥 **browser-reserved** — the browser consumes it and ignores `preventDefault()`. **Never ship as an app binding.**
- ⚠️ **dangerous near-miss** — browser-reserved *and* close to an app's intent, so a naive binding destroys the visitor's session. Must be removed or remapped.

## Modifier normalization

`Mod` = the platform's primary modifier: **Ctrl** on Windows/Linux, **⌘ Cmd**
on macOS. The keymap module normalizes `Mod` at match time, so a single
registration (`Mod+A`) is Ctrl+A on Windows and Cmd+A on a Mac. Bindings that
must stay literally `Ctrl` on a Mac (rare) use `Ctrl` explicitly.

macOS has **no Alt+F4 / Alt+Tab muscle memory**; those map to Cmd+Q / Cmd+Tab,
which the page never receives. See the substitutes below.

## Global / shell shortcuts

| Intent | XP key | Win·Chrome | mac·Chrome | Linux·Chrome | Firefox | Safari | Verdict & substitute |
|---|---|---|---|---|---|---|---|
| Open Start menu | Win | 🟥 (Win reserved by OS) | 🟦 (no Win key) | 🟥 | — | — | **Substitute: `Ctrl+Esc`** (authentic XP alias, not intercepted anywhere) — KBD-03 ✅ |
| Show desktop / Explorer / Run | Win+D / Win+E / Win+R | 🟥 OS | 🟦 | 🟥 | — | — | OS-reserved; no web substitute shipped (KBD-04) |
| Close focused window | Alt+F4 | 🟦 (Windows closes the *browser* window; page keydown can't stop it) | ✅ (Alt+F4 free on mac) | 🟦 (WM-dependent) | 🟦 | ✅ | Ship, **guarded by `disableGlobalShortcuts`**, documented Windows caveat. Not a *near-miss* — the intent (close) matches. KBD-02 |
| App switcher | Alt+Tab | 🟥 OS (keyup never arrives) | 🟥 (Cmd+Tab, OS) | 🟥 | 🟥 | 🟥 | **Substitute: `Alt+`` `** (backtick) for the in-desktop switcher overlay. KBD-01 |
| Trigger BSOD (egg) | — | ✅ | ✅ | ✅ | ✅ | ✅ | `Ctrl+Shift+Alt+B` — no conflict; guarded by `disableGlobalShortcuts` |

## Desktop / Explorer (fire only when the desktop or that window is focused)

| Intent | Key | Verdict |
|---|---|---|
| Select all icons | `Mod+A` | ✅ (now Cmd-aware via `Mod`) |
| Rename | `F2` | ✅ |
| Delete → Recycle Bin | `Delete` | ✅ |
| Open selection | `Enter` | ✅ |
| Move selection | Arrows / Home / End | ✅ |
| Explorer: up one level | `Backspace` | ✅ (guarded to the focused Explorer, never fires while typing) |
| Explorer: refresh | `F5` | ✅ (page refresh only if unhandled; we `preventDefault`) |

## App command shortcuts

| App | Key | Verdict & action |
|---|---|---|
| Notepad / Paint | **`Ctrl+N` (New)** | ⚠️ **browser-reserved: opens a NEW BROWSER WINDOW, uncancelable in Chrome.** **Removed** as a key binding — "New" stays available from the menu. |
| Notepad / Paint | `Ctrl+O` (Open) | ✅ interceptable (Chrome file dialog is cancelable via `preventDefault`). Kept. |
| Notepad / Paint | `Ctrl+S` / `Ctrl+Shift+S` | ✅ (Save dialog is cancelable). Kept. |
| Notepad | `Ctrl+F` / `Ctrl+H` (Find/Replace) | ✅ (`Ctrl+F` find-bar is cancelable). Kept. |
| Notepad | `Ctrl+Z/Y/X/C/V/A` | ✅ standard editing; fire only in the focused Notepad. |
| Calculator | digits / operators / `Enter` / `Esc` | ✅ — **fixed**: previously a global listener that fired even when Calculator was unfocused; now app-scoped. |
| Minesweeper | `F2` (new game), `Alt+G`, `Alt+H` | ✅ — **fixed**: was global; now app-scoped. `Alt+G/H` are menu accelerators. |

## Blocked / never-ship list (browser-reserved)

`Ctrl+W` (close tab), `Ctrl+T` (new tab), `Ctrl+N` (new window), `Ctrl+L` /
`Alt+D` (focus address bar), `Ctrl+Tab` (switch tab), `F11` (fullscreen) — all
🟥/⚠️. None are shipped as app bindings. `F12`, `Ctrl+U`, `Ctrl+Shift+I/J/C` are
intercepted **only** as devtools/view-source blockers (opt-out via
`disableDevToolsBlock`), never as app actions.

## Input-local keys (not shortcuts)

`Enter`/`Escape`/arrows inside a specific input or dialog (Run dialog, Command
Prompt history, QQ send, login, address-bar dropdown, modal default-button/Esc
via `useModalA11y`) are **window-local behaviors**, not global bindings. They
never collide with the host page (they only fire inside the focused control), so
they live with their component rather than in the keymap registry.

## How this maps to code

The central registry (`src/utils/keymap.ts`, provided via
`src/context/KeymapContext.tsx`) owns every **global** and **app-command**
shortcut above. Each has a stable `id`; a host can remap or disable any of them
with the `keymap` prop, and `disableGlobalShortcuts` disables the whole global
scope. Registering two handlers for the same combo in one scope logs a dev-mode
conflict warning. FIDELITY §G carries the per-row feasibility verdict sourced
from this table.
