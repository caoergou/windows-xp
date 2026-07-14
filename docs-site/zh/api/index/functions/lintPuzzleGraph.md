[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / lintPuzzleGraph

# Function: lintPuzzleGraph()

&gt; **lintPuzzleGraph**(`graph`): [`PuzzleGraphReport`](/windows-xp/docs/zh/api/index/interfaces/PuzzleGraphReport.md)

Defined in: src/scenario/puzzleGraph.ts:220

Statically analyse a puzzle graph. Errors (missing requires, cycles,
unreachable, no trigger event) mean the graph can't run correctly; warnings
(no hint ladder, gate bypass) are design smells. Also computes bushiness.

## Parameters

### graph

[`PuzzleGraph`](/windows-xp/docs/zh/api/index/interfaces/PuzzleGraph.md)

## Returns

[`PuzzleGraphReport`](/windows-xp/docs/zh/api/index/interfaces/PuzzleGraphReport.md)
