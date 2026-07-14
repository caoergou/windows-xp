[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / SolveOptions

# Interface: SolveOptions

Defined in: src/scenario/solver.ts:27

## Properties

### fs?

&gt; `optional` **fs?**: [`SolveFsNode`](/windows-xp/docs/zh/api/index/interfaces/SolveFsNode.md)[]

Defined in: src/scenario/solver.ts:29

Initial virtual filesystem for `exists`/`unlocked`/`contentContains` + FS actions.

---

### maxEvents?

&gt; `optional` **maxEvents?**: `number`

Defined in: src/scenario/solver.ts:31

Cap on total processed events (guards against `emit` cycles). Default 10000.
