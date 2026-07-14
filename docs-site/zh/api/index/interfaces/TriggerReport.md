[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / TriggerReport

# Interface: TriggerReport

Defined in: src/devtools/traceChannel.ts:19

One trigger's outcome for a single event.

## Properties

### fireCount

&gt; **fireCount**: `number`

Defined in: src/devtools/traceChannel.ts:31

Times this trigger has fired so far.

---

### fired

&gt; **fired**: `boolean`

Defined in: src/devtools/traceChannel.ts:28

---

### id

&gt; **id**: `string`

Defined in: src/devtools/traceChannel.ts:21

Trigger id, or its index as a string.

---

### index

&gt; **index**: `number`

Defined in: src/devtools/traceChannel.ts:22

---

### matchedOn

&gt; **matchedOn**: `boolean`

Defined in: src/devtools/traceChannel.ts:25

Did the event type match the trigger's `on`?

---

### on

&gt; **on**: `string` \| `string`[]

Defined in: src/devtools/traceChannel.ts:23

---

### skip?

&gt; `optional` **skip?**: [`SkipReason`](/windows-xp/docs/zh/api/index/type-aliases/SkipReason.md)

Defined in: src/devtools/traceChannel.ts:29

---

### when?

&gt; `optional` **when?**: [`ConditionTrace`](/windows-xp/docs/zh/api/index/interfaces/ConditionTrace.md)

Defined in: src/devtools/traceChannel.ts:27

Present when `matchedOn` and the once/max budget allowed evaluation.
