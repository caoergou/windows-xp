[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / LessonStep

# Interface: LessonStep

Defined in: src/lesson/types.ts:44

A single teachable step.

## Properties

### anchor?

&gt; `optional` **anchor?**: `string`

Defined in: src/lesson/types.ts:48

Semantic UI anchor id to spotlight (e.g. `start-button`, `notepad.menu.file`).

---

### demonstrate?

&gt; `optional` **demonstrate?**: [`WatchAction`](/windows-xp/docs/zh/api/index/type-aliases/WatchAction.md)

Defined in: src/lesson/types.ts:59

Watch-mode demonstration: how to auto-perform this step (#141 Phase 2).

---

### expect

&gt; **expect**: [`ExpectPattern`](/windows-xp/docs/zh/api/index/interfaces/ExpectPattern.md)

Defined in: src/lesson/types.ts:50

The verified action that advances the step.

---

### hints?

&gt; `optional` **hints?**: [`LessonHint`](/windows-xp/docs/zh/api/index/interfaces/LessonHint.md)[]

Defined in: src/lesson/types.ts:52

Escalating hints (Try mode only).

---

### instruction

&gt; **instruction**: `string`

Defined in: src/lesson/types.ts:46

Instruction text — an i18n key (resolved if present) or a literal string.

---

### onWrongAction?

&gt; `optional` **onWrongAction?**: [`WrongActionPolicy`](/windows-xp/docs/zh/api/index/type-aliases/WrongActionPolicy.md)

Defined in: src/lesson/types.ts:57

Reaction to a wrong action (an event of the expected type whose payload
doesn't match). Phase 1 implements `nudge`; `shield`/`undo` are planned.
