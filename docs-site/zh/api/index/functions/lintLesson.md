[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / lintLesson

# Function: lintLesson()

&gt; **lintLesson**(`lesson`, `hasI18nKey?`): [`LintIssue`](/windows-xp/docs/zh/api/index/interfaces/LintIssue.md)[]

Defined in: src/lesson/lint.ts:25

Lint one lesson. `errors` block a usable lesson (no anchor / no expect / no
hint); `warn`s flag likely-unintended authoring. Optionally pass `hasI18nKey`
(e.g. `i18n.exists`) to check that instruction/hint/title keys resolve.

## Parameters

### lesson

[`Lesson`](/windows-xp/docs/zh/api/index/interfaces/Lesson.md)

### hasI18nKey?

(`key`) =&gt; `boolean`

## Returns

[`LintIssue`](/windows-xp/docs/zh/api/index/interfaces/LintIssue.md)[]
