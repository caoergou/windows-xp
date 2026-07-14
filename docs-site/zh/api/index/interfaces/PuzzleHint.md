[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / PuzzleHint

# Interface: PuzzleHint

Defined in: src/scenario/puzzleGraph.ts:23

A hint rung for a puzzle's anti-stuck ladder (M12). A rung reveals its `text`
(as a tray balloon) once the player looks stuck: after `afterFails`
`password:fail`s, or `afterIdles` `user:idle` periods — whichever comes first.
Prefer the [ladder](/windows-xp/docs/zh/api/index/functions/ladder.md) helper over writing rungs by hand.

## Properties

### afterFails?

&gt; `optional` **afterFails?**: `number`

Defined in: src/scenario/puzzleGraph.ts:33

Reveal after this many `password:fail` events (journal count ≥).

---

### afterIdles?

&gt; `optional` **afterIdles?**: `number`

Defined in: src/scenario/puzzleGraph.ts:35

Reveal after this many `user:idle` periods (journal count ≥).

---

### text?

&gt; `optional` **text?**: `string`

Defined in: src/scenario/puzzleGraph.ts:25

Inline balloon body (quick prototyping); `textKey` wins when both are set.

---

### textKey?

&gt; `optional` **textKey?**: `string`

Defined in: src/scenario/puzzleGraph.ts:27

String-table key for the body (#207); resolves over `text`.

---

### title?

&gt; `optional` **title?**: `string`

Defined in: src/scenario/puzzleGraph.ts:29

Balloon title (default `'Hint'`).

---

### titleKey?

&gt; `optional` **titleKey?**: `string`

Defined in: src/scenario/puzzleGraph.ts:31

String-table key for the title (#207); resolves over `title`.
