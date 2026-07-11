# Windows XP Desktop Engine — Usage Guide

The complete consumer reference for `@caoergou/windows-xp`. If you're new,
read top to bottom: install → configure → inject content → observe & drive →
embed. Contributors: architecture lives in `CLAUDE.md`, code rules in
`docs/DEVELOPMENT.md`, the fidelity baseline in `FIDELITY.md`.

## Installation

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

## Props reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `username` | string | `'User'` | Login screen username |
| `password` | string | `'forthe2000s'` | Login password |
| `avatar` | string | built-in | Login/user avatar — an `XPIcon` id or an image URL |
| `language` | string | `'en'` | Initial language (`'en'` or `'zh'`; other codes need a culture package providing `i18n` resources) |
| `skipBoot` | boolean | `false` | Skip the boot screen on first load |
| `autoLogin` | boolean | `false` | Skip the login screen |
| `customFileSystem` | object | `null` | Your filesystem nodes (see Content) — applied at mount |
| `fileSystemMode` | `'merge'` \| `'replace'` | `'merge'` | `'replace'` keeps only OS scaffolding; your content becomes the entire desktop |
| `wallpapers` | `Wallpaper[]` | `[]` | Custom wallpapers, merged over the built-in list (custom wins by id) |
| `defaultWallpaper` | string | built-in | Initial wallpaper — a wallpaper id or a direct image URL |
| `cultures` | `CulturePackage[]` | `[]` | Culture packages extending/overriding built-in `en`/`zh` |
| `apps` | `AppRegistryEntry[]` | `[]` | Custom applications merged over the built-in registry |
| `onEvent` | `(e: XPEvent) => void` | — | Subscribe to every desktop event (see Events) |
| `ref` | `Ref<XPHandle>` | — | Imperative control handle (see Events) |
| `mode` | `'fullscreen'` \| `'embedded'` | `'fullscreen'` | `'embedded'` disables all host-page hijacking in one switch |
| `storagePrefix` | string | `'xp_'` | Storage namespace — each instance is fully isolated |
| `disableContextMenuBlock` | boolean | `false` | Allow the browser's right-click menu |
| `disableDevToolsBlock` | boolean | `false` | Allow F12 / Ctrl+Shift+I/J/C |
| `disableGlobalShortcuts` | boolean | `false` | Disable Alt+F4 / Alt+Tab handling and the BSOD easter egg |
| `disableScreenSaver` | boolean | `false` | Disable the idle screensaver |
| `hourlyChime` | boolean | `false` | Play the classic 整点报时 chime on the hour (a culture package can enable it too) |
| `idleThresholdMs` | number | `60000` | Inactivity threshold before `user:idle` fires |

> **`apps` and `cultures` are reactive (#122).** Adding or removing an entry
> after mount registers/updates it — the prop wins over a runtime
> `registerApp`/`registerCulture` on an id collision, and built-ins + runtime
> registrations are preserved. `customFileSystem` remains **mount-time** (it
> seeds the desktop; drive later filesystem changes through `useApp().fs` or
> the `ref` handle).

## Content: make the desktop yours

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

```jsx
const jpRetroCulture = {
  id: 'jp-retro',
  displayName: '日本 2000s',
  locales: ['ja', 'ja-JP'],
  browser: { homepage: 'http://www.yahoo.co.jp' },
  desktopShortcuts: [
    { id: 'nicovideo', name: 'ニコニコ動画', app: 'NicoVideoPlayer', icon: 'nico' },
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
};

<WindowsXP language="ja" cultures={[jpRetroCulture]} />
```

Notes for third-language packages: UI strings fall back to English for any
key you don't provide in `i18n`; Start-menu items resolve names through
`nameKey` only, so provide those keys. (Authoring validation and a
`defineCulture()` helper are tracked in #129.)

### Custom applications

```jsx
import { WindowsXP, useWindowManager, useApp } from '@caoergou/windows-xp';

function MyApp() {
  const { window } = useApp(); // window.id injected automatically
  return <div>Hello from window {window.id}!</div>;
}

const myApp = {
  id: 'MyApp',
  name: 'My Application',
  icon: 'app_window',
  window: { width: 400, height: 300 },
  restore: (props) => <MyApp {...props} />,
};

function Host() {
  const { openWindow } = useWindowManager();
  return (
    <>
      <button onClick={() => openWindow('MyApp', 'My App', <MyApp />, 'app_window')}>
        Open My App
      </button>
      <WindowsXP apps={[myApp]} />
    </>
  );
}
```

Rules that matter:

- **`restore` props must be JSON-serializable.** They persist to storage so
  windows can be rebuilt after refresh — functions, elements, and class
  instances silently vanish. Pass data, react to it inside the component.
- Add `associations: [{ appField: 'MyApp', getProps: (item) => ({ /* … */ }) }]`
  if filesystem nodes should open with your app (`node.app === 'MyApp'`).
- Add `nameKey` for a translated display name; `name` is the fallback.
- A `defineApp()` factory that simplifies this is tracked in #128.

## Events and imperative control

Subscribe to everything happening inside the desktop with `onEvent`, and
drive it programmatically with a `ref` — the foundation for analytics,
guided demos, and the scenario system (#84).

```jsx
import { useRef } from 'react';
import { WindowsXP } from '@caoergou/windows-xp';
import type { XPHandle, XPEvent } from '@caoergou/windows-xp';

function App() {
  const xp = useRef<XPHandle>(null);

  return (
    <>
      <button onClick={() => xp.current?.openApp('Notepad')}>Open Notepad</button>
      <WindowsXP
        ref={xp}
        autoLogin
        onEvent={(e: XPEvent) => {
          if (e.type === 'file:open') console.log('opened', e.path.join('/'));
          if (e.type === 'cmd:exec') console.log('ran command', e.command);
        }}
      />
    </>
  );
}
```

**Event types** (typed payloads on the `XPEvent` union). The catalog below is
generated from `src/events.ts`; the naming grammar, domain list and payload
conventions live in [`docs/EVENTS.md`](docs/EVENTS.md).

<!-- EVENTS:START -->

| Event | Payload | Description |
| --- | --- | --- |
| `app:launch` | `appId`, `windowId`, `title` | An application window was opened. |
| `app:close` | `appId`, `windowId` | An application window was closed. |
| `window:focus` | `windowId`, `appId` | A window gained focus (was brought to the front). |
| `window:minimize` | `windowId`, `appId` | A window was minimized to the taskbar. |
| `window:maximize` | `windowId`, `appId` | A window was maximized. |
| `window:restore` | `windowId`, `appId` | A window was restored from a minimized/maximized state. |
| `file:open` | `path`, `name`, `nodeType`, `app?` | A file or folder was opened (double-clicked / launched). |
| `file:create` | `path`, `name`, `nodeType` | A file or folder was created. |
| `file:update` | `path`, `name`, `content?` | A file's properties were edited; `content` is present when its text changed (the "player typed the passphrase" puzzle beat). |
| `file:delete` | `path`, `name` | A file was deleted (moved to the Recycle Bin). |
| `file:rename` | `path`, `oldName`, `newName` | A file or folder was renamed. |
| `file:move` | `from`, `to`, `name` | A file was moved (cut+paste or drag) from `from` to `to`. |
| `file:copy` | `from`, `to`, `name` | A file was copied from `from` to `to`. |
| `file:restore` | `name` | A file was restored from the Recycle Bin. |
| `file:unlock` | `name` | A locked node was unlocked (correct password, or a host/scenario force-unlock). |
| `folder:delete` | `path`, `name` | A folder was deleted (files emit `file:delete`; folders emit this). |
| `recyclebin:empty` | — | The Recycle Bin was emptied. |
| `password:fail` | `path`, `name`, `attempt` | A wrong password was entered for a locked node; `attempt` counts consecutive failures. |
| `session:login` | — | The user logged in successfully. |
| `session:login-fail` | — | A login attempt failed (wrong password). |
| `session:logout` | — | The user logged out. |
| `session:boot-complete` | — | The desktop finished booting and is interactive. |
| `session:shutdown` | `mode` | The machine was shut down, restarted, or logged out via the Start menu. |
| `cmd:exec` | `command` | A command was executed in the Command Prompt. |
| `ie:navigate` | `url` | Internet Explorer navigated to a URL. |
| `wallpaper:change` | `wallpaper` | The desktop wallpaper was changed (`wallpaper` is the id or URL). |
| `screensaver:start` | — | The screensaver started. |
| `screensaver:stop` | — | The screensaver was dismissed. |
| `notification:show` | `id`, `title`, `body?` | A tray notification balloon was shown. |
| `notification:click` | `id` | A tray notification balloon was clicked. |
| `time:hour` | `hour` | Fired on the top of each hour; `hour` is 0–23 (drives the 整点报时 chime). |
| `time:fire` | `id` | A persisted schedule fired (delay elapsed or its `at` deadline passed, incl. while the page was closed). |
| `user:idle` | `idleMs` | The user has been inactive for the idle threshold; `idleMs` is that threshold. |
| `user:active` | — | The user resumed activity after being idle. |
| `qq:login` | — | The player logged into QQ (the buddy-list panel opened). |
| `qq:open` | `buddyId?` | The QQ client opened, or a specific buddy chat was opened (`buddyId`). |
| `qq:online` | `buddyId`, `nickname` | A buddy came online. |
| `qq:message` | `buddyId`, `direction`, `text` | A QQ message was sent or received; `direction` is 'incoming' (from the buddy) or 'outgoing' (from the player). |

_Generated from `src/events.ts` by `npm run docs:events` — do not edit by hand._

<!-- EVENTS:END -->

**The `XPHandle`** (via `ref`) exposes the top-level `openApp(appId, props?)`,
`openFile(path)`, `closeWindow(id)`, `showAlert(title, message)` and
`reset()`, plus grouped actuation APIs (#115):

- `fs`: `readFile(path)`, `writeFile(path, content)`, `createFile(path, node?)`, `deleteFile(path)`, `getNode(path)`, `exists(path)`, `unlockNode(path)`
- `session`: `login(password?)`, `logout()`, `shutdown()`, `restart()`
- `appearance`: `setWallpaper(idOrUrl)`, `setLanguage(lang)`
- `windows`: `list()`, `focus(id)`, `minimize(id)`, `maximize(id)`, `restore(id)`
- `sound.play(name)` and `emit(event)` (inject onto the same bus `onEvent` and scenario triggers read)
- `schedule({ id?, delayMs?, at?, event? })` / `cancelSchedule(id)` — time-based
  triggers (#130). A schedule fires a `time:fire` event (or a caller-supplied
  `event`) after `delayMs` or at the `at` epoch-ms deadline. **Pending schedules
  persist per instance and fire on the next load if the deadline passed while
  the page was closed** ("compute elapsed effects at launch" — there is no
  background execution). The same subsystem emits the wall-clock `time:hour`
  and `user:idle` / `user:active` events on the bus.

```jsx
// Remind the player 90s after they lock a folder — survives a reload.
ref.current.schedule({ id: 'hint', delayMs: 90_000,
  event: { type: 'notification:show', id: 'hint', title: 'Psst… try 2003' } });
```

The classic hourly chime (整点报时) is an opt-in consumer of `time:hour`:
`<WindowsXP hourlyChime />` (or a culture package's `hourlyChime: true`); it is
off by default. `idleThresholdMs` tunes when `user:idle` fires (default 60000).

`reset()` clears **both** storage layers (localStorage + IndexedDB file
contents) for the instance's `storagePrefix`, then reloads. For save/load,
see "Save / load a snapshot" below.

**Inside the tree** (custom apps), subscribe without prop-drilling:

```jsx
import { useXPEvents } from '@caoergou/windows-xp';

function EventLogger() {
  useXPEvents((e) => {
    if (e.type === 'file:open') {
      /* react to the world */
    }
  });
  return null;
}
```

**Bare-provider composition (#122).** Advanced composers using the bare
providers (the `AppProviders` escape hatch) can create their own bus and
observe the exact instance the desktop emits on:

```jsx
import { createXPEventBus, EventBusProvider } from '@caoergou/windows-xp';

const bus = createXPEventBus();
bus.subscribe((e) => console.log(e.type));
// <EventBusProvider bus={bus}> … your providers … </EventBusProvider>
```

### Driving the desktop from the host

With only a `ref` — no custom apps, no context access — a host can plant a
clue file and react when the player opens it (the core ARG loop):

```jsx
import { useRef, useEffect } from 'react';
import { WindowsXP } from '@caoergou/windows-xp';
import type { XPHandle, XPEvent } from '@caoergou/windows-xp';

function Arg() {
  const xp = useRef<XPHandle>(null);

  // Plant the first file + a locked folder once the desktop has mounted.
  useEffect(() => {
    xp.current?.fs.createFile(['diary.txt'], { type: 'file', app: 'Notepad', content: '…' });
    xp.current?.fs.createFile(['vault'], { type: 'folder', locked: true, password: 'BLISS' });
  }, []);

  return (
    <WindowsXP
      ref={xp}
      autoLogin
      onEvent={(e: XPEvent) => {
        // The player opened the locked diary → drop the next clue.
        if (e.type === 'file:open' && e.name === 'diary.txt') {
          xp.current?.fs.createFile(['clue2.txt'], {
            type: 'file',
            app: 'Notepad',
            content: 'The password is BLISS',
          });
        }
      }}
    />
  );
}
```

Later, unlock the folder programmatically and theme the desktop:

```jsx
xp.current?.fs.unlockNode(['vault']);
xp.current?.appearance.setWallpaper('bliss');
```

### Save / load a snapshot ("share your save")

`getSnapshot()` captures the whole instance — filesystem (with file contents),
recycle bin, open windows, wallpaper, language, and a reserved `flags` slot —
as a portable, versioned `XPSnapshot` JSON object. `loadSnapshot()` replaces
this instance's state with a snapshot and reloads to rehydrate. Snapshots move
between machines/browsers, so a player can share a save or an author can ship a
checkpoint (#117).

```jsx
import type { XPSnapshot } from '@caoergou/windows-xp';

// Export: download the current desktop as a .json file.
function downloadSave(xp) {
  const snapshot = xp.current.getSnapshot();
  const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-desktop.xpsave.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import: load a save file (reloads to apply).
async function uploadSave(xp, file) {
  const snapshot = JSON.parse(await file.text());
  await xp.current.loadSnapshot(snapshot); // throws XPSnapshotVersionError if too new
}
```

Loading a snapshot whose `version` is newer than the running build throws
`XPSnapshotVersionError` (exported) rather than corrupting state — so guard the
import with a `try/catch` and surface a "please update" message.

## Embedding in a host app

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

## SSR / Next.js

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

## Subpath imports & standalone primitives

For smaller bundles, import only what you need:

```jsx
// Full desktop (largest bundle)
import { WindowsXP } from '@caoergou/windows-xp';

// Individual applications
import { Minesweeper } from '@caoergou/windows-xp/apps';

// UI building blocks
import { Window, Desktop, Taskbar, XPIcon } from '@caoergou/windows-xp/components';

// Hooks and providers
import { useWindowManager, useFileSystem, useAppRegistry, useCulture } from '@caoergou/windows-xp/hooks';

// Theme tokens
import { COLORS, xpButtonStyles, xpScrollbarStyles } from '@caoergou/windows-xp/theme';

// App registry helpers
import { APP_REGISTRY, resolveFileOpen, getAppDisplayName } from '@caoergou/windows-xp/registry';
```

> System components (`Window`, `Taskbar`, `Desktop`, …) are wired to the
> desktop's contexts and must render inside the providers exported from the
> root entry (or `AppProviders`). The primitives below need nothing.

### Standalone UI primitives (no providers)

`@caoergou/windows-xp/components` ships **zero-dependency primitives** you can
drop anywhere — no `<WindowsXP>`, no providers — to build XP-styled UI (like
[xp.css](https://botoxparty.github.io/XP.css/), but as controlled React
components, matching the xp.css spec value-for-value):

`XPButton`, `XPTextInput`, `XPCheckbox`, `XPRadio`, `XPSelect`,
`XPProgressBar`, `XPTooltip`, `XPGroupBox`, `XPStatusBar` (+
`XPStatusBarField`), `XPTabs`, `XPMenuBar` (family), `XPIcon`, `XPDialog`.

```jsx
import { XPDialog, XPButton } from '@caoergou/windows-xp/components';
import '@caoergou/windows-xp/style.css';

// A classic XP message box — no providers required.
function SaveDialog({ onSave, onDiscard, onCancel }) {
  return (
    <XPDialog
      title="Notepad"
      icon="alert_warning"
      modal
      onClose={onCancel}
      footer={
        <>
          <XPButton onClick={onSave}>Yes</XPButton>
          <XPButton onClick={onDiscard}>No</XPButton>
          <XPButton onClick={onCancel}>Cancel</XPButton>
        </>
      }
    >
      The text in the Untitled file has changed. Do you want to save the changes?
    </XPDialog>
  );
}
```

```jsx
import {
  XPGroupBox,
  XPCheckbox,
  XPTabs,
  XPProgressBar,
  XPStatusBar,
  XPStatusBarField,
} from '@caoergou/windows-xp/components';
```

See every primitive rendered in isolation at the component gallery route:
append `?gallery` to the demo URL.

## Styling

The stylesheet is fully scoped (see Embedding). To customize beyond the
supported props, standard CSS targeting the scoped classes works:

```css
.windows-xp-root .taskbar {
  /* … */
}
```

Prefer the supported surfaces first (wallpapers, culture packages, theme
tokens from `/theme`) — class names are not a stable API. A proper theme
layer is tracked in #135.

## Performance

- Use subpath imports when you don't need the full desktop.
- `skipBoot` + `autoLogin` give the fastest time-to-desktop for embeds.
- Applications lazy-load by default; the published package is ~3 MB with the
  largest chunk ~0.4 MB.

## Troubleshooting

**Windows don't persist after refresh** — check localStorage is available
(not blocked/incognito). Custom apps must be registered (via the `apps` prop
at mount) so restoration can find their `restore` function; `componentProps`
must be JSON-serializable or they're dropped.

**Two instances interfere** — give each a distinct `storagePrefix`.

**Styling conflicts** — ensure `style.css` is imported; the component root is
`.windows-xp-root` (portals use `.windows-xp-portal`). The scoped stylesheet
cannot leak out; if your host styles leak *in*, scope them away from those
two classes.

**Custom file system not appearing** — top-level keys merge into the desktop
root (don't wrap them in a `"Desktop"` folder); remember content props are
mount-time.

## License & support

MIT — see [LICENSE](LICENSE).
Issues & questions: [github.com/caoergou/windows-xp/issues](https://github.com/caoergou/windows-xp/issues)
