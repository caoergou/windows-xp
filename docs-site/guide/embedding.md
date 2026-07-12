---
title: Embedding in a host app
---

# Embedding in a host app

```jsx
<WindowsXP mode="embedded" storagePrefix="myapp_xp_" />
```

- **`mode="embedded"`** disables all global interceptors (right-click block,
  devtools block, Alt+F4/Alt+Tab, idle screensaver) in one switch. Individual
  `disable*` props override the mode defaults, e.g.
  `mode="embedded" disableScreenSaver={false}` keeps the screensaver.
- **Styles never leak.** Every xp.css rule is rewritten at build time under
  `:where(.windows-xp-root, .windows-xp-portal)` — importing `style.css`
  cannot restyle your host page's body, buttons, or form controls.
- **Storage is per-instance.** Each `<WindowsXP/>` gets an isolated storage
  handle namespaced by `storagePrefix` (its own localStorage keys + its own
  IndexedDB connection). Two instances with different prefixes on one page
  keep fully separate filesystems, windows, and login state.
- **i18n is isolated.** The library runs its own i18next instance and never
  initializes the global singleton, so it cannot conflict with your app's
  i18next setup.

### Persistence modes (#138)

Persistence is per-instance and selectable — because a campaign page wants
every visitor to start clean, while a game wants progress saved:

```jsx
<WindowsXP persistence="none" />   // pristine every mount (campaigns, blogs, sandboxes)
```

| Mode | Metadata (windows, fs tree, wallpaper) | File content | Survives |
| --- | --- | --- | --- |
| `'local'` *(default)* | localStorage | IndexedDB | across visits |
| `'session'` | sessionStorage | in-memory | reload within the tab; gone on close |
| `'none'` | in-memory | in-memory | nothing — every mount is pristine |

- `'none'` **never opens IndexedDB**, so shared/kiosk machines leave no trace
  and two consecutive mounts render identical desktops regardless of what the
  previous visitor did.
- `customFileSystem`, culture packages, and `openOnLoad` still apply on **every**
  mount in all modes — only *user-made* changes are (or aren't) persisted.
- `getSnapshot()` works in every mode, so a visitor can still export ("save your
  toy") from an otherwise-ephemeral `'none'` or `'session'` desktop.
- Window-restore-on-reload simply no-ops in `'session'`/`'none'` — expected.

### Campaign skinning (#139)

For a marketing or personal-brand deployment, the boot and login screens are
the opening shot. Skin them with the `boot` and `login` prop groups — image
URLs, strings, and CSS values inside the XP-shaped flow. Defaults stay
pixel-faithful XP; setting **any** field on a screen suppresses the remaining
Microsoft trademarks on it (no half-branded frankenscreens):

```jsx
import { WindowsXP } from '@caoergou/windows-xp';

<WindowsXP
  // The whole desktop is yours (no built-in shortcuts), pristine per visitor…
  fileSystemMode="replace"
  persistence="none"
  customFileSystem={campaignFiles}
  openOnLoad="Teaser.txt"           // land straight on the hero content (#136)
  // …behind a branded first five seconds:
  boot={{ logo: '/brand/logo.png', text: 'ACME 2000', progressColor: '#ff6600', startupSound: '/brand/chime.mp3' }}
  login={{ title: 'ACME Portal', background: '/brand/login-bg.jpg', userTile: '/brand/tile.png', userName: 'Guest' }}
/>;
```

- `login.userTile` / `login.userName` extend the top-level `avatar` / `username`
  props — set either pair; the `login` group wins on the login screen.
- `boot.startupSound` plays instead of the XP chime and honors the volume/mute
  plumbing; `boot.progressColor` swaps the XP loading GIF for a branded bar.
- Shutdown and BSOD text stay XP (BSOD copy is a scenario action, not branding).

Combine with `fileSystemMode="replace"` (#77), `persistence="none"` (above), and
deep links (#136) and you have boot → login → desktop with zero Microsoft
branding, from props alone — no fork, no CSS surgery.


## Small screens & mobile (#215)

The shell is authored against a **1024×768 baseline**. Rather than reflow it on
a phone (XP has no portrait form — reflowing would break the simulation), the
whole desktop **scales to fit**, letterboxed. Nothing moves; it's just smaller,
and every #125 touch gesture still drives it. The full rationale and the
rejected alternatives live in
[`docs/VIEWPORT.md`](https://github.com/caoergou/windows-xp/blob/main/docs/VIEWPORT.md).

Control it with the `viewportPolicy` prop:

| value | behaviour |
|---|---|
| `'auto'` — default in `fullscreen` | Native at ≥ baseline; scale-to-fit when the container is narrower than 1024px. The desktop is unchanged; a phone gets the whole desktop. |
| `'native'` — default in `embedded` | Never scale — the host controls an embedded desktop's size. |
| `'scale'` | Always fit the baseline to the container (even on desktop). |
| `'warn'` | Never scale; show the mobile hint. |

### Minimum-viable viewport matrix

| Viewport | Path |
|---|---|
| ≥ 1024×768 (desktop, tablet landscape) | Native, unchanged. |
| Landscape phone (812×375, 667×375) | Scale-to-fit — the full desktop, comfortably touch-driven. |
| Portrait phone (375×667, iPhone SE) | Scale-to-fit (≈0.37×) **plus** a "rotate for a larger view" nudge. |
| Embedded | Scales to the host container, not the window (`'native'` by default). |

```jsx
// Make an embedded desktop scale-to-fit on phones too:
<WindowsXP mode="embedded" viewportPolicy="auto" />
```
