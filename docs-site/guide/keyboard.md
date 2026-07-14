---
title: Keyboard shortcuts
---

# Keyboard shortcuts

Every **global** and **app-command** shortcut goes through one central keymap. `Mod` is the platform primary modifier — **Ctrl** on Windows/Linux,
**⌘ Cmd** on macOS — so bindings work on a Mac without extra config.

| id | Default | Scope | Action |
|---|---|---|---|
| `startMenu.toggle` | `Ctrl+Esc` | global | Open the Start menu (Win-key substitute) |
| `window.close` | `Alt+F4` | global | Close the focused window |
| `switcher.next` | `Alt+Tab` | global | App switcher |
| `egg.bsod` | `Ctrl+Shift+Alt+B` | global | Blue Screen easter egg |
| `desktop.selectAll` | `Mod+A` | desktop | Select all icons |
| `desktop.rename` | `F2` | desktop | Rename icon |
| `desktop.delete` | `Delete` | desktop | Send to Recycle Bin |
| `desktop.open` | `Enter` | desktop | Open selection |
| `paint.save` / `paint.open` | `Mod+S` / `Mod+O` | app | Paint save / open |
| `minesweeper.newGame` | `F2` | app | New game |

**Remap or disable** any of them with the `keymap` prop — an embedding host can
reclaim keys without forking:

```jsx
<WindowsXP
  keymap={{
    'startMenu.toggle': 'Mod+Shift+X', // remap
    'window.close': null,              // disable
  }}
/>
```

`disableGlobalShortcuts` is sugar for disabling the entire `global` scope.

**Feasibility matters.** The browser reserves some keys (`Ctrl+W`/`T`/`N`,
`Ctrl+L`, `F11`) — pressing them can close the visitor's tab or open a new
window, and the page can't stop it. None of those ship as bindings (e.g. Notepad
"New" is menu-only, not `Ctrl+N`). The full per-OS/browser audit and the
substitutes for blocked XP keys live in [`docs/KEYMAP.md`](https://github.com/caoergou/windows-xp/blob/main/docs/KEYMAP.md).

