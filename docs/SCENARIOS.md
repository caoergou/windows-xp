# Scenario system — author guide (#84)

A **scenario** turns the desktop into a playable story without writing a line of
React. You author plain JSON: a rulebook of `{ on, when?, do }` triggers that
listen to the [event stream](./EVENTS.md), read world state (flags, filesystem,
event history), and drive the shipped actuation primitives (unlock a folder, pop
a tray balloon, send a QQ message, write a file). The engine observes; the
scenario judges (PUZZLE-DESIGN axiom 2) — game meaning lives entirely in the
JSON, never in the core.

- **Source of truth:** the `Scenario` schema in
  [`src/scenario/types.ts`](../src/scenario/types.ts).
- **Runtime:** `ScenarioRunner` subscribes to the bus (#76), evaluates each
  trigger's `when` against world state, and runs its `do` actions in order.
- **Event vocabulary:** the 71-event catalog in
  [`src/events.ts`](../src/events.ts) — the same names the reference table in
  [`USAGE.md`](../USAGE.md) documents.

## Authoring & wiring

A scenario is passed as the `scenario` prop:

```jsx
import { WindowsXP } from '@caoergou/windows-xp';
import prologue from './prologue.scenario.json';

<WindowsXP scenario={prologue} autoLogin />
```

The whole object is JSON-serializable, so it can equally live in a `.json` file
and be `fetch`ed, shipped inside a culture package, or hand-edited.

## The three mechanics

Everything a scenario does composes from three ideas:

- **Doors & keys** — a `{ "locked": true, "password": "…" }` filesystem node is a
  door. A trigger `unlock`s it when the player earns the key (found a clue,
  entered the right command, read the right file). The player-facing challenge is
  the XP password prompt; the scenario decides when it opens.
- **Pushes** — scripted world beats: a QQ buddy comes online and messages you, a
  tray balloon pops, a new file appears on the desktop, a sound plays. These are
  the `qqOnline` / `qqMessage` / `notify` / `addFile` / `playSound` actions.
- **Progress** — `flags` record what the player has done. Booleans gate
  (`hasKey`), numbers count (`attempts`), strings vary (`chapter`). Flags feed
  conditions (`when`) and persist into the snapshot `flags` slot (#117).

## Schema reference

### `Scenario`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `string` | Stable id. Namespaces all persisted progress; **changing it resets the save**. |
| `initialFlags` | `Record<string, boolean\|number\|string>` | Flags seeded before any trigger runs. Optional. |
| `triggers` | `Trigger[]` | The rulebook. |

### `Trigger`

A rule of the shape `{ on, when?, do }`.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `string?` | Stable id — used for `once`/`max` bookkeeping and debugging. |
| `on` | `XPEventType \| XPEventType[]` | Event type(s) this trigger listens for. |
| `when` | `Condition?` | Guard. Actions run only when it evaluates true. Omit = always. |
| `do` | `Action[]` | Actions to run, in order. |
| `once` | `boolean?` | Fire at most once for the lifetime of the save. Default `false`. |
| `max` | `number?` | Fire at most this many times (see [semantics](#once--max)). |

### `Condition`

A composable predicate tree. Leaves read flags, the triggering event's payload,
the persisted event journal, and the filesystem.

| Shape | Holds when |
| --- | --- |
| `{ all: Condition[] }` | Every child holds (AND). |
| `{ any: Condition[] }` | At least one child holds (OR). |
| `{ not: Condition }` | The child does not hold (NOT). |
| `{ flag, eq?, gte?, lte? }` | Flag test. No comparator ⇒ truthiness; `eq` ⇒ equality; `gte`/`lte` ⇒ numeric compare. |
| `{ event: { field: value, … } }` | Every listed field equals the **triggering** event's field (deep-equal for arrays like `path`). |
| `{ happened: { type, match? } }` | An event of `type` matching `match` has **ever** happened (event journal). |
| `{ count: { type, match? }, gte?, lte?, eq? }` | Journal count of matching events compared with `gte`/`lte`/`eq`. |
| `{ exists: string[] }` | A filesystem node exists at that path. |
| `{ unlocked: string[] }` | The node at that path exists and is **not** locked. |
| `{ contentContains: { path, contains } }` | The text file at `path` contains the `contains` substring. |

Paths are `string[]` — the sequence of node keys from the desktop root, e.g.
`["我的电脑", "本地磁盘 (D:)", "游戏", "聊天记录.txt"]`.

### `Action`

Each action maps to a shipped actuation primitive.

| Shape | Effect |
| --- | --- |
| `{ setFlag, value? }` | Set a flag (default `true`). |
| `{ incFlag, by? }` | Increment a numeric flag by `by` (default 1); missing/non-number treated as 0. |
| `{ unlock: string[] }` | Clear a node's `locked` flag — the "door opens" beat. |
| `{ addFile: { path, node? } }` | Create a file/folder node at `path`. |
| `{ removeFile: string[] }` | Delete the node at `path`. |
| `{ writeFile: { path, content } }` | Overwrite a text file's content. |
| `{ notify: { title, body?, icon?, timeout?, anchorId? } }` | Pop an XP tray balloon. |
| `{ qqMessage: { buddyId, text } }` | Deliver an incoming QQ message from a buddy. |
| `{ qqOnline: string }` | Bring a QQ buddy online (knock + tray blink + balloon). |
| `{ openApp: { appId, props? } }` | Open a registered app by id. |
| `{ openFile: string[] }` | Open a filesystem node by absolute path. |
| `{ playSound: string }` | Play a named XP system sound. |
| `{ emit: XPEvent }` | Inject an event onto the bus — visible to `onEvent` and other triggers. |
| `{ alert: { title, message } }` | Show a modal alert dialog. |
| `{ after: { ms, do: Action[] } }` | Run nested actions after `ms` ([delayed actions](#delayed-actions)). |

> These are the only fields the schema defines. Do not invent others — an
> unknown key is authoring drift, not a feature.

## Event-history predicates: `happened` & `count`

`when` normally reads the *triggering* event (via `event`), but a scenario often
needs to gate on the **past**. The runtime keeps a bounded, persisted journal of
events, and two predicates read it:

- `happened` — has this ever occurred at least once?
  ```json
  { "happened": { "type": "file:open", "match": { "name": "聊天记录.txt" } } }
  ```
- `count` — how many times, compared numerically?
  ```json
  { "count": { "type": "password:fail" }, "gte": 3 }
  ```

`match` filters the journal the same way `event` matches a single payload: every
listed field must equal the recorded event's field (arrays deep-equal). This is
how you reward persistence ("after the player has failed the lock 3 times, drop a
hint") or gate a beat on an earlier discovery.

## `once` & `max`

Both bound how often a trigger's `do` runs across the save's lifetime — per-trigger
fire counts persist, so they hold across reloads:

- `once: true` — fires at most one time, ever. Equivalent to `max: 1`.
- `max: n` — fires at most `n` times.
- With both set, the smaller bound wins.
- Omit both — the trigger fires every time its `on` event arrives and its `when`
  holds.

A fire only counts when the condition passes and the actions run; an event that
arrives while `when` is false does not consume the budget. Because the count is
keyed by trigger, give any bounded trigger a stable `id` so the bookkeeping
survives edits elsewhere in the rulebook.

## Delayed actions

`{ after: { ms, do: [...] } }` schedules nested actions on the #130 scheduler.
There is **no background execution**: pending delays persist per instance and
their elapsed effects are computed at the next launch. If a delay's deadline
passed while the page was closed, its actions fire on the following load. Use it
for "beat, then payoff" pacing — knock a buddy online, then have them message a
few seconds later:

```json
{ "qqOnline": "crystal" },
{ "after": { "ms": 3000, "do": [
  { "qqMessage": { "buddyId": "crystal", "text": "在吗？晚上去网吧联机 CS 吗？" } }
] } }
```

## Persistence & snapshots

The runtime persists progress through the per-instance storage handle, keyed
canonically and namespaced by the instance's `storagePrefix`:

| Key | Holds |
| --- | --- |
| `scenario_flags` | Current flag values. |
| `scenario_journal` | The bounded event journal (for `happened`/`count`). |
| `scenario_fires` | Per-trigger fire counts (for `once`/`max`). |
| `scenario_pending` | Pending delayed actions (`after`). |

- **Reset on id change.** All scenario progress is wiped when `scenario.id`
  changes — that is the signal for "a new story starts fresh." Keep `id` stable
  across edits to the same scenario; bump it to force a reset.
- **Snapshot integration.** Flags flow into the snapshot `flags` slot (#117), so
  a saved game carries scenario progress with it. Sharing a save shares where the
  player is in the story.

## Worked example

A minimal prologue against the shipped `zh` content: reading the D-drive chat log
is the key that unlocks the `C:\WINDOWS` folder; the crystal-girl buddy then comes
online and nudges the player, and a flag records the beat.

```json
{
  "id": "prologue-v1",
  "initialFlags": { "chapter": "intro", "readLog": false },
  "triggers": [
    {
      "id": "read-chat-log",
      "on": "file:open",
      "when": { "event": { "name": "聊天记录.txt" } },
      "once": true,
      "do": [
        { "setFlag": "readLog", "value": true },
        { "notify": { "title": "想起来了", "body": "密码好像和某个年代有关…", "icon": "360safe" } },
        { "unlock": ["我的电脑", "本地磁盘 (C:)", "WINDOWS"] }
      ]
    },
    {
      "id": "crystal-knocks",
      "on": "file:unlock",
      "when": { "all": [
        { "flag": "readLog" },
        { "unlocked": ["我的电脑", "本地磁盘 (C:)", "WINDOWS"] }
      ] },
      "once": true,
      "do": [
        { "qqOnline": "crystal" },
        { "after": { "ms": 3000, "do": [
          { "qqMessage": { "buddyId": "crystal", "text": "找到啦？记得把迅雷下好的电影拷给我~" } }
        ] } },
        { "setFlag": "chapter", "value": "act1" }
      ]
    }
  ]
}
```

What it demonstrates: `event` matches the triggering payload; `once` makes each
beat fire exactly once; `unlock` opens a door by real path; `flag` + `unlocked`
gate the follow-up; `qqOnline`/`qqMessage` push the story; `after` paces the
payoff; and `setFlag` advances progress that persists into the snapshot.
