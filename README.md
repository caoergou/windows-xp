# Windows XP Desktop Engine 🖥️

<div align="center">

**An embeddable, scriptable Windows XP desktop for React — a nostalgic world you can fill with your own content, watch through events, and drive from code.**

[![npm version](https://img.shields.io/npm/v/@caoergou/windows-xp.svg)](https://www.npmjs.com/package/@caoergou/windows-xp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

[Live Demo](https://eric.run.place/windows-xp/) · [English desktop](https://eric.run.place/windows-xp/demo/en/) · [中文桌面](https://eric.run.place/windows-xp/demo/zh/) · [Usage Guide](USAGE.md) · [Roadmap](https://github.com/caoergou/windows-xp/issues/86) · [Report Bug](https://github.com/caoergou/windows-xp/issues)

> The live demo is a real, running desktop you can drag — no login needed (the demos auto-sign-in). The two desktop links above drop you straight into the English or Chinese world.

English | [简体中文](README.zh-CN.md)

</div>

---

Remember the Luna-blue taskbar, the startup chime, the hours lost to Minesweeper? This project recreates that world in the browser — **not as a fixed demo page, but as a React component you own**: replace every file on the desktop with your content, subscribe to everything the user does, and script what happens next.

> **Disclaimer:** An independent, fan-made recreation for nostalgic and educational purposes. Not affiliated with or endorsed by Microsoft Corporation. All trademarks belong to their respective owners.

## Quick Start

```bash
npm install @caoergou/windows-xp
```

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  return <WindowsXP autoLogin skipBoot />;
}
```

Only three peer dependencies (`react` 18/19, `react-dom`, `styled-components` v6) — everything else, including the XP theme CSS, is bundled.

## Why this one?

Plenty of projects *look* like Windows XP. This one is built to be **used inside your product**:

- 🧩 **Embeds without side effects** — every style is scoped under `.windows-xp-root` (your host page's buttons stay yours), `mode="embedded"` disables all global interceptors, and `storagePrefix` gives each instance fully isolated storage. Two desktops on one page just work.
- 📡 **Everything is an event** — `onEvent` streams typed events for every user action: `file:open`, `app:launch`, `cmd:exec`, `session:login`, window lifecycle… Analytics, guided demos, and puzzle logic all hang off one prop.
- 🎮 **Drive it from code** — the imperative `ref` handle (`XPHandle`) opens apps and files, reads/writes the filesystem, controls the session and wallpaper, and can snapshot the whole machine to a shareable JSON save (`getSnapshot`/`loadSnapshot`).
- 📦 **Your world, not ours** — `customFileSystem` + `fileSystemMode="replace"` swap the entire desktop for your content; inject wallpapers, avatar, custom apps, and whole culture packages as props. Adding content never requires writing React.
- 🧱 **A component library, too** — `XPButton`, `XPDialog`, `XPTabs`, `XPProgressBar` and friends work standalone with zero providers, matching xp.css value-for-value (see the [gallery](https://eric.run.place/windows-xp/gallery/)).
- 🔍 **Fidelity as a discipline** — every visual and behavioral detail is audited against real XP SP3 in [FIDELITY.md](FIDELITY.md), with design tokens sourced and visual-regression baselines in CI. No "modernized" rounded corners here.

## What people build with it

| Scenario | The relevant pieces |
|---|---|
| **Portfolio / personal site** — your projects as desktop folders, About.txt in Notepad | `fileSystemMode="replace"`, custom apps, IE renders your deployed projects |
| **Puzzle game / ARG** — locked folders, chat-log clues, a desktop that reacts to the player | `locked`/`password`/`broken` file attributes, `onEvent`, the [scenario system](https://github.com/caoergou/windows-xp/issues/84) (in progress) |
| **Marketing / creative campaign** — a branded Y2K world (see A24's *Y2K* promo site for the genre) | embedded mode, content replacement, wallpaper/avatar injection |
| **Nostalgia content site** — 2000s Chinese internet or Western Y2K, as data | culture packages (`cultures` prop) |
| **Teaching sandbox** — a risk-free machine to demonstrate on | `skipBoot`/`autoLogin`, imperative handle, isolated storage |

The full scenario-by-scenario design work lives in [`docs/USE-CASES.md`](docs/USE-CASES.md), [`docs/PUZZLE-DESIGN.md`](docs/PUZZLE-DESIGN.md) and [`docs/OS-PLATFORM-VISION.md`](docs/OS-PLATFORM-VISION.md).

## Configuration at a glance

```jsx
<WindowsXP
  // identity & flow
  username="Admin" password="hunter2" autoLogin skipBoot
  // content
  language="en" customFileSystem={myFs} fileSystemMode="replace"
  wallpapers={[myWallpaper]} defaultWallpaper="my-wallpaper" avatar="/me.png"
  cultures={[myCulture]} apps={[myApp]}
  // host integration
  mode="embedded" storagePrefix="myapp_xp_"
  // observability
  ref={xpRef} onEvent={(e) => console.log(e.type, e)}
/>
```

Custom filesystem entries merge into the desktop root (top-level keys become desktop items):

Top-level keys are merged into the desktop root — so put files and folders at the top level (do **not** wrap them in a `"Desktop"` folder):

```jsx
const myFs = {
  'ReadMe.txt': { type: 'file', name: 'ReadMe.txt', app: 'Notepad', content: 'Hello!' },
  'Projects':   { type: 'folder', name: 'Projects', children: { /* … */ } },
};
```

Every prop, the event catalog, the `XPHandle` methods, culture-package authoring, and subpath imports (`/components`, `/apps`, `/hooks`, `/theme`, `/registry`) are documented in **[USAGE.md](USAGE.md)**.

## Built-in applications

**Complete:** Explorer (with keyboard support — F2/F5/Del, Backspace = up), Notepad (undo/find/replace/word-wrap/save), Paint (draws & saves into the virtual filesystem), Internet Explorer (history, favorites, era portals), Calculator, Minesweeper (XP sprites, best times), Solitaire (full rules & win detection), Command Prompt (real command set + easter eggs), Photo Viewer, Run dialog, Volume Control, Help and Support, Task Manager.

**Era apps (Chinese culture package):** QQ Login, 360 Safe Guard (with a working "threat scan" storyline), Thunder, Kugou Music, Baofeng Player, WPS Office.

**UI shells (present, intentionally shallow):** Windows Media Player (plays a bundled sample), Control Panel (display/sound/mouse applets), Network Connections.

Plus the system itself: boot screen → login → desktop, Start menu, taskbar & tray, context menus, Recycle Bin, screensaver, BSOD (yes, you can trigger it — try `format c:`).

## Project direction

The roadmap lives in [issue #86](https://github.com/caoergou/windows-xp/issues/86): near-term — ship the engine APIs (events, imperative control, save/load) and the declarative **scenario system** so puzzle stories are pure JSON; long-term — [OS packages](docs/OS-PLATFORM-VISION.md): the engine decoupled from "XP" so Win98/Win7/Aqua-like and even **user-defined fictional systems** become installable packages.

## Contributing & docs

| Doc | What's in it |
|---|---|
| [USAGE.md](USAGE.md) | Consumer API: props, events, ref, subpaths, authoring |
| [FIDELITY.md](FIDELITY.md) | The XP-authenticity baseline: per-behavior scoring + design tokens |
| [AGENTS.md](AGENTS.md) / [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Principles & code rules for contributors |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Workflow, checks, PR expectations |
| [docs/](docs/) | Design & analysis: use cases, puzzle design, platform vision |

## Tech stack & support

React 18/19 · TypeScript 5 · styled-components 6 · xp.css (build-time scoped) · react-draggable/-resizable · i18next (isolated instance). Browsers: Chrome/Edge 90+, Firefox 88+, Safari 14+.

## License & acknowledgments

MIT — see [LICENSE](LICENSE). Built on the shoulders of [xp.css](https://botoxparty.github.io/XP.css/), inspired by [winXP](https://github.com/ShizukuIchi/winXP).

**Assets:** system icons ([XPIcons](https://github.com/iconicX/XPIcons), [react-xp](https://github.com/zyishai/react-xp)), official XP wallpapers, real `.cur` cursors, original XP event sounds, xp.css fonts, Minesweeper sprites, and boot-screen timing referenced from [PlymouthXP](https://github.com/nulln/PlymouthXP) are used **for educational and nostalgic purposes only**, remain the property of their respective owners, and are not covered by the MIT license.

<div align="center">
Made with ❤️ and nostalgia for the millennium era
</div>
