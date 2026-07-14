[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / LessonHint

# Interface: LessonHint

Defined in: src/lesson/types.ts:26

One rung of a step's hint ladder: shown once `afterMs` of inactivity elapse.

## Properties

### afterMs

&gt; **afterMs**: `number`

Defined in: src/lesson/types.ts:28

Milliseconds on the step before this hint appears.

---

### text

&gt; **text**: `string`

Defined in: src/lesson/types.ts:30

Hint text — an i18n key (resolved if present) or a literal string.
