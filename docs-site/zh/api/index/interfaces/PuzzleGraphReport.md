[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / PuzzleGraphReport

# Interface: PuzzleGraphReport

Defined in: src/scenario/puzzleGraph.ts:205

## Properties

### bushiness

&gt; **bushiness**: `number`[]

Defined in: src/scenario/puzzleGraph.ts:208

Count of puzzles at each dependency depth (0 = roots). Pacing/"bushiness".

---

### issues

&gt; **issues**: [`GraphLintIssue`](/windows-xp/docs/zh/api/index/interfaces/GraphLintIssue.md)[]

Defined in: src/scenario/puzzleGraph.ts:206

---

### maxParallel

&gt; **maxParallel**: `number`

Defined in: src/scenario/puzzleGraph.ts:210

The widest level — the most puzzles a player can juggle at once.

---

### ok

&gt; **ok**: `boolean`

Defined in: src/scenario/puzzleGraph.ts:212

True when there are no error-level issues.
