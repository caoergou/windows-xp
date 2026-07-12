---
title: Guided lessons
---

# 引导课程 / Guided lessons (#141)

A **lesson** is a linear scenario with a pedagogy layer: the [event
stream](#events) is the action-verifier, so a step advances only when the
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

Progress persists per instance (`lesson_progress`) and resumes after a refresh;
the `lesson:*` events flow through `onEvent` (map them to xAPI for an LMS). Full
schema, modes, anchors, and a worked example — [`docs/LESSONS.md`](./docs/LESSONS.md).

