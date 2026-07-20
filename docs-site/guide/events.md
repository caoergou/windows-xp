---
title: Events & imperative control
---

# Events and imperative control

The desktop emits a typed event for every user action — opening a file,
launching an app, logging in, and so on. Listen with `onEvent`, and control
the desktop from your own UI with a React `ref`.

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
conventions live in [`docs/EVENTS.md`](https://github.com/caoergou/windows-xp/blob/main/docs/EVENTS.md).

<!-- EVENTS:START -->

| Event | Payload | Description |
| --- | --- | --- |
| `app:launch` | `appId`, `windowId`, `title` | An application window was opened. |
| `app:close` | `appId`, `windowId` | An application window was closed. |
| `window:focus` | `windowId`, `appId` | A window gained focus (was brought to the front). |
| `window:minimize` | `windowId`, `appId` | A window was minimized to the taskbar. |
| `window:maximize` | `windowId`, `appId` | A window was maximized. |
| `window:restore` | `windowId`, `appId` | A window was restored from a minimized/maximized state. |
| `startmenu:open` | — | The Start menu was opened. |
| `startmenu:close` | — | The Start menu was closed. |
| `contextmenu:open` | `target?`, `path?` | A right-click context menu was opened; `target` classifies what was clicked ('desktop' / 'file' / 'app' …) and `path` locates the node when one was the target. |
| `file:open` | `path`, `name`, `nodeType`, `app?` | A file or folder was opened (double-clicked / launched). |
| `file:create` | `path`, `name`, `nodeType` | A file or folder was created. |
| `file:update` | `path`, `name`, `content?` | A file's properties were edited; `content` is present when its text changed (the "player typed the passphrase" puzzle beat). |
| `file:delete` | `path`, `name` | A file was deleted (moved to the Recycle Bin). |
| `file:rename` | `path`, `oldName`, `newName` | A file or folder was renamed. |
| `file:move` | `from`, `to`, `name` | A file was moved (cut+paste or drag) from `from` to `to`. |
| `file:copy` | `from`, `to`, `name` | A file was copied from `from` to `to`. |
| `file:restore` | `name` | A file was restored from the Recycle Bin. |
| `file:unlock` | `name` | A locked node was unlocked (correct password, or a host/scenario force-unlock). |
| `file:properties` | `path`, `name` | A file's Properties dialog was opened — metadata (size, dates) inspected; a clue channel for scenarios (M1). |
| `folder:delete` | `path`, `name` | A folder was deleted (files emit `file:delete`; folders emit this). |
| `recyclebin:empty` | — | The Recycle Bin was emptied. |
| `print:queue-open` | `printerId` | A printer queue was opened. |
| `print:job-open` | `jobId`, `printerId` | A print job or its retained source metadata was inspected. |
| `print:job-update` | `jobId`, `printerId`, `status` | A print job was added or changed. |
| `print:job-cancel` | `jobId`, `printerId`, `status` | A mutable print job was cancelled or removed. |
| `password:fail` | `path`, `name`, `attempt` | A wrong password was entered for a locked node; `attempt` counts consecutive failures. |
| `session:login` | — | The user logged in successfully. |
| `session:login-fail` | — | A login attempt failed (wrong password). |
| `session:logout` | — | The user logged out. |
| `session:boot-complete` | — | The desktop finished booting and is interactive. |
| `session:shutdown` | `mode` | The machine was shut down, restarted, or logged out via the Start menu. |
| `session:shutdown-request` | `mode` | A power transition was requested, before persistence and presentation begin. |
| `session:blackout` | `mode` | The configured power transition entered its blackout sequence. |
| `session:shutdown-complete` | `mode` | The power transition completed and is ready for host navigation or reload. |
| `flag:change` | `flag`, `value` | A scenario flag's value changed (set/inc). Lets a trigger fire on progress itself, not only on a UI event. Emitted by the scenario runtime, not the core engine. |
| `cmd:exec` | `command` | A command was executed in the Command Prompt. |
| `chat:request` | `buddyId` | A chat reply was requested from the host's ChatProvider. |
| `chat:reply` | `buddyId`, `text` | A chat reply was received from the provider and rendered. |
| `chat:fallback` | `buddyId`, `text` | The provider failed or is absent; a scripted fallback line was used instead. |
| `chat:moderated` | `buddyId`, `reason?` | Inbound LLM text was blocked by the ModerationProvider. |
| `ie:navigate` | `url`, `generated?` | Internet Explorer navigated to a URL; `generated` is true when the page came from a host content provider rather than a bundled/authored page. |
| `wallpaper:change` | `wallpaper` | The desktop wallpaper was changed (`wallpaper` is the id or URL). |
| `screensaver:start` | — | The screensaver started. |
| `screensaver:stop` | — | The screensaver was dismissed. |
| `notification:show` | `id`, `title`, `body?` | A tray notification balloon was shown. |
| `notification:click` | `id` | A tray notification balloon was clicked. |
| `time:hour` | `hour` | Fired on the top of each hour; hour is 0-23 (drives the hourly chime). |
| `time:fire` | `id` | A persisted schedule fired (delay elapsed or its `at` deadline passed, incl. while the page was closed). |
| `time:change` | `from`, `to`, `source` | The instance virtual wall-clock changed; `source` identifies a user edit or host API call. |
| `user:idle` | `idleMs` | The user has been inactive for the idle threshold; `idleMs` is that threshold. |
| `user:active` | — | The user resumed activity after being idle. |
| `qq:login` | — | The player logged into QQ (the buddy-list panel opened). |
| `qq:open` | `buddyId?` | The QQ client opened, or a specific buddy chat was opened (`buddyId`). |
| `qq:online` | `buddyId`, `nickname` | A buddy came online. |
| `qq:message` | `buddyId`, `direction`, `text` | A QQ message was sent or received; `direction` is 'incoming' (from the buddy) or 'outgoing' (from the player). |
| `qq:reply` | `buddyId`, `text` | The player sent a reply to a buddy (the puzzle-relevant "player answered" beat). |
| `qq:offline` | `buddyId` | A buddy went offline. |
| `qq:status` | `buddyId`, `status?`, `signature?` | A buddy's status or signature changed — a world reaction (e.g. a mood line the player is meant to notice). |
| `qq:choice` | `buddyId`, `choiceId` | The player picked a scripted reply option (a branching choice, distinct from the free-text `qq:reply`). |
| `qq:archive-open` | `archiveId`, `conversationId?` | A read-only QQ archive or conversation was opened. |
| `qq:archive-search` | `archiveId`, `query`, `resultCount` | A QQ archive search was performed. |
| `qq:archive-message-open` | `archiveId`, `conversationId`, `messageId` | An individual archived QQ message was inspected. |
| `qq:archive-attachment-open` | `archiveId`, `conversationId`, `messageId`, `attachmentId` | An attachment in an archived QQ message was selected. |
| `game:start` | `appId`, `difficulty?` | A game started a new round; `appId` names the game and `difficulty` is present when it applies. |
| `game:win` | `appId`, `difficulty?`, `timeMs?` | A game was won; `timeMs` is the completion time when the game tracks one. |
| `game:lose` | `appId`, `difficulty?` | A game was lost. |
| `media:play` | `path?`, `title?`, `trackId?`, `playlistId?` | Media playback started or resumed; `path` is the source when known. |
| `media:pause` | `path?`, `trackId?`, `playlistId?` | Media playback was paused. |
| `media:ended` | `path?`, `trackId?`, `playlistId?` | Media playback reached the end of the track. |
| `media:seek` | `path?`, `position`, `trackId?`, `playlistId?` | The playhead was moved; `position` is the new time in seconds. |
| `media:track-change` | `playlistId`, `trackId`, `index` | The active track in a data-driven playlist changed. |
| `media:playlist-ended` | `playlistId` | A playlist reached its deterministic end without repeating. |
| `search:query` | `query`, `hit`, `resultIds?` | A query was run against an in-world search engine (a fake Baidu/AltaVista); hit is whether authored results matched. Emitted by the scenario runtime/app, not the core engine. |
| `evidence:collect` | `termId`, `source?` | A term/clue entered the player's word bank (clicked a highlighted term, or granted by the scenario). |
| `evidence:pin` | `itemId` | An item was pinned to the evidence board. |
| `evidence:link` | `sourceId`, `targetId` | Two pinned items were linked on the evidence board. |
| `evidence:unpin` | `itemId` | An item was removed from the evidence board. |
| `deduction:submit` | `formId`, `slots?` | The player submitted a deduction form (Mad-Libs slots / Obra-Dinn triples); `slots` maps slot id → chosen value. |
| `deduction:verified` | `formId`, `groups?` | A submitted deduction verified as correct; `groups` names the slot-groups that matched (supports verify-in-batches). |
| `deduction:failed` | `formId`, `groups?` | A submitted deduction was rejected; `groups` names the slot-groups that failed. |
| `deduction:report-submit` | `reportId`, `submission` | A structured evidence report was submitted with confidence and evidence citations. |
| `deduction:claim-result` | `reportId`, `claimId`, `result` | One report claim was judged without exposing slot-by-slot solution details. |
| `lesson:start` | `lessonId` | A guided lesson started. |
| `lesson:step-complete` | `lessonId`, `stepId` | A lesson step was completed (the learner performed the expected action). |
| `lesson:hint-shown` | `lessonId`, `stepId`, `hintId?` | A hint was shown for the current step (hint-ladder escalation). |
| `lesson:step-failed` | `lessonId`, `stepId` | The learner took a wrong action on a step. |
| `lesson:complete` | `lessonId`, `score?` | A lesson finished; `score` is the assessed result when the lesson grades. |
| `install:start` | `appId` | A software install/setup flow started. |
| `install:complete` | `appId` | A software install completed. |
| `install:cancelled` | `appId` | A software install was cancelled before completing. |
| `ui:action` | `appId`, `control`, `value?` | A semantic app control changed (checkbox toggled, option selected); `control` names it and `value` is the new value. Emitted by data-driven apps (defineApp), gated by `settingEquals`. |
| `link:external` | `url`, `newTab`, `source?` | The visitor followed a link out of the fiction to an external URL — the conversion signal campaigns measure. `newTab` is whether it opened in a new tab; `source` is the originating window id or file path, when known. |

_Generated from `src/events.ts` by `npm run docs:events` — do not edit by hand._

<!-- EVENTS:END -->

## Common event recipes

### Log every file the user opens

```jsx
<WindowsXP
  onEvent={e => {
    if (e.type === 'file:open') {
      console.log('opened', e.path.join('/'));
    }
  }}
/>
```

### React to a wrong password

```jsx
<WindowsXP
  onEvent={e => {
    if (e.type === 'password:fail' && e.name === 'vault') {
      console.log(`Wrong attempt #${e.attempt}`);
    }
  }}
/>
```

### Run code once the desktop is ready

```jsx
<WindowsXP
  autoLogin
  onEvent={e => {
    if (e.type === 'session:boot-complete') {
      console.log('Desktop is interactive');
    }
  }}
/>
```

## The XPHandle

The `XPHandle` (via `ref`) exposes methods to open apps and files, control
windows and sessions, read and write the filesystem, and save or restore the
whole desktop. Common methods:

- `openApp(appId, props?)`, `openFile(path)`, `closeWindow(id)`
- `showAlert(title, message)`, `notify(options)`
- `openExternal(url, { newTab })`, `getShareUrl(windowId)`
- `startLesson(lessonId)`, `stopLesson()`
- `getSnapshot()`, `loadSnapshot(snapshot)`, `reset()`
- `emit(event)` — inject an event onto the same bus `onEvent` reads

Grouped APIs:

- `fs`: `readFile(path)`, `writeFile(path, content)`, `createFile(path, node?)`, `deleteFile(path)`, `getNode(path)`, `exists(path)`, `unlockNode(path)`
- `session`: `login(password?)`, `logout()`, `shutdown()`, `restart()`
- `appearance`: `setWallpaper(idOrUrl)`, `setLanguage(lang)`
- `windows`: `list()`, `focus(id)`, `minimize(id)`, `maximize(id)`, `restore(id)` (un-minimizes and focuses a minimized window)
- `sound.play(name)`
- `schedule({ id?, delayMs?, at?, event? })` / `cancelSchedule(id)` — time-based
  triggers. A schedule fires a `time:fire` event (or a caller-supplied
  `event`) after `delayMs` or at the `at` epoch-ms deadline. **Pending schedules
  persist per instance and fire on the next load if the deadline passed while
  the page was closed** ("compute elapsed effects at launch" — there is no
  background execution). The same subsystem emits the wall-clock `time:hour`
  and `user:idle` / `user:active` events on the bus.

```jsx
// Remind the player 90s after they lock a folder — survives a reload.
xp.current.schedule({
  id: 'hint',
  delayMs: 90_000,
  event: { type: 'notification:show', id: 'hint', title: 'Psst… try 2003' },
});
```

The classic hourly chime (整点报时) is an opt-in consumer of `time:hour`:
`<WindowsXP hourlyChime />` (or a culture package's `hourlyChime: true`); it is
off by default. `idleThresholdMs` tunes when `user:idle` fires (default 60000).

`reset()` clears **both** storage layers (localStorage + IndexedDB file
contents) for the instance's `storagePrefix`, then reloads. For save/load,
see "Save / load a snapshot" below.

### Inside the tree

Inside the tree (custom apps), subscribe without prop-drilling:

```jsx
import { useXPEvents } from '@caoergou/windows-xp';

function EventLogger() {
  useXPEvents(e => {
    if (e.type === 'file:open') {
      /* react to the world */
    }
  });
  return null;
}
```

### Bare-provider composition

Advanced composers using the bare
providers (the `AppProviders` escape hatch) can create their own bus and
observe the exact instance the desktop emits on:

```jsx
import { createXPEventBus, EventBusProvider } from '@caoergou/windows-xp';

const bus = createXPEventBus();
bus.subscribe(e => console.log(e.type));
// <EventBusProvider bus={bus}> … your providers … </EventBusProvider>
```

## Driving the desktop from the host

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

## Save / load a snapshot

`getSnapshot()` captures the whole instance — filesystem (with file contents),
recycle bin, open windows, wallpaper, language, and a reserved `flags` slot —
as a portable, versioned `XPSnapshot` JSON object. `loadSnapshot()` replaces
this instance's state with a snapshot and reloads to rehydrate. Snapshots move
between machines/browsers, so a player can share a save or an author can ship a
checkpoint.

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

## Permalinks & share links

Map URLs to desktop state so a blog post, a search result, or a campaign QR
code can land the visitor on a specific open window.

**Inbound — open a window from a URL.** `openOnLoad` takes one or more _key
paths_ (the sequence of filesystem keys from the desktop root, joined with `/`).
Windows open once the desktop is interactive (after `skipBoot`/`autoLogin`);
invalid paths fail silently to the plain desktop. Wire it to your own URL — the
component takes no router dependency:

```jsx
import { WindowsXP } from '@caoergou/windows-xp';

const open = new URLSearchParams(location.search).getAll('open');
// e.g. visiting …?open=My Documents/readme.txt&lang=en opens that file, focused.
export default () => <WindowsXP openOnLoad={open} />;
```

For prettier URLs, pass a host-router-agnostic `routes` map plus the current
`location` (any framework — you supply the string):

```jsx
<WindowsXP
  location={location.pathname}
  routes={{ '/blog/:slug': ({ slug }) => ({ open: `D:/posts/${slug}.md` }) }}
/>
```

**Share links.** `getShareUrl(windowId)` returns a `?open=…` permalink that
reproduces a path-opened window on a fresh profile (component-only windows
return `null`). A share button captures "this window, open, focused"; encode the
same URL into a QR code for print/campaign use:

```jsx
const url = xp.current?.getShareUrl(windowId); // …/?open=D%3A/posts/hello.md&lang=en
```

**Browser Back.** Set `historyIntegration` so opening/closing top-level windows
push/pop `history` and Back closes the last-opened window — expected on content
sites, off by default (games and embeds don't want it):

```jsx
<WindowsXP openOnLoad={open} historyIntegration />
```

**Outbound — links that leave the fiction.** An `external_link` filesystem node
is a desktop shortcut that opens a real URL instead of a window; or call
`openExternal(url, { newTab })` from the handle. Either way a `link:external`
event fires — the conversion signal every campaign funnel measures. Feed it to
your analytics:

```jsx
<WindowsXP
  customFileSystem={{
    'Buy tickets': {
      type: 'external_link',
      name: 'Buy tickets',
      href: 'https://example.com/tickets',
      icon: 'ie',
    },
  }}
  onEvent={e => {
    if (e.type === 'link:external') gtag('event', 'outbound_click', { url: e.url });
  }}
/>
```

New tabs open with `noopener,noreferrer`, so an embedded desktop never hijacks
its host page.
