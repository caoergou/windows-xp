---
title: Scenario system
---

# Scenario system

Turn the desktop into a playable story with **no React** — author a JSON
rulebook of `{ on, when?, do }` triggers that listen to the [events above](/guide/events), read
world state (flags, filesystem, event history), and drive shipped primitives
(unlock a folder, pop a balloon, send a QQ message, write a file). Pass it via
the `scenario` prop:

```jsx
import { WindowsXP } from '@caoergou/windows-xp';

const scenario = {
  id: 'prologue-v1',
  initialFlags: { readLog: false },
  triggers: [
    {
      id: 'read-chat-log',
      on: 'file:open',
      when: { event: { name: '聊天记录.txt' } },
      once: true,
      do: [
        { setFlag: 'readLog', value: true },
        { unlock: ['我的电脑', '本地磁盘 (C:)', 'WINDOWS'] },
        { qqOnline: 'crystal' },
      ],
    },
  ],
};

<WindowsXP scenario={scenario} autoLogin />;
```

Progress (flags, a bounded event journal, per-trigger fire counts, pending
delayed `after` actions) persists per instance and resets when `scenario.id`
changes; flags feed the snapshot `flags` slot. Full schema reference — every
condition and action, `once`/`max` semantics, `happened`/`count` predicates,
delayed actions, and a worked example — lives in
[`docs/SCENARIOS.md`](https://github.com/caoergou/windows-xp/blob/main/docs/SCENARIOS.md).

## Scenario DevTools

`onEvent={console.log}` already shows you *what* happened — so this panel doesn't
duplicate an event stream. It surfaces the two things that live *inside* the
engine and never reach the console: **why a trigger didn't fire**, and the
current flags. Set `devtools` to mount an XP-styled overlay:

```tsx
<WindowsXP scenario={scenario} devtools autoLogin />
```

Two tabs:

- **Triggers** — for the most recent event, each registered trigger's outcome:
  `fired`, `no match` (event type didn't match `on`), or a skip reason. When a
  trigger matched but its `when` was false, the condition tree is shown annotated
  ✓/✗ so the **exact false predicate** is obvious (e.g. `✗ flag door_open
  (undefined) is truthy` — the runtime only ever computes a single boolean, so
  this is otherwise invisible).
- **Flags** — every current flag with its value and *who last changed it* (which
  event → which trigger).

It reads the trace the runtime publishes, is opt-in, and tree-shakes out of a
production build that never sets `devtools`. Advanced hosts can mount
`<DevToolsPanel/>` themselves or subscribe to `subscribeTrace(prefix, …)` to feed
their own console logging or UI.

