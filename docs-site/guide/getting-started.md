---
title: Installation & quick start
---

# Installation

In an existing React 18/19 project (Vite, Next.js, Create React App, etc.):

```bash
npm install @caoergou/windows-xp react react-dom styled-components
```

`react`, `react-dom`, and `styled-components` (v6) are peer dependencies.
All implementation details (`react-draggable`, `react-resizable`, `i18next`,
`react-i18next`, `immer`) are regular dependencies installed automatically,
and the XP theme CSS is compiled into `style.css`, so there is nothing else
to install.

## Quick start

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  // autoLogin and skipBoot jump straight to the desktop while you are developing.
  // Remove them to see the boot screen and login.
  return <WindowsXP autoLogin skipBoot />;
}
```

Without `autoLogin`/`skipBoot` you get the full experience: boot screen →
login (default user `User`, password `forthe2000s`) → desktop.

## Next steps

- [Props reference](/guide/props) — all `<WindowsXP>` props and defaults.
- [Content model](/guide/content) — how to define apps, files, and desktop data.
- [Events](/guide/events) — the events emitted by the engine.
- [Embedding](/guide/embedding) — embed the engine in another page or app.
