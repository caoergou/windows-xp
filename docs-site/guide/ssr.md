---
title: SSR / Next.js
---

# SSR / Next.js

The library is SSR-safe at module scope (no top-level `window`/storage
access), but the component is deeply client-side — render it client-only.

## Next.js App Router

Import the CSS in your root layout (global CSS can only be imported there in
App Router):

```tsx
// app/layout.tsx
import '@caoergou/windows-xp/style.css';
```

Then wrap the component in a client-only dynamic import:

```tsx
// app/xp-page.tsx
'use client';

import dynamic from 'next/dynamic';

const WindowsXP = dynamic(() => import('@caoergou/windows-xp').then(m => m.WindowsXP), {
  ssr: false,
});

export default function XpPage() {
  return <WindowsXP autoLogin skipBoot />;
}
```

## Next.js Pages Router

Import the CSS in `_app.tsx` and dynamically load the component on the page:

```tsx
// pages/_app.tsx
import '@caoergou/windows-xp/style.css';

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

```tsx
// pages/xp.tsx
import dynamic from 'next/dynamic';

const WindowsXP = dynamic(() => import('@caoergou/windows-xp').then(m => m.WindowsXP), {
  ssr: false,
});

export default function XpPage() {
  return <WindowsXP autoLogin skipBoot />;
}
```

## Vite / plain React

No SSR special case is needed. Import the CSS and render the component
normally:

```tsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

export default function App() {
  return <WindowsXP autoLogin skipBoot />;
}
```

## Astro

Use a client-only island so the component only runs in the browser:

```astro
---
// pages/xp.astro
---

<WindowsXP client:only="react" />
```

```tsx
// components/WindowsXP.tsx
import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

export default function WindowsXPEmbed() {
  return <WindowsXP autoLogin skipBoot />;
}
```

## Verified consumption

Every push to `main` (and every release-labelled PR) runs a **consumer-smoke**
CI job — `npm pack` → a clean Vite + React app installs the tarball → builds →
renders `<WindowsXP>` in a real browser. It asserts, from the _outside_ of the
package, that:

- the `.`, `./components`, and `./style.css` export subpaths all resolve;
- the i18n `init()` side-effect survives tree-shaking (a `sideEffects` entry
  that matches no packaged file fails the job — the class of bug that once
  shipped a desktop with raw i18n keys);
- heavy apps stay code-split out of first paint;
- the published `.d.ts` type-checks against **both** `@types/react@18` and `@19`.

The **Next.js** path is the `dynamic(..., { ssr: false })` wrapper above: the
same tarball the consumer-smoke validates, loaded client-only. If you hit an
SSR edge case, mirror the Vite consumer under `scripts/consumer-smoke/` as a
starting point.
