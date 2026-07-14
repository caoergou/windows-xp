[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / solveScenario

# Function: solveScenario()

&gt; **solveScenario**(`scenario`, `events`, `opts?`): [`SolveResult`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md)

Defined in: src/scenario/solver.ts:58

Run a scenario headlessly over an event sequence and return the final state.
`emit` actions feed back into the trigger loop (cascades), capped by
`maxEvents`.

## Parameters

### scenario

[`Scenario`](/windows-xp/docs/zh/api/index/interfaces/Scenario.md)

### events

[`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md)[]

### opts?

[`SolveOptions`](/windows-xp/docs/zh/api/index/interfaces/SolveOptions.md) = `{}`

## Returns

[`SolveResult`](/windows-xp/docs/zh/api/index/interfaces/SolveResult.md)
