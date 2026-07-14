[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / SolveResult

# Interface: SolveResult

Defined in: src/scenario/solver.ts:34

## Extended by

- [`SeekResult`](/windows-xp/docs/zh/api/index/interfaces/SeekResult.md)

## Properties

### actions

&gt; **actions**: [`Action`](/windows-xp/docs/zh/api/index/type-aliases/Action.md)[]

Defined in: src/scenario/solver.ts:42

Non-flag side-effecting actions, in order (each `notify`/`unlock`/`emit`/…).

---

### fired

&gt; **fired**: `Record`\&lt;`string`, `number`\&gt;

Defined in: src/scenario/solver.ts:40

Per-trigger fire counts, keyed by trigger id or index.

---

### flags

&gt; **flags**: `Record`\&lt;`string`, [`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md)\&gt;

Defined in: src/scenario/solver.ts:36

Final flag values.

---

### journal

&gt; **journal**: [`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md)[]

Defined in: src/scenario/solver.ts:38

The (bounded) event journal, matching the runtime.
