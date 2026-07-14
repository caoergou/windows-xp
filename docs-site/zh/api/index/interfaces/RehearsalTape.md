[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / RehearsalTape

# Interface: RehearsalTape

Defined in: src/scenario/rehearsal.ts:31

The flattened event tape plus a beat-name → step-index lookup.

## Properties

### beats

&gt; **beats**: `Record`\&lt;`string`, `number`\&gt;

Defined in: src/scenario/rehearsal.ts:35

beat name → index of the step that reaches it.

---

### events

&gt; **events**: [`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md)[]

Defined in: src/scenario/rehearsal.ts:33

The walkthrough events, in order.
