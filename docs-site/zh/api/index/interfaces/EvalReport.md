[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / EvalReport

# Interface: EvalReport

Defined in: src/devtools/traceChannel.ts:43

The ScenarioRunner's full report for one processed event.

## Properties

### changes

&gt; **changes**: [`FlagChange`](/windows-xp/docs/zh/api/index/interfaces/FlagChange.md)[]

Defined in: src/devtools/traceChannel.ts:51

Flags changed while processing this event, with attribution.

---

### event

&gt; **event**: [`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md)

Defined in: src/devtools/traceChannel.ts:46

---

### flags

&gt; **flags**: `Record`\&lt;`string`, [`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md)\&gt;

Defined in: src/devtools/traceChannel.ts:49

Flags snapshot after the event was processed.

---

### seq

&gt; **seq**: `number`

Defined in: src/devtools/traceChannel.ts:45

Monotonic sequence number within this instance.

---

### triggers

&gt; **triggers**: [`TriggerReport`](/windows-xp/docs/zh/api/index/interfaces/TriggerReport.md)[]

Defined in: src/devtools/traceChannel.ts:47
