[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / ladderKeys

# Function: ladderKeys()

&gt; **ladderKeys**(`opts`, ...`textKeys`): [`PuzzleHint`](/windows-xp/docs/zh/api/index/interfaces/PuzzleHint.md)[]

Defined in: src/scenario/puzzleGraph.ts:74

Like [ladder](/windows-xp/docs/zh/api/index/functions/ladder.md), but each rung references a string-table key (#207)
instead of an inline literal, so the hint ladder localizes with the rest of
the beat text. `titleKey` names the shared balloon title key.

## Parameters

### opts

`LadderCadence` & `object`

### textKeys

...`string`[]

## Returns

[`PuzzleHint`](/windows-xp/docs/zh/api/index/interfaces/PuzzleHint.md)[]
