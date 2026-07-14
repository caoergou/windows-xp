[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / PuzzleGraph

# Interface: PuzzleGraph

Defined in: src/scenario/puzzleGraph.ts:107

A complete puzzle dependency graph.

## Properties

### id

&gt; **id**: `string`

Defined in: src/scenario/puzzleGraph.ts:109

Scenario id of the compiled output.

---

### initialFlags?

&gt; `optional` **initialFlags?**: `Record`\&lt;`string`, [`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md)\&gt;

Defined in: src/scenario/puzzleGraph.ts:110

---

### puzzles

&gt; **puzzles**: [`PuzzleNode`](/windows-xp/docs/zh/api/index/interfaces/PuzzleNode.md)[]

Defined in: src/scenario/puzzleGraph.ts:111

---

### rehearsal?

&gt; `optional` **rehearsal?**: [`RehearsalPlan`](/windows-xp/docs/zh/api/index/interfaces/RehearsalPlan.md)

Defined in: src/scenario/puzzleGraph.ts:115

Canonical walkthrough for rehearsal/seek + solver CI (#207), passed through.

---

### strings?

&gt; `optional` **strings?**: `Partial`\&lt;`Record`\&lt;`string`, `Record`\&lt;`string`, `string`\&gt;\&gt;\&gt;

Defined in: src/scenario/puzzleGraph.ts:113

Per-locale beat-text tables (#207), passed through to the compiled scenario.
