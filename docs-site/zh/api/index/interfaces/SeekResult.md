[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / SeekResult

# Interface: SeekResult

Defined in: src/scenario/rehearsal.ts:54

The deterministic state of a seek, tagged with the tape index it lands on.

## Extends

- [`SolveResult`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md)

## Properties

### actions

&gt; **actions**: [`Action`](/windows-xp/docs/zh/api/index/type-aliases/Action.md)[]

Defined in: src/scenario/solver.ts:42

Non-flag side-effecting actions, in order (each `notify`/`unlock`/`emit`/…).

#### Inherited from

[`SolveResult`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md).[`actions`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md#actions)

---

### fired

&gt; **fired**: `Record`\&lt;`string`, `number`\&gt;

Defined in: src/scenario/solver.ts:40

Per-trigger fire counts, keyed by trigger id or index.

#### Inherited from

[`SolveResult`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md).[`fired`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md#fired)

---

### flags

&gt; **flags**: `Record`\&lt;`string`, [`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md)\&gt;

Defined in: src/scenario/solver.ts:36

Final flag values.

#### Inherited from

[`SolveResult`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md).[`flags`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md#flags)

---

### index

&gt; **index**: `number`

Defined in: src/scenario/rehearsal.ts:56

The tape index this state corresponds to (−1 = before any step).

---

### journal

&gt; **journal**: [`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md)[]

Defined in: src/scenario/solver.ts:38

The (bounded) event journal, matching the runtime.

#### Inherited from

[`SolveResult`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md).[`journal`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md#journal)
