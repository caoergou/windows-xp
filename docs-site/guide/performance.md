---
title: Performance
---

# Performance

## Pick the right entry point

Import only what you need. The full desktop bundles every application; for a
lighter footprint use subpath imports:

```jsx
// Full desktop — largest bundle
import { WindowsXP } from '@caoergou/windows-xp';

// Single app, no desktop chrome
import { Minesweeper } from '@caoergou/windows-xp/apps';

// Standalone UI primitives
import { XPButton, XPDialog } from '@caoergou/windows-xp/components';
```

See [Subpath imports & primitives](./subpaths) for the full list.

## Fastest embed startup

For the shortest time-to-desktop, disable the boot sequence and auto-login:

```jsx
<WindowsXP skipBoot autoLogin username="Guest" />
```

If you also don't need persistence, omit `storagePrefix` to skip restoring the
previous session.

## Bundle shape

Applications lazy-load by default; the published package is ~3 MB with the
largest chunk ~0.4 MB. Keep heavy apps code-split by importing them through the
subpath entries above instead of re-bundling their source.

