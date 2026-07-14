[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / RehearsalStep

# Interface: RehearsalStep

Defined in: src/scenario/types.ts:176

One step of a scenario's canonical walkthrough (#207 rehearsal).

## Properties

### beat?

&gt; `optional` **beat?**: `string`

Defined in: src/scenario/types.ts:184

Optional named beat reached once this step is processed — the target for
`seekTo(beat)`. Beat names should be stable (they survive edits that shift
indices).

---

### event

&gt; **event**: [`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md)

Defined in: src/scenario/types.ts:178

The event that advances the story at this step.
