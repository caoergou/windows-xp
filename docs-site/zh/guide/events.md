---
title: 事件与命令式控制
---

# 事件与命令式控制

通过 `onEvent` 订阅桌面内发生的一切，并通过 `ref` 以编程方式驱动它——这是实现埋点分析、引导式演示以及场景系统的基础。

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

**事件类型**（`XPEvent` 联合类型上的带类型负载）。下方目录由 `src/events.ts` 自动生成；命名词法、领域列表与负载约定见 [`docs/EVENTS.md`](https://github.com/caoergou/windows-xp/blob/main/docs/EVENTS.md)。

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
| `password:fail` | `path`, `name`, `attempt` | A wrong password was entered for a locked node; `attempt` counts consecutive failures. |
| `session:login` | — | The user logged in successfully. |
| `session:login-fail` | — | A login attempt failed (wrong password). |
| `session:logout` | — | The user logged out. |
| `session:boot-complete` | — | The desktop finished booting and is interactive. |
| `session:shutdown` | `mode` | The machine was shut down, restarted, or logged out via the Start menu. |
| `flag:change` | `flag`, `value` | A scenario flag's value changed (set/inc). Lets a trigger fire on progress itself, not only on a UI event. Emitted by the scenario runtime, not the core engine. |
| `cmd:exec` | `command` | A command was executed in the Command Prompt. |
| `ie:navigate` | `url`, `generated?` | Internet Explorer navigated to a URL; `generated` is true when the page came from a host content provider rather than a bundled/authored page. |
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
| `qq:reply` | `buddyId`, `text` | The player sent a reply to a buddy (the puzzle-relevant "player answered" beat). |
| `qq:offline` | `buddyId` | A buddy went offline. |
| `qq:status` | `buddyId`, `status?`, `signature?` | A buddy's status or signature changed — a world reaction (e.g. a mood line the player is meant to notice). |
| `qq:choice` | `buddyId`, `choiceId` | The player picked a scripted reply option (a branching choice, distinct from the free-text `qq:reply`). |
| `game:start` | `appId`, `difficulty?` | A game started a new round; `appId` names the game and `difficulty` is present when it applies. |
| `game:win` | `appId`, `difficulty?`, `timeMs?` | A game was won; `timeMs` is the completion time when the game tracks one. |
| `game:lose` | `appId`, `difficulty?` | A game was lost. |
| `media:play` | `path?`, `title?` | Media playback started or resumed; `path` is the source when known. |
| `media:pause` | `path?` | Media playback was paused. |
| `media:ended` | `path?` | Media playback reached the end of the track. |
| `media:seek` | `path?`, `position` | The playhead was moved; `position` is the new time in seconds. |
| `search:query` | `query`, `hit`, `resultIds?` | A query was run against an in-world search engine (a fake 百度/AltaVista); `hit` is whether authored results matched. Emitted by the scenario runtime/app, not the core engine. |
| `evidence:collect` | `termId`, `source?` | A term/clue entered the player's word bank (clicked a highlighted term, or granted by the scenario). |
| `evidence:pin` | `itemId` | An item was pinned to the evidence board. |
| `evidence:link` | `sourceId`, `targetId` | Two pinned items were linked on the evidence board. |
| `evidence:unpin` | `itemId` | An item was removed from the evidence board. |
| `deduction:submit` | `formId`, `slots?` | The player submitted a deduction form (Mad-Libs slots / Obra-Dinn triples); `slots` maps slot id → chosen value. |
| `deduction:verified` | `formId`, `groups?` | A submitted deduction verified as correct; `groups` names the slot-groups that matched (supports verify-in-batches). |
| `deduction:failed` | `formId`, `groups?` | A submitted deduction was rejected; `groups` names the slot-groups that failed. |
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

## XPHandle

`XPHandle`（通过 `ref`）暴露了顶层方法 `openApp(appId, props?)`、`openFile(path)`、`closeWindow(id)`、`showAlert(title, message)` 以及 `reset()`，还有若干分组执行 API：

- `fs`: `readFile(path)`, `writeFile(path, content)`, `createFile(path, node?)`, `deleteFile(path)`, `getNode(path)`, `exists(path)`, `unlockNode(path)`
- `session`: `login(password?)`, `logout()`, `shutdown()`, `restart()`
- `appearance`: `setWallpaper(idOrUrl)`, `setLanguage(lang)`
- `windows`: `list()`, `focus(id)`, `minimize(id)`, `maximize(id)`, `restore(id)`
- `sound.play(name)` 与 `emit(event)`（注入到 `onEvent` 和场景触发器读取的同一总线）
- `schedule({ id?, delayMs?, at?, event? })` / `cancelSchedule(id)` —— 基于时间的触发器。schedule 在 `delayMs` 之后或在 `at` 指定的时间戳（epoch 毫秒）到达后触发 `time:fire` 事件（或调用方传入的 `event`）。**待执行的 schedule 会按实例持久化：如果页面关闭期间截止时间已过，下次加载时仍会被触发**（即“在启动时补算已流逝的效果”——并没有后台执行）。同一个子系统还会在总线上发出整点 `time:hour` 以及 `user:idle` / `user:active` 事件。

```jsx
// Remind the player 90s after they lock a folder — survives a reload.
ref.current.schedule({ id: 'hint', delayMs: 90_000,
  event: { type: 'notification:show', id: 'hint', title: 'Psst… try 2003' } });
```

经典的整点报时是 `time:hour` 的可选消费者：`<WindowsXP hourlyChime />`（或文化包的 `hourlyChime: true`）；默认关闭。`idleThresholdMs` 用于调整触发 `user:idle` 的阈值（默认 60000）。

`reset()` 会清除该实例 `storagePrefix` 对应的**两层**存储（localStorage + IndexedDB 文件内容），然后重新加载。保存与加载请见下文“保存与加载快照”。

### 组件树内部

在组件树内部（自定义应用），无需 prop drilling 即可订阅：

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

### 裸 Provider 组合

高级开发者如使用裸 Provider（`AppProviders` 逃生舱），可以创建自己的总线，并观察桌面实例实际发出的同一对象：

```jsx
import { createXPEventBus, EventBusProvider } from '@caoergou/windows-xp';

const bus = createXPEventBus();
bus.subscribe((e) => console.log(e.type));
// <EventBusProvider bus={bus}> … your providers … </EventBusProvider>
```

## 从宿主驱动桌面

仅用一个 `ref`——无需自定义应用，也无需访问 context——宿主应用就能植入线索文件，并在玩家打开它时作出反应（核心 ARG 循环）：

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

之后，可通过编程方式解锁文件夹并更换桌面主题：

```jsx
xp.current?.fs.unlockNode(['vault']);
xp.current?.appearance.setWallpaper('bliss');
```

## 保存与加载快照

`getSnapshot()` 会捕获整个实例——文件系统（含文件内容）、回收站、打开的窗口、壁纸、语言，以及预留的 `flags` 槽位——并输出为可移植、带版本号的 `XPSnapshot` JSON 对象。`loadSnapshot()` 会用快照替换当前实例的状态并重新加载以恢复状态。快照可在不同机器或浏览器之间迁移，玩家可以分享存档，作者也可以分发检查点。

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

如果快照的 `version` 高于当前运行版本，`loadSnapshot()` 会抛出 `XPSnapshotVersionError`（已导出）而不是破坏状态——因此请用 `try/catch` 包裹导入逻辑，并提示用户“请更新版本”。

## 永久链接与分享链接

把 URL 映射到桌面状态，博客文章、搜索结果或活动二维码就能让访问者直接落在某个打开的窗口。

**入站——从 URL 打开窗口。**`openOnLoad` 接收一个或多个*键路径*（从桌面根目录开始的文件系统键序列，用 `/` 连接）。桌面进入可交互状态后（`skipBoot`/`autoLogin` 之后）会自动打开对应窗口；无效路径会静默回退到普通桌面。把它接到你自己的 URL 参数即可，组件不依赖任何路由库：

```jsx
import { WindowsXP } from '@caoergou/windows-xp';

const open = new URLSearchParams(location.search).getAll('open');
// e.g. visiting …?open=My Documents/readme.txt&lang=en opens that file, focused.
export default () => <WindowsXP openOnLoad={open} />;
```

如需更美观的 URL，可传入与宿主路由无关的 `routes` 映射以及当前 `location`（任意框架——只需传入字符串）：

```jsx
<WindowsXP
  location={location.pathname}
  routes={{ '/blog/:slug': ({ slug }) => ({ open: `D:/posts/${slug}.md` }) }}
/>
```

**分享链接。**`getShareUrl(windowId)` 返回一个 `?open=…` 永久链接，能在全新配置下复现一个通过路径打开的窗口（纯组件窗口返回 `null`）。分享按钮可以捕获“当前窗口、已打开、已聚焦”的状态；也可以把同一 URL 编码成二维码用于印刷或活动物料：

```jsx
const url = xp.current?.getShareUrl(windowId); // …/?open=D%3A/posts/hello.md&lang=en
```

**浏览器返回。**设置 `historyIntegration`，打开或关闭顶层窗口会 push/pop `history`，因此 Back 键会关闭最后打开的窗口——内容站点需要此行为，默认关闭（游戏和嵌入场景不需要）：

```jsx
<WindowsXP openOnLoad={open} historyIntegration />
```

**出站——跳出虚构世界的链接。**`external_link` 文件系统节点是一种桌面快捷方式，打开真实 URL 而非窗口；也可以直接调用 handle 上的 `openExternal(url, { newTab })`。无论哪种方式都会触发 `link:external` 事件——这是每个活动漏斗都会衡量的转化信号。把它喂给分析工具：

```jsx
<WindowsXP
  customFileSystem={{
    'Buy tickets': { type: 'external_link', name: 'Buy tickets', href: 'https://example.com/tickets', icon: 'ie' },
  }}
  onEvent={e => {
    if (e.type === 'link:external') gtag('event', 'outbound_click', { url: e.url });
  }}
/>
```

新标签页以 `noopener,noreferrer` 打开，因此嵌入式桌面不会劫持宿主页面。
