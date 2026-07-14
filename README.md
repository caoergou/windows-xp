# Windows XP Desktop Engine 🖥️

<div align="center">

**An embeddable Windows XP desktop for React — customize it with your own files and apps, listen to user actions via events, and control it from your own code.**

[![npm version](https://img.shields.io/npm/v/@caoergou/windows-xp.svg)](https://www.npmjs.com/package/@caoergou/windows-xp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

[Live Demo](https://eric.run.place/windows-xp/) · [English desktop](https://eric.run.place/windows-xp/demo/en/) · [中文桌面](https://eric.run.place/windows-xp/demo/zh/) · [Docs](https://eric.run.place/windows-xp/docs/) · [Roadmap](https://github.com/caoergou/windows-xp/issues/86) · [Report Bug](https://github.com/caoergou/windows-xp/issues)

> The live demo is a real, running desktop you can drag — no login needed (the demos use `autoLogin`). The two desktop links above drop you straight into the English or Chinese world.

English | [简体中文](README.zh-CN.md)

</div>

---

`<WindowsXP>` is a React component that renders a complete Windows XP desktop in the browser. You drop it in, pass your own files, apps, and wallpaper as props, and listen to user actions through `onEvent`.

> **Disclaimer:** An independent, fan-made recreation for nostalgic and educational purposes. Not affiliated with or endorsed by Microsoft Corporation. All trademarks belong to their respective owners.

## Quick Start

In an existing React 18/19 project (Vite, Next.js, Create React App, etc.):

```bash
npm install @caoergou/windows-xp react react-dom styled-components
```

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  // autoLogin and skipBoot jump straight to the desktop while you are developing.
  // Remove them to see the boot screen and login.
  return <WindowsXP autoLogin skipBoot />;
}
```

`react`, `react-dom`, and `styled-components` v6 are peer dependencies; everything else, including the XP theme CSS, is bundled.

## Why this one?

Plenty of projects _look_ like Windows XP. This one is built to be **used inside your product**:

- 🧩 **Embeds without side effects** — import `style.css`; styles are scoped so they rarely leak to your host components. Use `mode="embedded"` to disable global shortcuts and right-click blocks, and give each instance its own `storagePrefix` so two desktops on one page never collide.
- 📡 **React to user actions** — `onEvent` fires a typed event for every file open, app launch, login, command, and more:
  ```jsx
  <WindowsXP onEvent={e => e.type === 'file:open' && console.log(e.path.join('/'))} />
  ```
- 🎮 **Drive it from code** — assign a React `ref` to open apps, read or write files, change wallpaper, and save/load the whole desktop as JSON:

  ```jsx
  import { useRef } from 'react';
  import type { XPHandle } from '@caoergou/windows-xp';

  const xp = useRef<XPHandle>(null);
  xp.current?.openApp('Notepad');
  // fs paths are arrays of segments: ['folder', 'file.txt']
  xp.current?.fs.writeFile(['diary.txt'], 'hello');
  ```

- 📦 **Your content, not ours** — describe the desktop as data with `customFileSystem`, `wallpapers`, culture packages (`cultures`), and custom `apps`. No React code is required to add a file or folder.
- 🧱 **Standalone XP primitives** — drop `XPButton`, `XPDialog`, `XPTabs`, `XPProgressBar`, and other XP-styled components into any page without providers:
  ```jsx
  import { XPButton } from '@caoergou/windows-xp/components';
  ```
  See the [gallery](https://eric.run.place/windows-xp/gallery/) for every primitive.
- 🔍 **Faithful to XP** — colors, fonts, sounds, and behaviors are audited against real Windows XP SP3 and documented in [FIDELITY.md](FIDELITY.md).

## What people build with it

| Scenario                                                                                                | The relevant pieces                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Portfolio / personal site** — your projects as desktop folders, About.txt in Notepad                  | `fileSystemMode="replace"`, custom apps, the built-in Internet Explorer app can open your deployed sites                                                                                            |
| **Markdown blog** — posts as `.md` files opened in the Markdown Viewer, permalinks, RSS/sitemap for SEO | `buildContentFs`/`postFromMarkdown`, deep links, `buildRssFeed`/`buildSitemap` — see [Build a blog on the desktop](https://eric.run.place/windows-xp/docs/guide/blog)                               |
| **Puzzle game / ARG** — locked folders, chat-log clues, a desktop that reacts to the player             | `locked`/`password`/`broken` file attributes, `onEvent`, the data-driven [scenario / story scripting system](https://eric.run.place/windows-xp/docs/guide/scenarios) (write puzzle stories as JSON) |
| **Marketing / creative campaign** — a branded Y2K world (see A24's _Y2K_ promo site for the genre)      | embedded mode, content replacement, wallpaper/avatar injection                                                                                                                                      |
| **Nostalgia content site** — 2000s Chinese internet or English-language Y2K, as data                    | culture packages (`cultures` prop)                                                                                                                                                                  |
| **Teaching sandbox** — a risk-free machine to demonstrate on                                            | `skipBoot`/`autoLogin`, imperative handle, isolated storage                                                                                                                                         |

The full scenario-by-scenario design work lives in [`docs/USE-CASES.md`](docs/USE-CASES.md), [`docs/PUZZLE-DESIGN.md`](docs/PUZZLE-DESIGN.md) and [`docs/OS-PLATFORM-VISION.md`](docs/OS-PLATFORM-VISION.md).

## Configuration at a glance

```jsx
// myFs, myWallpaper, myApp, xpRef are defined below or in the docs.
<WindowsXP
  // identity & flow
  username="Admin"
  password="hunter2"
  autoLogin
  skipBoot
  // content
  language="en"
  customFileSystem={myFs}
  fileSystemMode="replace"
  wallpapers={[myWallpaper]}
  defaultWallpaper="brand"
  avatar="/me.png"
  apps={[myApp]}
  // host integration
  mode="embedded"
  storagePrefix="myapp_xp_"
  // observability
  ref={xpRef}
  onEvent={e => console.log(e.type, e)}
/>
```

A complete, runnable version of the same idea:

```jsx
import { useRef } from 'react';
import { WindowsXP } from '@caoergou/windows-xp';
import { defineApp } from '@caoergou/windows-xp/registry';
import '@caoergou/windows-xp/style.css';
import type { XPHandle } from '@caoergou/windows-xp';

const myFs = {
  'ReadMe.txt': { type: 'file', name: 'ReadMe.txt', app: 'Notepad', content: 'Hello!' },
  Projects: {
    type: 'folder',
    name: 'Projects',
    children: {
      'Project A.txt': { type: 'file', name: 'Project A.txt', app: 'Notepad', content: '…' },
    },
  },
};

const myWallpaper = { id: 'brand', name: 'Brand', src: '/brand-wallpaper.jpg' };

const myApp = defineApp({
  id: 'Hello',
  name: 'Hello',
  component: () => <div style={{ padding: 16 }}>Hello from Windows XP!</div>,
});

export default function App() {
  const xpRef = useRef<XPHandle>(null);
  return (
    <WindowsXP
      autoLogin
      skipBoot
      customFileSystem={myFs}
      fileSystemMode="replace"
      wallpapers={[myWallpaper]}
      defaultWallpaper="brand"
      apps={[myApp]}
      mode="embedded"
      storagePrefix="myapp_xp_"
      ref={xpRef}
      onEvent={e => console.log(e.type, e)}
    />
  );
}
```

Top-level keys are merged into the desktop root — so put files and folders at the top level (do **not** wrap them in a `"Desktop"` folder).

Every prop, the event catalog, the `XPHandle` methods, culture-package authoring, and subpath imports (`/components`, `/apps`, `/hooks`, `/theme`, `/registry`) are documented on the **[docs site](https://eric.run.place/windows-xp/docs/)**.

## Built-in applications

**Complete:** Explorer (with keyboard support — F2/F5/Del, Backspace = up), Notepad (undo/find/replace/word-wrap/save), Paint (draws & saves into the virtual filesystem), Internet Explorer (history, favorites, era portals), Calculator, Minesweeper (XP sprites, best times), Solitaire (full rules & win detection), Command Prompt (real command set + easter eggs), Photo Viewer, Run dialog, Volume Control, Help and Support, Task Manager.

**Era apps (Chinese culture package):** QQ Login, 360 Safe Guard (with a working "threat scan" storyline), Thunder, Kugou Music, Baofeng Player, WPS Office.

**UI shells (present, intentionally shallow):** Windows Media Player (plays a bundled sample), Control Panel (display/sound/mouse applets), Network Connections.

Plus the system itself: boot screen → login → desktop, Start menu, taskbar & tray, context menus, Recycle Bin, screensaver, BSOD (yes, you can trigger it — type `format c:` in the Command Prompt).

## Project direction

The roadmap lives in [issue #86](https://github.com/caoergou/windows-xp/issues/86): near-term — ship the engine APIs (events, imperative control, save/load) and the data-driven **scenario system** so puzzle stories are authored as JSON instead of React code; long-term — [OS packages](docs/OS-PLATFORM-VISION.md): the engine decoupled from "XP" so Win98, Win7, or macOS Aqua-style and even **user-defined fictional systems** become installable packages.

## Contributing & docs

| Doc                                                                 | What's in it                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [Docs site](https://eric.run.place/windows-xp/docs/) (`docs-site/`) | Consumer API: props, events, ref, subpaths, authoring              |
| [USAGE.md](USAGE.md)                                                | Thin jump index into the docs site                                 |
| [FIDELITY.md](FIDELITY.md)                                          | The XP-authenticity baseline: per-behavior scoring + design tokens |
| [AGENTS.md](AGENTS.md) / [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Principles & code rules for contributors                           |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                  | Workflow, checks, PR expectations                                  |
| [docs/](docs/)                                                      | Design & analysis: use cases, puzzle design, platform vision       |

## Tech stack & support

React 18/19 · TypeScript 5 · styled-components 6 · xp.css (scoped at build time) · react-draggable & react-resizable · i18next (uses its own isolated instance). Browsers: Chrome/Edge 90+, Firefox 88+, Safari 14+.

## License & acknowledgments

MIT — see [LICENSE](LICENSE). Built on the shoulders of [xp.css](https://botoxparty.github.io/XP.css/), inspired by [winXP](https://github.com/ShizukuIchi/winXP).

**Assets:** system icons ([XPIcons](https://github.com/iconicX/XPIcons), [react-xp](https://github.com/zyishai/react-xp)), official XP wallpapers, real `.cur` cursors, original XP event sounds, xp.css fonts, Minesweeper sprites, and boot-screen timing referenced from [PlymouthXP](https://github.com/nulln/PlymouthXP) are used **for educational and nostalgic purposes only**, remain the property of their respective owners, and are not covered by the MIT license.

<div align="center">
Made with ❤️ and nostalgia for the millennium era
</div>
