---
title: SSR / Next.js
---

# SSR / Next.js

The library is SSR-safe at module scope (no top-level `window`/storage
access), but the component is deeply client-side — render it client-only:

```jsx
// Next.js (app or pages router)
import dynamic from 'next/dynamic';

const WindowsXP = dynamic(
  () => import('@caoergou/windows-xp').then((m) => m.WindowsXP),
  { ssr: false }
);
```

Import `@caoergou/windows-xp/style.css` globally as usual. For Astro/Vite
SSR setups, the equivalent client-only island wrapper applies.

### Verified consumption (#206)

Every push to `main` (and every release-labelled PR) runs a **consumer-smoke**
CI job — `npm pack` → a clean Vite + React app installs the tarball → builds →
renders `<WindowsXP>` in a real browser. It asserts, from the *outside* of the
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

