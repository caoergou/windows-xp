---
title: Guided lessons
---

# Guided lessons

Use lessons to teach a user how to use the desktop step by step. A lesson is a
linear scenario: each step waits for a real event (open Notepad, click Start)
rather than a "Next" button, so progress is verified by what the learner
actually does.

## Hello world lesson

```jsx
import { useRef } from 'react';
import { WindowsXP, defineLesson } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';
import type { XPHandle } from '@caoergou/windows-xp';

const myLesson = defineLesson({
  id: 'open-start-menu',
  title: 'Open the Start menu',
  steps: [
    {
      instruction: 'Click the Start button',
      anchor: 'start-button',
      expect: { on: 'startmenu:open' },
    },
  ],
});

export default function App() {
  const xp = useRef<XPHandle>(null);
  return (
    <>
      <WindowsXP ref={xp} lessons={[myLesson]} autoLogin />
      <button onClick={() => xp.current?.startLesson('open-start-menu', 'try')}>
        Start lesson
      </button>
    </>
  );
}
```

A step has three parts:

- `instruction` — the text shown to the learner.
- `anchor` — the UI element to highlight (see [Anchors](#anchors) below).
- `expect` — the event that proves the step is done.

## Modes

Lessons can run in three modes:

- `try` — guided practice. Hints are available; the step advances once the correct
  event fires, and wrong actions only trigger feedback rather than failing the lesson.
- `do` — scored assessment. The learner must complete each step correctly; final
  score and completion are emitted as `lesson:*` events.
- `watch` — demonstration. The engine plays the steps automatically so the learner
  can observe before attempting them.

## Anchors

Anchors tell the lesson engine which UI element to highlight. Common anchors:

| Anchor         | Element                         |
| -------------- | ------------------------------- |
| `start-button` | The Start button on the taskbar |
| `desktop`      | The desktop background          |
| `taskbar`      | The taskbar                     |

If you build a custom app, you can expose your own anchors by adding a
`data-xp-anchor` attribute to elements in your component.

## Built-in example lesson

The package exports a small example lesson you can drop in to see how lessons
feel:

```jsx
import { notepadBasicsLesson } from '@caoergou/windows-xp';

<WindowsXP lessons={[notepadBasicsLesson]} autoLogin />;
```

## Events and persistence

Progress persists per instance (`lesson_progress`) and resumes after a refresh;
the `lesson:*` events flow through `onEvent` (map them to xAPI for an LMS).
