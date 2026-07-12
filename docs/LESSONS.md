# Guided lesson system — author guide (#141)

A **lesson** is a [scenario](./SCENARIOS.md) with a pedagogy layer. It is a
linear sequence of steps, and the thing that makes a step advance is the
[event stream](./EVENTS.md): the bus is the **action-verifier**. A step only
completes when the learner performs a real, event-verified action — launched
Notepad, saved a file, clicked the clock. This is the opposite of the
click-the-`Next`-button tour libraries: there is no `Next`. If the learner
doesn't *do* the thing, the lesson doesn't move.

- **Source of truth:** the `Lesson` schema in
  [`src/lesson/types.ts`](../src/lesson/types.ts).
- **Matcher:** the pure `expectMatches` / `isWrongAction` / `computeScore`
  functions in [`src/lesson/engine.ts`](../src/lesson/engine.ts) — no React, no
  side effects.
- **Runtime:** `LessonProvider` ([`src/context/LessonContext.tsx`](../src/context/LessonContext.tsx))
  subscribes to the bus, advances the current step, runs the hint ladder, scores
  the run, emits the `lesson:*` events, and persists progress.
- **Event vocabulary:** the same catalog every scenario reads
  ([`src/events.ts`](../src/events.ts)) — a step's `expect.on` names an event
  type from it.

## Authoring & wiring

Register lessons via the `lessons` prop, then start one imperatively through the
`ref` handle:

```jsx
import { useRef } from 'react';
import { WindowsXP, notepadBasicsLesson } from '@caoergou/windows-xp';

function App() {
  const xp = useRef(null);
  return (
    <>
      <WindowsXP ref={xp} lessons={[notepadBasicsLesson]} autoLogin />
      <button onClick={() => xp.current.startLesson('lesson.notepad-basics', 'try')}>
        Start tutorial
      </button>
      <button onClick={() => xp.current.stopLesson()}>Stop</button>
    </>
  );
}
```

- `startLesson(lessonId, mode?)` — starts the lesson registered under that id.
  Returns `false` if no such id was passed to `lessons`. `mode` defaults to
  `'try'`.
- `stopLesson()` — aborts the running lesson and clears its saved progress.

Lessons are plain data (JSON-serializable), so they can equally live in a
`.json` file, ship inside a culture package, or be authored in TypeScript with
`defineLesson` for autocomplete.

## Schema reference

### `Lesson`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `string` | Stable id. Namespaces persisted progress and is the argument to `startLesson`. |
| `title` | `string` | Lesson title — an i18n key (resolved if present) or a literal. |
| `steps` | `LessonStep[]` | Ordered steps; the learner advances through them one at a time. |

### `LessonStep`

| Field | Type | Meaning |
| --- | --- | --- |
| `instruction` | `string` | What to tell the learner — an i18n key or literal, shown in the balloon. |
| `anchor` | `string?` | Semantic UI anchor id to spotlight (see [Anchors](#anchors)). Omit for an unanchored step. |
| `expect` | `ExpectPattern` | The verified action that advances the step. |
| `hints` | `LessonHint[]?` | Escalating hints (Try mode only). |
| `onWrongAction` | `'nudge' \| 'shield' \| 'undo'?` | Reaction to a wrong action — `nudge` (shake), `shield` (absorb off-target clicks), or `undo` (close a wrongly-opened window). |
| `demonstrate` | `WatchAction?` | How Watch mode auto-plays the step: `{ openApp, props? }` or `{ emit: XPEvent }`. Omit and Watch can't auto-play the step. |

### `ExpectPattern`

The event that completes a step. `on` is the event type(s); **every other field
is matched against the triggering event's payload** (arrays deep-equal, exactly
like a scenario's `event` condition).

| Field | Type | Meaning |
| --- | --- | --- |
| `on` | `XPEventType \| XPEventType[]` | Event type(s) that can complete this step. |
| *(any other key)* | `Scalar \| Scalar[]` | Must equal the event payload's field of the same name. |

```json
{ "on": "app:launch", "appId": "Notepad" }
```

completes when an `app:launch` event arrives with `appId === 'Notepad'`. An
`app:launch` for any *other* app is a **wrong action** (right type, wrong
payload); an event of an unrelated type is just noise the learner is free to
make.

### `LessonHint`

| Field | Type | Meaning |
| --- | --- | --- |
| `afterMs` | `number` | Milliseconds of inactivity on the step before this hint appears. |
| `text` | `string` | Hint text — an i18n key (resolved if present) or a literal. |

### `defineLesson(lesson)`

Thin typed identity helper (`defineLesson(x) === x` at runtime). Use it when
authoring in TypeScript for autocomplete and compile-time checking without a
second representation.

> These are the only fields the schema defines. Do not invent others — an
> unknown key is authoring drift, not a feature.

## Modes: Watch-Try-Do

The same lesson runs in three modes, selected by the second argument to
`startLesson`:

| Mode | Advancement | Hints | Scored | Status |
| --- | --- | --- | --- | --- |
| `'try'` | Event-gated | Yes — the hint ladder | No | **Ships (Phase 1)** |
| `'do'` | Event-gated | No | Yes | **Ships (Phase 1)** |
| `'watch'` | Auto-demonstrated | — | — | **Ships (Phase 2)** |

- **Try** — the coaching mode. Steps are gated on real actions; the hint ladder
  arms on each step and escalates on inactivity (`afterMs`). Wrong actions
  nudge, but nothing is graded.
- **Do** — the assessment mode. Same gating, but no hints are shown, and the run
  is scored:

  ```
  score = max(0, 100 − 10 × wrongActions − 5 × hintsUsed)
  ```

  In Do mode `hintsUsed` is 0 (no hints fire), so the score reflects wrong
  actions only. The final `score` is reported in the `lesson:complete` event and
  in the completion payload the overlay reads. (Time on task is measured and
  reported, but not currently penalized.)
- **Watch** — the demonstration mode. Each step auto-plays: an XP-style **ghost
  cursor** glides to the step's anchor, a click pulse fires, and the step's
  `demonstrate` action is performed through the imperative handle. The resulting
  event advances the step through the *same* gate as Try/Do — Watch is a driver
  over one runtime, not a second engine. The docked panel gains a **Pause /
  Resume** control. A step with no `demonstrate` cannot auto-play (the linter
  warns); author one per step for a complete Watch.

  ```jsonc
  {
    "instruction": "lesson.step1",
    "anchor": "start-button",
    "expect": { "on": "app:launch", "appId": "Notepad" },
    "demonstrate": { "openApp": "Notepad" }   // Watch performs this
  }
  ```

  `demonstrate` is one of `{ openApp, props? }` or `{ emit: XPEvent }` (the
  escape hatch for steps a single handle call can't perform — e.g. "save",
  demonstrated by emitting the `file:create` the save would produce, or "open a
  file", by emitting `file:open`).

## Anchors

An **anchor** is a semantic handle onto a live UI element: a
`data-xp-anchor="<id>"` attribute on any element. A step names one in its
`anchor` field, and the overlay spotlights it and points the instruction balloon
at it.

Built-in anchors today:

| Anchor id | Element |
| --- | --- |
| `start-button` | The Start button |
| `notepad.menu.file` | Notepad's File menu |
| `notepad.textarea` | Notepad's editing area |
| `taskbar.clock` | The taskbar clock |

**Any custom app becomes lesson-able just by adding `data-xp-anchor` attributes**
— no engine change, no registration step. The anchor id is an opaque string; use
a `app.region` convention as the built-ins do.

Behaviour worth knowing when authoring:

- The spotlight **resolves the anchor to a live rect each frame**, so it tracks
  the element as its window is dragged or resized.
- The instruction balloon is positioned with `@floating-ui/react`, so it
  auto-flips and shifts to stay on-screen.
- Anchors **inside the taskbar** (e.g. `start-button`, `taskbar.clock`) stay lit
  *above* the dim overlay, so the learner can actually reach them.

## Events & progress

The runtime emits the `lesson:*` family on the bus; every one is visible via the
`onEvent` prop and `useXPEvents()`.

| Event | Fires when |
| --- | --- |
| `lesson:start` | A lesson starts (`{ lessonId }`). |
| `lesson:step-complete` | A step's expected action was verified (`{ lessonId, stepId }`). |
| `lesson:hint-shown` | A hint rung was revealed (`{ lessonId, stepId, hintId? }`). |
| `lesson:step-failed` | A wrong action was taken on a step (`{ lessonId, stepId }`). |
| `lesson:complete` | The lesson finished (`{ lessonId, score? }`). |

Progress persists per instance under the `lesson_progress` storage key
(namespaced by the instance's `storagePrefix`): current step, wrong-action
count, hints used, mode, and start time. A page refresh mid-lesson **resumes**
where the learner left off. `stopLesson()` clears it.

## Wrong-action policy

A **wrong action** is an event of the step's expected *type* whose payload does
**not** match — for example, launching the wrong app while the step expects
`{ on: 'app:launch', appId: 'Notepad' }`. It increments the wrong-action count,
emits `lesson:step-failed`, and triggers the step's policy. Events of unrelated
types are never wrong; the learner is free to poke around.

- **`nudge`** (default) — a visual shake of the spotlight ring.
- **`shield`** — off-target clicks are absorbed by the dim shades (they capture
  the click and shake) instead of reaching the UI, so the learner can only click
  the lit target. Because the click never becomes an event, it can't even count
  as a wrong action.
- **`undo`** — best-effort revert of the mistake. Today it closes a window the
  wrong action opened (the "oops, wrong app" case); other reverts fall back to
  the nudge.

## Mapping `lesson:*` to xAPI for an LMS

The engine ships **no SCORM or xAPI runtime** — it stays fiction-agnostic. A host
that needs LMS reporting forwards the `onEvent` stream and maps the `lesson:*`
events to xAPI statements itself. A minimal mapping:

| `lesson:*` event | xAPI verb | object | result |
| --- | --- | --- | --- |
| `lesson:start` | `initialized` | `<lessonId>` | — |
| `lesson:step-complete` | `progressed` | `<lessonId>#<stepId>` | — |
| `lesson:step-failed` | `failed` | `<lessonId>#<stepId>` | — |
| `lesson:complete` | `completed` | `<lessonId>` | `score.scaled = score / 100` |

```jsx
<WindowsXP
  lessons={[notepadBasicsLesson]}
  onEvent={(e) => {
    if (e.type === 'lesson:complete') {
      lrs.sendStatement({
        actor: { mbox: `mailto:${learnerEmail}` },
        verb: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'en-US': 'completed' } },
        object: { id: `https://example.edu/lessons/${e.lessonId}` },
        result: { score: { scaled: (e.score ?? 0) / 100 }, completion: true },
      });
    }
  }}
/>;
```

The `actor` comes from your host, not the engine — the engine has no notion of
who the learner is.

## Worked example: "Notepad basics"

The reference lesson — two steps, open Notepad then save a note — expressed as
pure data. It matches [`src/data/lessons/notepadBasics.ts`](../src/data/lessons/notepadBasics.ts)
and is exported from the package as `notepadBasicsLesson`.

```json
{
  "id": "lesson.notepad-basics",
  "title": "lesson.notepad.title",
  "steps": [
    {
      "instruction": "lesson.notepad.step1",
      "anchor": "start-button",
      "expect": { "on": "app:launch", "appId": "Notepad" },
      "hints": [
        { "afterMs": 12000, "text": "lesson.notepad.hint1a" },
        { "afterMs": 30000, "text": "lesson.notepad.hint1b" }
      ],
      "onWrongAction": "nudge"
    },
    {
      "instruction": "lesson.notepad.step2",
      "anchor": "notepad.textarea",
      "expect": { "on": "file:create", "nodeType": "file" },
      "hints": [{ "afterMs": 15000, "text": "lesson.notepad.hint2" }]
    }
  ]
}
```

What it demonstrates: step 1 spotlights `start-button` and advances only on
`app:launch { appId: 'Notepad' }` — launching any other app is a wrong action
that nudges; if the learner stalls, `hint1a` appears at 12s and `hint1b` at 30s.
Step 2 spotlights the Notepad text area and advances on `file:create` with
`nodeType: 'file'` (the Save-As of a new note). All instruction/hint strings are
i18n keys in the `lesson.*` namespace, resolved if present and shown literally
otherwise.

To author in TypeScript instead of JSON, wrap the same object in `defineLesson`:

```ts
import { defineLesson } from '@caoergou/windows-xp';

export const notepadBasicsLesson = defineLesson({
  id: 'lesson.notepad-basics',
  title: 'lesson.notepad.title',
  steps: [/* … */],
});
```

## Scope

**Shipped (Phase 1–3):** Try / Do / **Watch** modes; the event-gated matcher;
the hint ladder; all three wrong-action policies (`nudge` / `shield` / `undo`);
anchors + spotlight + instruction balloon (positioned with @floating-ui/react);
the **ghost cursor** with Pause/Resume; the `lesson:*` events; per-instance
resumable progress + Do-mode scoring; the `defineLesson` builder; the
**lesson-pack linter** (`lintLesson`, run in dev against every registered
lesson); and the **Help & Support Center catalog** — a diegetic lesson browser
that lists registered lessons and starts one on click.

**Deferred:**

- **Beacon hotspot** — a pulsing beacon on the anchored target for self-serve tips.
- **e2e** — a Playwright run across all three modes (incl. shield blocking
  off-target clicks); the runtime is covered by jsdom integration tests today.
