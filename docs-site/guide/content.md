---
title: Make the desktop yours
---

# Content: make the desktop yours

### Custom file system

Top-level keys merge directly into the desktop root — a top-level key IS a
desktop item:

```jsx
const myFileSystem = {
  'ReadMe.txt': {
    type: 'file',
    name: 'ReadMe.txt',
    app: 'Notepad',
    content: 'Welcome to my desktop!',
  },
  'My Projects': {
    type: 'folder',
    name: 'My Projects',
    children: {
      'Project A.txt': { type: 'file', name: 'Project A.txt', app: 'Notepad', content: '…' },
    },
  },
  'MyApp.lnk': { type: 'app_shortcut', name: 'MyApp.lnk', app: 'Calculator', icon: 'calculator' },
};

<WindowsXP customFileSystem={myFileSystem} />
```

**Node shape** — `type` (`'file' | 'folder' | 'app_shortcut'`), `name`,
optional `icon` (an `XPIcon` id), `app` (which registered app opens it),
`content` (for files), `children` (for folders), and the puzzle attributes
`locked`, `password`, `broken`.

**File-type → app associations:** `Notepad` (text), `PhotoViewer` (images),
`InternetExplorer` (html/url), `WindowsMediaPlayer` (audio/video).

**Merge vs replace.** The default `'merge'` overlays your nodes on the stock
desktop. `fileSystemMode="replace"` keeps only OS scaffolding (Recycle Bin +
an empty My Computer) and drops built-in shortcuts, preset content, and
culture shortcuts — your `customFileSystem` becomes the whole world. That's
the mode for portfolios, campaigns, and custom games.

### Wallpapers & avatar

```jsx
<WindowsXP
  wallpapers={[{ id: 'brand', name: 'Brand', src: '/brand-wallpaper.jpg' }]}
  defaultWallpaper="brand"          // or a direct URL: "https://…/bg.jpg"
  avatar="/me.png"                  // or an XPIcon id
/>
```

Custom wallpapers appear in Display Settings alongside the built-ins.
A culture package can also declare its default via `CulturePackage.wallpaper`
(the `defaultWallpaper` prop wins).

### Culture packages

A culture package defines a complete regional/era experience: desktop
shortcuts, Start menu, browser homepage, sticky note, and i18n resources.
Built-ins: `zh` (2005–2007 Chinese internet) and `en` (Western 2000s).

Author one with `defineCulture()`. It's an identity wrapper that gives you
the `CulturePackage` type and, in dev builds, warns (naming the offending
field) when a package would silently misbehave — an empty shortcut `app`, a
duplicate item id, item `locales` that don't overlap the package's, or a
Start-menu `nameKey` your `i18n` never defines:

```jsx
import { WindowsXP, defineCulture } from '@caoergou/windows-xp';

const jpRetroCulture = defineCulture({
  id: 'jp-retro',
  displayName: '日本 2000s',
  locales: ['ja', 'ja-JP'],
  browser: { homepage: 'http://www.yahoo.co.jp' },
  desktopShortcuts: [
    // `app` must be a registered app id (built-in or from the `apps` prop).
    { id: 'nicovideo', name: 'ニコニコ動画', app: 'InternetExplorer', icon: 'ie' },
  ],
  startMenu: {
    pinned: [{ id: 'ie', action: 'InternetExplorer', nameKey: 'startMenu.apps.internetExplorer', icon: 'ie' }],
    recent: [{ id: 'notepad', action: 'Notepad', nameKey: 'apps.notepad', icon: 'file' }],
  },
  stickyNote: { id: 'default', title: 'メモ', content: 'カスタム文化包のテスト' },
  i18n: {
    ja: {
      'startMenu.apps.internetExplorer': 'Internet Explorer',
      'apps.notepad': 'メモ帳',
    },
  },
});

<WindowsXP language="ja" cultures={[jpRetroCulture]} />
```

Notes for third-language packages:

- **`locales` are base-aware.** An item's `locales: ['ja']` matches the
  `'ja-JP'` runtime language and vice versa — case-insensitively, on the base
  subtag. Omit item-level `locales` to show an item in every language the
  package covers; set them to scope an item to a subset (e.g. a shortcut only
  the `ja` audience should see).
- UI strings **fall back to English** for any key you don't provide in `i18n`.
- Start-menu items resolve names through `nameKey` only, so provide those keys.
- `app` values must be **registered app ids** — a built-in, or one you pass via
  the `apps` prop. In dev, an unregistered id logs a warning at mount.

**Wiring a culture app end-to-end** (learned building the `en` Western-2000s
pack in #123 — Winamp / Norton AntiVirus / uTorrent / iTunes / Microsoft Office):

1. **Build the component** under `src/apps/` (a rich flagship like Winamp can
   reuse the bundled sample clip for real audio; the rest can be themed shallow
   shells, like the `zh` Thunder/Kugou apps).
2. **Register it** in `APP_REGISTRY` with `locales: ['en']` so it only appears
   in that culture, an `icon`, a `window` config, and an `associations` entry
   whose `appField` equals the shortcut's `app` value.
3. **Add the desktop shortcut** to the package's `desktopShortcuts` — the
   shortcut `name` is what users (and `data-english-testid="desktop-icon-<name>"`
   selectors) see, so keep it exact; `app` must match the registry `appField`.
4. **Optionally pin it** in `startMenu` via a `nameKey`.
5. **Assets must be original / parody artwork** — no ripped third-party logos
   (DEVELOPMENT.md §6). The `en` app icons are hand-drawn SVGs.

### Write your first app

`defineApp()` turns a component into a registrable app in one typed call —
here's a complete, refresh-restorable hello-world in under 10 lines:

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import { defineApp } from '@caoergou/windows-xp/registry';

const HelloApp = defineApp({
  id: 'Hello',
  name: 'Hello',
  component: () => <div style={{ padding: 16 }}>Hello from Windows XP!</div>,
});

export default () => <WindowsXP apps={[HelloApp]} />;
```

`defineApp` fills in the defaults (icon `app_window`, a 400×300 window,
non-singleton) and derives `restore` from `component` for you. Open your
registered app from the imperative handle:

```tsx
const xp = useRef(null);
// …
<WindowsXP ref={xp} apps={[HelloApp]} />;
xp.current?.openApp('Hello');   // opens a window running HelloApp
```

**Props that survive a refresh.** A window's props are persisted so it can be
rebuilt on reload, so they must be JSON-serializable. `defineApp` enforces this
at compile time — a function or element in your props is a **type error**, not
a silent refresh bug:

```tsx
const NoteApp = defineApp<{ text: string }>({
  id: 'Note',
  name: 'Note',
  component: ({ text }) => <div>{text}</div>,
  // window, nameKey, locales, lifecycle and associations are all optional.
});
```

Rules that matter:

- **Open custom apps via `ref.openApp(id)`** (above) — it resolves against the
  merged registry that includes your `apps`. `associations` + `getProps` let a
  filesystem node's `.app` field open an app, but that path currently resolves
  **built-in** apps only; opening a custom app straight from a desktop/Explorer
  shortcut is being generalized (tracked with the `appRoles` work in #122).
- Add `nameKey` for a translated display name; `name` is the fallback.
- Runtime callbacks belong on the event bus (`onEvent`) or `lifecycle`, never in
  props. Reach window/session state from inside the component via `useApp()`.
- Need to hand-build an `AppRegistryEntry`? Import the `restoreApp` helper from
  `@caoergou/windows-xp/registry` for the same `unknown → props` cast the
  built-ins use.

### Build a blog on the desktop

The desktop makes a natural portfolio/blog shell. Keep posts in Markdown, turn
them into openable windows with one helper, and mirror them as static pages so
search engines can still find your writing (#137).

**1. Author in Markdown, load with `buildContentFs`.** A *content manifest* is a
plain list of posts; `buildContentFs` turns it into a `customFileSystem`
fragment where each post is a `<slug>.md` file that opens in the built-in
**MarkdownViewer** (Notepad stays the plain-text editor). Posts sharing a
`folder` nest under it.

```jsx
import { WindowsXP, buildContentFs } from '@caoergou/windows-xp';

// With a bundler you can glob a folder of .md files at build time:
//   const files = import.meta.glob('./posts/*.md', { as: 'raw', eager: true });
const manifest = [
  { slug: 'hello-world', title: 'Hello, World', date: '2007-01-01', source: '# Hi\n\nMy first post.', folder: 'Posts' },
  { slug: 'about-me', title: 'About Me', source: '# About\n\nI build things.' },
];

export default () => <WindowsXP customFileSystem={buildContentFs(manifest)} />;
```

**2. Permalinks come for free.** Because posts are real filesystem nodes, the
deep-linking API (above) addresses them: `postPermalink(post, siteMeta)` returns
a `?open=…` URL that opens the post's window, and `WindowsXP`'s `openOnLoad`
consumes it. A share button or QR code just points at that URL.

**3. Be findable — the SEO mirror.** Crawlers don't run your desktop, so emit a
static HTML page per post that carries the text and links back to the desktop
permalink. Render the body at build time and hand it to `buildPostMirrorHtml`
(the render step is yours, so the core ships no markdown-to-HTML dependency):

```jsx
import { renderToStaticMarkup } from 'react-dom/server';
import { buildPostMirrorHtml, buildRssFeed } from '@caoergou/windows-xp';
import { MarkdownViewer } from '@caoergou/windows-xp/apps';

const site = { title: 'My XP Blog', siteUrl: 'https://me.dev/', language: 'en' };

// One crawlable page per post (write these to /blog/<slug>.html at build time):
for (const post of manifest) {
  // Reuse the in-desktop renderer for byte-identical output, or any md→HTML lib:
  const bodyHtml = renderToStaticMarkup(<MarkdownViewer content={post.source} />);
  const page = buildPostMirrorHtml(post, site, bodyHtml);
  // fs.writeFileSync(`dist/blog/${post.slug}.html`, page)
}

// And an RSS feed whose entries link to the desktop permalinks:
const rss = buildRssFeed(manifest, { ...site, description: 'Posts from a Windows XP desktop' });
```

Wire it up per framework: on **Next.js**, generate the mirror pages as static
routes (`generateStaticParams`) and serve `rss.xml` from `app/rss.xml/route.ts`;
on **plain Vite**, write the pages and feed in a small post-build script. Either
way humans get the desktop and crawlers get indexable HTML that deep-links back.

