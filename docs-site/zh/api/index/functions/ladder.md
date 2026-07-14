[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / ladder

# Function: ladder()

&gt; **ladder**(`opts`, ...`texts`): [`PuzzleHint`](/windows-xp/docs/zh/api/index/interfaces/PuzzleHint.md)[]

Defined in: src/scenario/puzzleGraph.ts:59

Build an escalating hint ladder (M12): each text becomes a rung, and `fails` /
`idles` set the base cadence so rung _i_ unlocks at `base * (i + 1)` — e.g.
`ladder({ fails: 2 }, a, b)` shows `a` after 2 fails, `b` after 4. Give both
`fails` and `idles` to reveal on either channel. Compiles (via
[compilePuzzleGraph](/windows-xp/docs/zh/api/index/functions/compilePuzzleGraph.md)) to `password:fail` / `user:idle` count triggers.

Inline text is for prototyping; prefer [ladderKeys](/windows-xp/docs/zh/api/index/functions/ladderKeys.md) once a string table
exists so the hints localize with the rest of the beat text (#207).

## Parameters

### opts

`LadderCadence` & `object`

### texts

...`string`[]

## Returns

[`PuzzleHint`](/windows-xp/docs/zh/api/index/interfaces/PuzzleHint.md)[]
