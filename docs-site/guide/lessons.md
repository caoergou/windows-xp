---
title: Guided lessons
---

# Guided lessons

A **lesson** is a linear scenario with a pedagogy layer: the [event
stream](/guide/events) is the action-verifier, so a step advances only when the
learner performs a real, event-verified action (open Notepad, save a file) —
there is no click-`Next` button. Register lessons via the `lessons` prop, then
start one through the `ref` handle in `try` (hinted), `do` (scored), or `watch`
(planned) mode:

```jsx
import { useRef } from 'react';
import { WindowsXP, defineLesson, notepadBasicsLesson } from '@caoergou/windows-xp';

const myLesson = defineLesson({
  id: 'open-start-menu',
  title: 'Open the Start menu',
  steps: [{ instruction: 'Click Start', anchor: 'start-button', expect: { on: 'startmenu:open' } }],
});

function App() {
  const xp = useRef(null);
  return (
    <>
      <WindowsXP ref={xp} lessons={[myLesson, notepadBasicsLesson]} autoLogin />
      <button onClick={() => xp.current.startLesson('open-start-menu', 'try')}>Start</button>
    </>
  );
}
```

## Modes

Lessons can run in three modes:

- `try` — guided practice. Hints are available; the step advances once the correct
  event fires, and wrong actions only trigger feedback rather than failing the lesson.
- `do` — scored assessment. The learner must complete each step correctly; final
  score and completion are emitted as `lesson:*` events.
- `watch` — demonstration. The engine plays the steps automatically so the learner
  can observe before attempting them.

Progress persists per instance (`lesson_progress`) and resumes after a refresh;
the `lesson:*` events flow through `onEvent` (map them to xAPI for an LMS). Full
schema, modes, anchors, and a worked example — [`docs/LESSONS.md`](https://github.com/caoergou/windows-xp/blob/main/docs/LESSONS.md).

