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

<WindowsXP scenario={prologue} autoLogin />;
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

| Field          | Type                                      | Meaning                                                                        |
| -------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| `id`           | `string`                                  | Stable id. Namespaces all persisted progress; **changing it resets the save**. |
| `initialFlags` | `Record<string, boolean\|number\|string>` | Flags seeded before any trigger runs. Optional.                                |
| `triggers`     | `Trigger[]`                               | The rulebook.                                                                  |

### `Trigger`

A rule of the shape `{ on, when?, do }`.

| Field  | Type                           | Meaning                                                          |
| ------ | ------------------------------ | ---------------------------------------------------------------- |
| `id`   | `string?`                      | Stable id — used for `once`/`max` bookkeeping and debugging.     |
| `on`   | `XPEventType \| XPEventType[]` | Event type(s) this trigger listens for.                          |
| `when` | `Condition?`                   | Guard. Actions run only when it evaluates true. Omit = always.   |
| `do`   | `Action[]`                     | Actions to run, in order.                                        |
| `once` | `boolean?`                     | Fire at most once for the lifetime of the save. Default `false`. |
| `max`  | `number?`                      | Fire at most this many times (see [semantics](#once--max)).      |

#### Triggering on progress: `on: 'flag:change'` (#207)

Besides UI events, a trigger can fire on **a flag changing value** — progression
itself, not only a user action. When `setFlag`/`incFlag` changes a flag to a new
value, the runtime emits `flag:change { flag, value }`; a trigger listens with:

```json
{
  "on": "flag:change",
  "when": { "event": { "flag": "have_key" } },
  "do": [{ "notify": { "title": "You can open the door now." } }]
}
```

The synthetic event's payload is the changed `flag` and its new `value`, matched
via the ordinary `event` predicate. It fires **only on a real change** (setting a
flag to the value it already holds emits nothing), so a stable state can't loop.

#### Trigger order & flag cascades (#207)

Within one event, triggers are evaluated in **declaration (array) order**, and a
later trigger sees flag mutations made by earlier triggers in the same event —
so ordering your rulebook is a deliberate tool. A `flag:change` emitted while an
action runs is processed **depth-first** (before the emitting trigger's next
action returns), bounded by a cascade-depth guard against runaway loops. The
headless solver models the same fixpoint breadth-first; both converge to the same
flags for order-independent rulebooks.

### `Condition`

A composable predicate tree. Leaves read flags, the triggering event's payload,
the persisted event journal, and the filesystem.

| Shape                                          | Holds when                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `{ all: Condition[] }`                         | Every child holds (AND).                                                                            |
| `{ any: Condition[] }`                         | At least one child holds (OR).                                                                      |
| `{ not: Condition }`                           | The child does not hold (NOT).                                                                      |
| `{ flag, eq?, gte?, lte? }`                    | Flag test. No comparator ⇒ truthiness; `eq` ⇒ equality; `gte`/`lte` ⇒ numeric compare.              |
| `{ event: { field: value, … } }`               | Every listed field equals the **triggering** event's field (deep-equal for arrays like `path`).     |
| `{ happened: { type, match? } }`               | An event of `type` matching `match` has **ever** happened (event journal).                          |
| `{ count: { type, match? }, gte?, lte?, eq? }` | Journal count of matching events compared with `gte`/`lte`/`eq`.                                    |
| `{ exists: string[] }`                         | A filesystem node exists at that path.                                                              |
| `{ unlocked: string[] }`                       | The node at that path exists and is **not** locked.                                                 |
| `{ contentContains: { path, contains } }`      | The text file at `path` contains the `contains` substring.                                          |
| `{ pinned: string }`                           | The evidence item is currently on the board (net `evidence:pin` > `evidence:unpin` in the journal). |
| `{ linked: { a, b } }`                         | Items `a` and `b` are linked and both still pinned (order-insensitive).                             |

Paths are `string[]` — the sequence of node keys from the desktop root, e.g.
`["我的电脑", "本地磁盘 (D:)", "游戏", "聊天记录.txt"]`.

### `Action`

Each action maps to a shipped actuation primitive.

| Shape                                                      | Effect                                                                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `{ setFlag, value? }`                                      | Set a flag (default `true`).                                                                                                       |
| `{ incFlag, by? }`                                         | Increment a numeric flag by `by` (default 1); missing/non-number treated as 0.                                                     |
| `{ unlock: string[] }`                                     | Clear a node's `locked` flag — the "door opens" beat.                                                                              |
| `{ addFile: { path, node? } }`                             | Create a file/folder node at `path`.                                                                                               |
| `{ removeFile: string[] }`                                 | Delete the node at `path`.                                                                                                         |
| `{ writeFile: { path, content } }`                         | Overwrite a text file's content.                                                                                                   |
| `{ notify: { title, body?, icon?, timeout?, anchorId? } }` | Pop an XP tray balloon.                                                                                                            |
| `{ qqMessage: { buddyId, text } }`                         | Deliver an incoming QQ message from a buddy.                                                                                       |
| `{ qqOnline: string }`                                     | Bring a QQ buddy online (knock + tray blink + balloon).                                                                            |
| `{ openApp: { appId, props? } }`                           | Open a registered app by id.                                                                                                       |
| `{ openFile: string[] }`                                   | Open a filesystem node by absolute path.                                                                                           |
| `{ playSound: string }`                                    | Play a named XP system sound.                                                                                                      |
| `{ emit: XPEvent }`                                        | Inject an event onto the bus — visible to `onEvent` and other triggers.                                                            |
| `{ alert: { title, message } }`                            | Show a modal alert dialog.                                                                                                         |
| `{ note: { id, content, title?, x?, y?, color? } }`        | Pin or update a desktop sticky note (upsert by `id`) — the cheapest narration channel. `color`: `yellow`\|`blue`\|`pink`\|`green`. |
| `{ removeNote: string }`                                   | Remove a desktop sticky note by id.                                                                                                |
| `{ after: { ms, do: Action[] } }`                          | Run nested actions after `ms` ([delayed actions](#delayed-actions)).                                                               |

> These are the only fields the schema defines. Do not invent others — an
> unknown key is authoring drift, not a feature.

## Localizing beat text: string tables (#207)

A scenario's _logic_ (triggers, puzzle graph) is culture-neutral, but its _beat
text_ — balloon titles, QQ lines, note bodies — is not. Keep them apart: put the
text in a per-locale `strings` table and reference it by key.

```jsonc
{
  "id": "county-2007",
  "strings": {
    "zh": { "intro.title": "还记得吗？", "intro.body": "看看桌面上的便签。" },
    "en": { "intro.title": "Remember?", "intro.body": "Check the desktop note." },
  },
  "triggers": [
    {
      "on": "session:boot-complete",
      "do": [{ "notify": { "titleKey": "intro.title", "bodyKey": "intro.body" } }],
    },
  ],
}
```

`notify` (`titleKey`/`bodyKey`), `alert` (`titleKey`/`messageKey`), `qqMessage`
(`textKey`), and `note` (`titleKey`/`contentKey`) each take a key beside their
literal — the key wins when present. The runtime resolves it against the **active
culture's locale** at fire time, falling back across tables then to the key
itself (so an unresolved key is visible, not blank). One graph, two skins:
`prologueGraph` ships `zh` + `en` tables, so the same story plays in either
language by switching locale.

Inline literals still work for prototyping; once a `strings` table exists, the
validator nudges you (one summary warning) to extract the rest, and flags a
`*Key` that references a missing string.

## Event-history predicates: `happened` & `count`

`when` normally reads the _triggering_ event (via `event`), but a scenario often
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

| Key                | Holds                                               |
| ------------------ | --------------------------------------------------- |
| `scenario_flags`   | Current flag values.                                |
| `scenario_journal` | The bounded event journal (for `happened`/`count`). |
| `scenario_fires`   | Per-trigger fire counts (for `once`/`max`).         |
| `scenario_pending` | Pending delayed actions (`after`).                  |

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
      "when": {
        "all": [{ "flag": "readLog" }, { "unlocked": ["我的电脑", "本地磁盘 (C:)", "WINDOWS"] }]
      },
      "once": true,
      "do": [
        { "qqOnline": "crystal" },
        {
          "after": {
            "ms": 3000,
            "do": [
              {
                "qqMessage": { "buddyId": "crystal", "text": "找到啦？记得把迅雷下好的电影拷给我~" }
              }
            ]
          }
        },
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

## Author toolchain (PUZZLE-DESIGN §4)

Scenarios are authored across layers that all compile to the one JSON runtime
above — so hand-written JSON, a typed builder, and a headless test harness share
one save format and one linter.

- **Layer 0 — imperative host**: `ref.emit()`, `onEvent`, the `fs.*`/`session.*`
  handle. The escape hatch for set-pieces the declarative layers can't say.
- **Layer 1 — declarative JSON** (this document): the lingua franca; what
  saves/loads and what the other layers compile into.
- **Layer 2 — typed fluent builder**: `defineScenario()` + helpers, for
  developers who want autocomplete over the event catalog and compile-time
  payload checking.
- **Headless solver**: run a scenario over an event sequence with no browser —
  "CI for stories".

### Layer 2 — `defineScenario`

```ts
import { defineScenario, not, flag, setFlag, after, ms, qqOnline } from '@caoergou/windows-xp';

const s = defineScenario('county-2007').initialFlag('act', 1);

s.on('file:open', { name: '日记.txt' }) // `match` becomes an implicit event condition
  .when(not(flag('act2')))
  .once()
  .do(setFlag('readDiary'), after(ms('3s'), qqOnline('crystal')));

export default s.build(); // → the Layer-1 Scenario JSON
```

Condition helpers: `all` / `any` / `not` / `flag` / `eventMatch` / `happened` /
`count` / `exists` / `unlocked` / `contentContains`. Action helpers:
`setFlag` / `incFlag` / `unlock` / `addFile` / `removeFile` / `writeFile` /
`notify` / `qqMessage` / `qqOnline` / `openApp` / `openFile` / `playSound` /
`emit` / `alert` / `after`. `ms()` parses `500`, `'90s'`, `'10m'`, `'1h'`.
(Also importable namespaced as `scenarioHelpers`.)

### Headless solver — `solveScenario`

Because triggers and events are data, a scenario is testable without a browser:
feed the walkthrough, assert the ending.

```ts
import { solveScenario, ranAction } from '@caoergou/windows-xp';

const r = solveScenario(
  scenario,
  [
    { type: 'file:open', path: ['D:', '日记.txt'], name: '日记.txt', nodeType: 'file' },
    { type: 'file:unlock', name: '私人' },
  ],
  { fs: [{ path: ['D:', '私人'], locked: true }] }
);

expect(r.flags.solved).toBe(true); // ending reached
expect(ranAction(r, 'unlock')).toBe(true);
```

The solver runs the **same** matching/gating/flag semantics as the live runtime
(a regression test asserts flag-parity between the two). Fidelity notes: delayed
`after` actions apply immediately (headless has no clock — it models
"eventually"), side-effecting actions (`notify`/`qq`/`openApp`/…) are recorded
rather than performed, and `emit` actions feed back into the loop (cascades,
capped by `maxEvents`). Seed FS-gated puzzles with the `fs` option.

### Layer 3 — the Puzzle Dependency Graph

Ron Gilbert's Puzzle Dependency Charts as the _authoring model_. Declare puzzle
nodes with `requires` / `solvedWhen` / `grants`; `compilePuzzleGraph` derives the
Layer-1 triggers (each puzzle → a fire-once trigger gated on its prerequisites'
`solved:<id>` flags + its `solvedWhen`, whose actions set its own solved flag and
run `grants`). The result runs on the same runtime and is testable with the solver.

```ts
import { compilePuzzleGraph, lintPuzzleGraph, scenarioHelpers as h } from '@caoergou/windows-xp';

const graph = {
  id: 'county-2007',
  puzzles: [
    {
      id: 'read-diary',
      on: 'file:open',
      solvedWhen: h.eventMatch({ name: '日记.txt' }),
      hints: [{ afterMs: 600000, text: 'hint.diary.1' }],
    },
    {
      id: 'unlock-folder',
      requires: ['read-diary'],
      gate: true,
      solvedWhen: h.happened('file:unlock', { name: '私人' }), // `on` derived from `happened`
      grants: [h.unlock(['我的电脑', '本地磁盘 (D:)', '私人'])],
      hints: [{ text: 'hint.folder.1' }, { text: 'hint.folder.2' }],
    },
  ],
};

const scenario = compilePuzzleGraph(graph); // → the Layer-1 Scenario; pass as the `scenario` prop
```

`solvedWhen`'s trigger event is derived from its `happened`/`count` types; for
flag/FS/`eventMatch`-only conditions, set `on` explicitly. Mark act bottlenecks
with `gate: true`.

**Hint ladders (M12 anti-stuck contract).** A puzzle's `hints` are an escalating
ladder, best built with `ladder()`: `ladder({ fails: 2, title: '提示' }, a, b)`
shows `a` after 2 `password:fail`s and `b` after 4; `ladder({ idles: 1 }, …)`
reveals a rung per `user:idle` period. `compilePuzzleGraph` turns each rung into
a fire-once `password:fail` / `user:idle` count trigger, gated so it only
balloons while its puzzle is _active_ (prerequisites solved, itself unsolved) and
only once per rung — behaviorally the same as a hand-written
`{ on: 'password:fail', when: count(...) ≥ n }` hint trigger.

**The graph linter** — `lintPuzzleGraph(graph)` catches what PDCs were invented
to catch, mechanically:

- **errors**: missing/self `requires`, dependency **cycles** (deadlock),
  **unreachable** puzzles, puzzles with no derivable trigger event, and a
  **critical-path** puzzle (a `gate`, or one every ending transitively requires)
  with **no hint ladder** — the anti-stuck contract, mechanically enforced;
- **warnings**: an _optional_ (off-critical-path) step with no hint ladder, and
  puzzles that **bypass a `gate`** (don't transitively require it);
- **bushiness**: `report.bushiness[depth]` — how many puzzles are open in
  parallel at each dependency depth — and `report.maxParallel`, free pacing
  visualization. `report.ok` is false when any error is present (wire into CI).

**Reference demo & "CI for stories".** `prologueGraph` (exported) is the序章
authored as a four-node graph; it lints with zero issues. `test/prologueGraph.test.ts`
shows the pattern: lint the graph, then `solveScenario(compilePuzzleGraph(graph),
walkthrough)` and assert the ending is reached — and that out-of-order play does
**not** sequence-break the gate. A story whose walkthrough breaks fails CI like
any other regression.

## Rehearsal & deterministic seek (#207)

Testing an ending shouldn't mean playing ten minutes to reach it. Because
triggers and events are data, a scenario is a pure function of its event tape:
replaying the walkthrough prefix up to a beat through the headless solver
reconstructs the **exact** state of having played there. `seekTo('finale')` is
therefore a solver call, not a playthrough.

**Declare the walkthrough** on the scenario (or the puzzle graph, which passes
it through). Name the beats you want to jump to:

```ts
const scenario = {
  id: 'county-2007',
  triggers: [
    /* … */
  ],
  rehearsal: {
    walkthrough: [
      { event: { type: 'session:boot-complete' }, beat: 'intro' },
      {
        event: { type: 'file:open', path: ['日记.txt'], name: '日记.txt', nodeType: 'file' },
        beat: 'diary',
      },
      { event: { type: 'file:unlock', name: 'WINDOWS' }, beat: 'finale' },
    ],
  },
};
```

**Drive it** through the imperative handle (`ref.current.scenario.*`) or the
DevTools **Rehearsal** tab (a seek-bar consumer):

```ts
ref.current.scenario.seekTo('finale'); // jump to the finale's exact state
ref.current.scenario.stepBack(); // 回到上一拍 — re-solve the shorter prefix
ref.current.scenario.exitRehearsal(); // restore the pre-rehearsal live save
ref.current.scenario.getState(); // { active, index, length, beats }
```

**How it stays honest.** Seeking runs the solver, installs the resulting
`flags` / `journal` / per-trigger fire budgets into the runtime, and replays only
the **filesystem-shaped** grants (`unlock` / `addFile` / `writeFile` /
`removeFile`) onto the live desktop. Observation actions (`notify` / `qqMessage`
/ `playSound` / …) are recorded but **never performed**, and every replayed
journal entry is stamped `rehearsal: true` — the `onEvent` host bridge drops
those, so fast-forwarding fires no external side effects and pollutes no host
analytics (the observer-effect guard). The engine's own `happened` / `count`
predicates still see them, so gating stays correct. Stepping backward restores
the baseline filesystem in memory (no reload) and re-applies the shorter prefix.

**Fidelity limits** (same as the solver): delayed `after` actions collapse to
"eventually" (headless has no clock), and non-filesystem world state (QQ windows,
open apps) is not reconstructed — enough to test story state and endings, not a
pixel-exact replay.

## Scenario-layer apps

Some mechanics need a _surface_ the player manipulates. These are ordinary
registered apps, but they carry no game semantics: the engine stays ignorant
(axiom 2). The app only **emits events**; scenarios gate on **journal-derived
predicates**. Content (the pool of clues, the roster to accuse) is passed in via
props, never hard-coded, so one app serves any story.

### Evidence Board (`EvidenceBoard`, mechanic M4)

The Roottrees / Shadows-of-Doubt corkboard. Pin evidence to the board, string
two pinned items together, or unpin. It emits `evidence:pin` / `evidence:link` /
`evidence:unpin`; scenarios gate on `pinned(id)` / `linked(a, b)`. Because both
predicates read the journal, the runtime holds no board state — a save/load round
trip reconstructs the board from replayed events.

```ts
import { defineScenario, linked, demoEvidence } from '@caoergou/windows-xp';

ref.openApp('EvidenceBoard', demoEvidence); // props.items = the clue pool

const s = defineScenario('board');
s.on('evidence:link').when(linked('diary', 'chatlog')).do(setFlag('connected'));
```

`pinned` counts net pins (`evidence:pin` minus `evidence:unpin`); `linked`
requires a link event **and** both endpoints still pinned, and is
order-insensitive. Unpinning either end silently invalidates the link.

### Deduction Sheet (`DeductionSheet`, mechanic M3)

The Golden Idol verifier — a form of labelled slots the player fills from a word
bank, submitted for batched verification. Emits `deduction:submit` and
`deduction:verified` / `deduction:failed`. Scenarios react to the verified event;
the app owns the correctness check against its scenario-provided answer key.

### In-world search (inside Internet Explorer, mechanic #134)

A search engine in the XP era is a _web page_, not a desktop app — so the
in-world search lives **inside Internet Explorer** at `baidu.com`, not in a
window of its own. The scenario hands IE a `searchCorpus` (an authored slice of
the in-world web); the player's query rides in the URL (`/s?wd=…`) so a search is
an ordinary IE navigation that Back/Forward replay. Each results page emits
`search:query { query, hit, resultIds }`; scenarios gate on `searched(term)` /
`found(resultId)`. Clicking a result navigates IE to that page's `url` and
renders its authored `html` — the player reads straight into a clue.

```ts
import { defineScenario, searched, found, demoSearchCorpus } from '@caoergou/windows-xp';

// Open the browser at the search engine, seeded with the story's web.
ref.openApp('InternetExplorer', { url: 'http://www.baidu.com', searchCorpus: demoSearchCorpus });

const s = defineScenario('web');
s.on('search:query').when(searched('水晶女孩')).do(setFlag('lead'));
s.on('search:query').when(found('cafe-news')).do(
  openFile([
    /* … */
  ])
);
```

Each `SearchResultPage` lists the query terms that surface it; a query _hits_
when it contains any of a result's `match` terms (case-insensitive substring), so
authors reward the **idea** of a search, not an exact string. `searched(term)`
holds when some past query contained `term`; `found(id)` holds when some query
surfaced that result. A missed search still emits (`hit: false`, empty
`resultIds`). With no `searchCorpus`, `baidu.com` still renders — every query
simply misses — so the engine is never a dead page.

## Debugging: the Scenario DevTools (#209)

Pass `devtools` to `<WindowsXP/>` to mount an in-desktop panel that shows what
`onEvent`/console can't — engine-internal state:

- **Triggers** — per registered trigger, for the most recent event: `fired`,
  `no match`, or a skip reason. When a trigger matched but its `when` was false,
  the condition tree is annotated ✓/✗ down to the **exact false leaf** (e.g.
  `✗ flag door_open (undefined) is truthy`). The runtime only ever returns a
  single boolean, so this "why didn't it fire" breakdown is otherwise invisible.
- **Flags** — every current flag, its value, and which event → which trigger
  last changed it.

It reads the trace the runtime publishes (`subscribeTrace(prefix, …)`); a
production build that never sets `devtools` tree-shakes it out. The pure
`traceCondition(condition, ctx)` behind it is exported for custom tooling.

## Common validation errors (#208)

Scenario JSON has no compile-time safety (TS only guards code, not a hand-written
`.json`), so the runtime validates it up front. `validateScenario(scenario)`
returns `{ ok, errors, warnings }`; the `ScenarioRunner` runs it on mount and
**refuses to run a scenario with errors** (a half-applied bad script is worse
than an inert one), logging them to the console. `assertValidScenario` throws.
Every message is prefixed with the offending path.

**Errors** (won't run):

| Message contains                                           | Cause                                        |
| ---------------------------------------------------------- | -------------------------------------------- |
| `triggers[0].on: expected an event type…`                  | `on` missing or not a string/string[]        |
| `triggers[0].do[1]: unknown action — expected one of …`    | typo'd action key (`setFlags` for `setFlag`) |
| `triggers[0].do[0].setFlag: expected a flag name (string)` | wrong param shape                            |
| `triggers[0].when: unknown condition — expected one of …`  | typo'd condition key                         |
| `triggers[0].do[0].after.do[0]: …`                         | the same checks recurse into delayed actions |
| `scenario is too large (… KB > 2048 KB limit)`             | over the 2 MB ceiling                        |

**Warnings** (still runs, but probably a mistake):

| Message contains                                              | Cause                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| `"bogus:thing" has an unknown event domain — will never fire` | `on` references a domain the engine never emits                |
| `flag "ghost" is read in a condition but never set …`         | a `when` gates on a flag no action or `initialFlags` ever sets |

### Snapshots

`assertLoadableSnapshot(value)` deep-validates a shared save before applying it —
`XPSnapshotVersionError` for a missing/too-new `version`, `XPSnapshotError` for a
malformed structure, each naming the path (e.g.
`fs.root.children["C盘"].type: expected one of 'root'|'folder'|…, got undefined`).
It also rejects a snapshot over 5 MB. Validation runs **before** any storage
write, so a rejected snapshot leaves the desktop untouched.
