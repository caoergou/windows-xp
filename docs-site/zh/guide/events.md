---
title: 事件与命令式控制
---

# 事件与命令式控制

用户的每个操作都会触发一个类型化事件：打开文件、启动应用、登录桌面，等等。你可以用 `onEvent` 监听这些事件，也可以用 React `ref` 从外部控制桌面。

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

**事件类型**（`XPEvent` 是带类型负载的事件联合类型）。下方目录由 `src/events.ts` 自动生成；命名规则、事件分类和 payload 字段约定见 [`docs/EVENTS.md`](https://github.com/caoergou/windows-xp/blob/main/docs/EVENTS.md)。

<!-- EVENTS:START -->

| Event                   | Payload                            | Description                                                                                                                                            |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app:launch`            | `appId`, `windowId`, `title`       | 一个应用程序窗口被打开。                                                                                                                               |
| `app:close`             | `appId`, `windowId`                | 一个应用程序窗口被关闭。                                                                                                                               |
| `window:focus`          | `windowId`, `appId`                | 一个窗口获得焦点（被提到最前）。                                                                                                                       |
| `window:minimize`       | `windowId`, `appId`                | 一个窗口被最小化到任务栏。                                                                                                                             |
| `window:maximize`       | `windowId`, `appId`                | 一个窗口被最大化。                                                                                                                                     |
| `window:restore`        | `windowId`, `appId`                | 一个窗口从最小化/最大化状态恢复。                                                                                                                      |
| `startmenu:open`        | —                                  | 开始菜单被打开。                                                                                                                                       |
| `startmenu:close`       | —                                  | 开始菜单被关闭。                                                                                                                                       |
| `contextmenu:open`      | `target?`, `path?`                 | 右键上下文菜单被打开；`target` 对点击对象进行分类（'desktop' / 'file' / 'app' …），`path` 在节点为目标时定位该节点。                                   |
| `file:open`             | `path`, `name`, `nodeType`, `app?` | 一个文件或文件夹被打开（双击 / 启动）。                                                                                                                |
| `file:create`           | `path`, `name`, `nodeType`         | 一个文件或文件夹被创建。                                                                                                                               |
| `file:update`           | `path`, `name`, `content?`         | 文件的属性被编辑；`content` 在文本发生变化时存在（“玩家输入了口令”的谜题节点）。                                                                       |
| `file:delete`           | `path`, `name`                     | 一个文件被删除（移入回收站）。                                                                                                                         |
| `file:rename`           | `path`, `oldName`, `newName`       | 一个文件或文件夹被重命名。                                                                                                                             |
| `file:move`             | `from`, `to`, `name`               | 一个文件从 `from` 移动到 `to`（剪切粘贴或拖拽）。                                                                                                      |
| `file:copy`             | `from`, `to`, `name`               | 一个文件从 `from` 复制到 `to`。                                                                                                                        |
| `file:restore`          | `name`                             | 一个文件从回收站被还原。                                                                                                                               |
| `file:unlock`           | `name`                             | 一个被锁定的节点被解锁（正确密码，或宿主/场景强制解锁）。                                                                                              |
| `file:properties`       | `path`, `name`                     | 文件的“属性”对话框被打开——查看了元数据（大小、日期）；场景中的线索通道（M1）。                                                                         |
| `folder:delete`         | `path`, `name`                     | 一个文件夹被删除（文件触发 `file:delete`；文件夹触发此事件）。                                                                                         |
| `recyclebin:empty`      | —                                  | 回收站被清空。                                                                                                                                         |
| `password:fail`         | `path`, `name`, `attempt`          | 为锁定节点输入了错误密码；`attempt` 统计连续失败次数。                                                                                                 |
| `session:login`         | —                                  | 用户成功登录。                                                                                                                                         |
| `session:login-fail`    | —                                  | 登录尝试失败（密码错误）。                                                                                                                             |
| `session:logout`        | —                                  | 用户注销。                                                                                                                                             |
| `session:boot-complete` | —                                  | 桌面完成启动并进入可交互状态。                                                                                                                         |
| `session:shutdown`      | `mode`                             | 机器通过开始菜单被关机、重启或注销。                                                                                                                   |
| `flag:change`           | `flag`, `value`                    | 场景标志的值发生变化（set/inc）。允许触发器在进度本身上触发，而不仅限于 UI 事件。由场景运行时发出，而非核心引擎。                                      |
| `cmd:exec`              | `command`                          | 在命令提示符中执行了一条命令。                                                                                                                         |
| `ie:navigate`           | `url`, `generated?`                | Internet Explorer 导航到一个 URL；当页面来自宿主内容提供方而非捆绑/创作页面时，`generated` 为 true。                                                   |
| `wallpaper:change`      | `wallpaper`                        | 桌面壁纸被更换（`wallpaper` 为 id 或 URL）。                                                                                                           |
| `screensaver:start`     | —                                  | 屏幕保护程序启动。                                                                                                                                     |
| `screensaver:stop`      | —                                  | 屏幕保护程序被解除。                                                                                                                                   |
| `notification:show`     | `id`, `title`, `body?`             | 托盘通知气泡被显示。                                                                                                                                   |
| `notification:click`    | `id`                               | 托盘通知气泡被点击。                                                                                                                                   |
| `time:hour`             | `hour`                             | 在每个整点触发；hour 为 0-23（驱动整点报时铃声）。                                                                                                     |
| `time:fire`             | `id`                               | 一个定时任务（schedule）被触发（延迟已耗尽或其 `at` 截止时间已过，包括在页面关闭期间）。                                                               |
| `user:idle`             | `idleMs`                           | 用户已连续不活跃达到空闲阈值；`idleMs` 即为该阈值。                                                                                                    |
| `user:active`           | —                                  | 用户在空闲后恢复活动。                                                                                                                                 |
| `qq:login`              | —                                  | 玩家登录 QQ（好友列表面板打开）。                                                                                                                      |
| `qq:open`               | `buddyId?`                         | QQ 客户端打开，或打开了特定好友的聊天窗口（`buddyId`）。                                                                                               |
| `qq:online`             | `buddyId`, `nickname`              | 一位好友上线。                                                                                                                                         |
| `qq:message`            | `buddyId`, `direction`, `text`     | 一条 QQ 消息被发送或接收；`direction` 为 'incoming'（来自好友）或 'outgoing'（来自玩家）。                                                             |
| `qq:reply`              | `buddyId`, `text`                  | 玩家向好友发送了一条回复（与谜题相关的“玩家已回答”节点）。                                                                                             |
| `qq:offline`            | `buddyId`                          | 一位好友下线。                                                                                                                                         |
| `qq:status`             | `buddyId`, `status?`, `signature?` | 一位好友的状态或签名发生变化——可用于剧情环境反馈（例如玩家应该注意到的签名档语句）。                                                                   |
| `qq:choice`             | `buddyId`, `choiceId`              | 玩家选择了一个预设回复选项（分支选择，与自由文本的 `qq:reply` 不同）。                                                                                 |
| `game:start`            | `appId`, `difficulty?`             | 游戏开始新一轮；`appId` 为游戏名称，`difficulty` 在适用时存在。                                                                                        |
| `game:win`              | `appId`, `difficulty?`, `timeMs?`  | 游戏获胜；`timeMs` 为游戏记录完成时间时的耗时。                                                                                                        |
| `game:lose`             | `appId`, `difficulty?`             | 游戏失败。                                                                                                                                             |
| `media:play`            | `path?`, `title?`                  | 媒体播放开始或恢复；`path` 为已知时的播放源。                                                                                                          |
| `media:pause`           | `path?`                            | 媒体播放被暂停。                                                                                                                                       |
| `media:ended`           | `path?`                            | 媒体播放到达曲目末尾。                                                                                                                                 |
| `media:seek`            | `path?`, `position`                | 播放头被移动；`position` 为新的播放时间（秒）。                                                                                                        |
| `search:query`          | `query`, `hit`, `resultIds?`       | 对虚构世界中的搜索引擎执行了一次查询（伪造的 Baidu/AltaVista）；hit 表示是否有创作结果匹配。由场景运行时/应用发出，而非核心引擎。                      |
| `evidence:collect`      | `termId`, `source?`                | 一个术语/线索进入玩家的词库（点击了高亮术语，或由场景授予）。                                                                                          |
| `evidence:pin`          | `itemId`                           | 一个条目被固定到证据板。                                                                                                                               |
| `evidence:link`         | `sourceId`, `targetId`             | 两个已固定条目在证据板上被关联。                                                                                                                       |
| `evidence:unpin`        | `itemId`                           | 一个条目从证据板上被移除。                                                                                                                             |
| `deduction:submit`      | `formId`, `slots?`                 | 玩家提交了一份推理表单（Mad-Libs 槽位 / Obra-Dinn 三元组）；`slots` 将槽位 id 映射为所选值。                                                           |
| `deduction:verified`    | `formId`, `groups?`                | 提交的推理被验证为正确；`groups` 列出匹配的槽位组（支持批量验证）。                                                                                    |
| `deduction:failed`      | `formId`, `groups?`                | 提交的推理被拒绝；`groups` 列出失败的槽位组。                                                                                                          |
| `lesson:start`          | `lessonId`                         | 一个引导式教程开始。                                                                                                                                   |
| `lesson:step-complete`  | `lessonId`, `stepId`               | 一个教程步骤已完成（学习者执行了预期操作）。                                                                                                           |
| `lesson:hint-shown`     | `lessonId`, `stepId`, `hintId?`    | 为当前步骤显示了提示（提示阶梯升级）。                                                                                                                 |
| `lesson:step-failed`    | `lessonId`, `stepId`               | 学习者在某一步执行了错误操作。                                                                                                                         |
| `lesson:complete`       | `lessonId`, `score?`               | 一个教程结束；`score` 为教程评分时的评估结果。                                                                                                         |
| `install:start`         | `appId`                            | 一个软件安装/设置流程开始。                                                                                                                            |
| `install:complete`      | `appId`                            | 一个软件安装完成。                                                                                                                                     |
| `install:cancelled`     | `appId`                            | 一个软件在完成前被取消安装。                                                                                                                           |
| `ui:action`             | `appId`, `control`, `value?`       | 一个语义化应用控件发生变化（复选框被切换、选项被选中）；`control` 为其名称，`value` 为新值。由数据驱动应用（defineApp）发出，受 `settingEquals` 控制。 |
| `link:external`         | `url`, `newTab`, `source?`         | 访问者从桌面内跳转到外部 URL——可用于追踪站外跳转或营销活动转化。`newTab` 表示是否在新标签页打开；`source` 为来源窗口 id 或文件路径，在已知时提供。     |

_Generated from `src/events.ts` by `npm run docs:events` — do not edit by hand._

<!-- EVENTS:END -->

## 常见事件用法示例

### 记录用户打开的每个文件

```jsx
<WindowsXP
  onEvent={e => {
    if (e.type === 'file:open') {
      console.log('opened', e.path.join('/'));
    }
  }}
/>
```

### 响应错误密码

```jsx
<WindowsXP
  onEvent={e => {
    if (e.type === 'password:fail' && e.name === 'vault') {
      console.log(`第 ${e.attempt} 次尝试失败`);
    }
  }}
/>
```

### 桌面就绪后执行代码

```jsx
<WindowsXP
  autoLogin
  onEvent={e => {
    if (e.type === 'session:boot-complete') {
      console.log('桌面已可交互');
    }
  }}
/>
```

## XPHandle

`XPHandle`（通过 `ref`）暴露了打开应用/文件、控制窗口与会话、读写文件系统、保存/恢复整个桌面的方法。常用方法：

- `openApp(appId, props?)`、`openFile(path)`、`closeWindow(id)`
- `showAlert(title, message)`、`notify(options)`
- `openExternal(url, { newTab })`、`getShareUrl(windowId)`
- `startLesson(lessonId)`、`stopLesson()`
- `getSnapshot()`、`loadSnapshot(snapshot)`、`reset()`
- `emit(event)` — 向 `onEvent` 与场景触发器共用的事件总线注入事件（总线即所有事件的统一分发通道）

分组 API：

- `fs`: `readFile(path)`、`writeFile(path, content)`、`createFile(path, node?)`、`deleteFile(path)`、`getNode(path)`、`exists(path)`、`unlockNode(path)`
- `session`: `login(password?)`、`logout()`、`shutdown()`、`restart()`
- `appearance`: `setWallpaper(idOrUrl)`、`setLanguage(lang)`
- `windows`: `list()`、`focus(id)`、`minimize(id)`、`maximize(id)`、`restore(id)`（将最小化的窗口恢复并聚焦）
- `sound.play(name)`
- `schedule({ id?, delayMs?, at?, event? })` / `cancelSchedule(id)` —— 基于时间的触发器。schedule 在 `delayMs` 之后或在 `at` 指定的时间戳（从 1970-01-01 算起的毫秒数，例如 `Date.now()` 的返回值）到达后触发 `time:fire` 事件（或调用方传入的 `event`）。**待执行的 schedule 会按实例持久化：如果页面关闭期间截止时间已过，下次加载时仍会被触发**（即“在启动时补算已流逝的效果”——并没有后台执行）。同一个子系统还会在总线上发出整点 `time:hour` 以及 `user:idle` / `user:active` 事件。

```jsx
// 锁定文件夹 90 秒后提示玩家——刷新页面后仍然有效。
xp.current.schedule({
  id: 'hint',
  delayMs: 90_000,
  event: { type: 'notification:show', id: 'hint', title: '提示… 试试 2003' },
});
```

经典的整点报时是 `time:hour` 的可选消费者：`<WindowsXP hourlyChime />`（或文化包的 `hourlyChime: true`）；默认关闭。`idleThresholdMs` 用于调整触发 `user:idle` 的阈值（默认 60000）。

`reset()` 会清除该实例 `storagePrefix` 对应的**两层**存储（localStorage + IndexedDB 文件内容），然后重新加载。保存与加载请见下文“保存与加载快照”。

### 组件树内部

在组件树内部（自定义应用），无需 prop drilling 即可订阅：

```jsx
import { useXPEvents } from '@caoergou/windows-xp';

function EventLogger() {
  useXPEvents(e => {
    if (e.type === 'file:open') {
      /* 响应世界变化 */
    }
  });
  return null;
}
```

### 底层 Provider 组合

如果你不想使用 `<WindowsXP>`，而是用 `AppProviders` 自己拼装 Provider 树，可以创建独立的事件总线，并观察桌面实例实际发出的同一事件对象：

```jsx
import { createXPEventBus, EventBusProvider } from '@caoergou/windows-xp';

const bus = createXPEventBus();
bus.subscribe(e => console.log(e.type));
// <EventBusProvider bus={bus}> … your providers … </EventBusProvider>
```

## 从宿主驱动桌面

仅用一个 `ref`——无需自定义应用，也无需访问 context——宿主应用就能植入线索文件，并在玩家打开它时作出反应（这是交互式解谜/ARG 的核心循环；ARG 即 Alternate Reality Game，把现实与虚构叙事结合的解谜形式）：

```jsx
import { useRef, useEffect } from 'react';
import { WindowsXP } from '@caoergou/windows-xp';
import type { XPHandle, XPEvent } from '@caoergou/windows-xp';

function Arg() {
  const xp = useRef<XPHandle>(null);

  // 桌面挂载后创建初始文件和一个带锁的文件夹。
  useEffect(() => {
    xp.current?.fs.createFile(['diary.txt'], { type: 'file', app: 'Notepad', content: '…' });
    xp.current?.fs.createFile(['vault'], { type: 'folder', locked: true, password: 'BLISS' });
  }, []);

  return (
    <WindowsXP
      ref={xp}
      autoLogin
      onEvent={(e: XPEvent) => {
        // 玩家打开日记后，放下下一条线索。
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

// 导出：把当前桌面下载为 .json 文件。
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

// 导入：加载存档文件（会重新加载以应用）。
async function uploadSave(xp, file) {
  const snapshot = JSON.parse(await file.text());
  await xp.current.loadSnapshot(snapshot); // 版本过高时抛出 XPSnapshotVersionError
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

**分享链接。**`getShareUrl(windowId)` 返回一个 `?open=…` 永久链接，能在全新配置下复现一个通过路径打开的窗口（仅由组件渲染的窗口返回 `null`）。分享按钮可以捕获“当前窗口、已打开、已聚焦”的状态；也可以把同一 URL 编码成二维码用于印刷或活动物料：

```jsx
const url = xp.current?.getShareUrl(windowId); // …/?open=D%3A/posts/hello.md&lang=en
```

**浏览器返回。**设置 `historyIntegration`，打开或关闭顶层窗口会 push/pop `history`，因此 Back 键会关闭最后打开的窗口——内容站点需要此行为，默认关闭（游戏和嵌入场景不需要）：

```jsx
<WindowsXP openOnLoad={open} historyIntegration />
```

**出站——跳转到真实外部网站的链接。**`external_link` 文件系统节点是一种桌面快捷方式，打开真实 URL 而非窗口；也可以直接调用 handle 上的 `openExternal(url, { newTab })`。无论哪种方式都会触发 `link:external` 事件——可用于追踪站外跳转或营销活动转化。把它喂给分析工具：

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

新标签页以 `noopener,noreferrer` 打开，因此嵌入式桌面不会劫持宿主页面。
