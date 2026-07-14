[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / LintIssue

# Interface: LintIssue

Defined in: src/lesson/lint.ts:12

## Properties

### level

&gt; **level**: `"warn"` \| `"error"`

Defined in: src/lesson/lint.ts:16

Severity: `error` breaks the contract; `warn` is a smell.

---

### message

&gt; **message**: `string`

Defined in: src/lesson/lint.ts:17

---

### step

&gt; **step**: `number`

Defined in: src/lesson/lint.ts:14

Step index the issue is about, or -1 for lesson-level issues.
