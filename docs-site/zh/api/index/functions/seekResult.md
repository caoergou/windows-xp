[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / seekResult

# Function: seekResult()

&gt; **seekResult**(`scenario`, `tape`, `index`, `fs?`): [`SeekResult`](/windows-xp/docs/zh/api/index/interfaces/SeekResult.md)

Defined in: src/scenario/rehearsal.ts:65

Solve the scenario over the tape prefix ending at (and including) `index`.
`index < 0` yields the pristine initial state (no events processed). Every
journal entry is stamped `rehearsal: true` for provenance. `fs` seeds the
solver's filesystem model for FS-predicate gates.

## Parameters

### scenario

[`Scenario`](/windows-xp/docs/zh/api/index/interfaces/Scenario.md)

### tape

[`RehearsalTape`](/windows-xp/docs/zh/api/index/interfaces/RehearsalTape.md)

### index

`number`

### fs?

[`SolveFsNode`](/windows-xp/docs/zh/api/index/interfaces/SolveFsNode.md)[]

## Returns

[`SeekResult`](/windows-xp/docs/zh/api/index/interfaces/SeekResult.md)
