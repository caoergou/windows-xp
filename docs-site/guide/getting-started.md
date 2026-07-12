---
title: Installation & quick start
---

# Installation

```bash
npm install @caoergou/windows-xp
```

Peer dependencies: `react` (18 or 19), `react-dom`, and `styled-components`
(v6) — everything you almost certainly already have. All implementation
details (`react-draggable`, `react-resizable`, `i18next`, `react-i18next`,
`immer`) are regular dependencies installed automatically, and the XP theme
CSS is compiled into `style.css`, so there is nothing else to install.


## Quick start

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

function App() {
  return <WindowsXP autoLogin skipBoot />;
}
```

Without `autoLogin`/`skipBoot` you get the full experience: boot screen →
login (default user `User`, password `forthe2000s`) → desktop.

