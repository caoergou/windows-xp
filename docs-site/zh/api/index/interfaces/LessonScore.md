[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / LessonScore

# Interface: LessonScore

Defined in: src/lesson/types.ts:76

Score reported on completion (Do mode).

## Properties

### hintsUsed

&gt; **hintsUsed**: `number`

Defined in: src/lesson/types.ts:82

Hints shown across the lesson.

---

### score

&gt; **score**: `number`

Defined in: src/lesson/types.ts:78

0–100, penalized by wrong actions and hints used.

---

### timeMs

&gt; **timeMs**: `number`

Defined in: src/lesson/types.ts:84

Wall-clock time on the lesson, ms.

---

### wrongActions

&gt; **wrongActions**: `number`

Defined in: src/lesson/types.ts:80

Wrong actions taken across the lesson.
