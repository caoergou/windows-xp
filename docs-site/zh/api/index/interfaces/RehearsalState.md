[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / RehearsalState

# Interface: RehearsalState

Defined in: src/devtools/rehearsalChannel.ts:25

The rehearsal cursor as the seek bar renders it.

## Properties

### active

&gt; **active**: `boolean`

Defined in: src/devtools/rehearsalChannel.ts:27

Whether a rehearsal is in progress (the live save is being previewed).

---

### beats

&gt; **beats**: [`RehearsalBeat`](/windows-xp/docs/zh/api/index/interfaces/RehearsalBeat.md)[]

Defined in: src/devtools/rehearsalChannel.ts:33

Named beats in tape order (seek targets).

---

### index

&gt; **index**: `number`

Defined in: src/devtools/rehearsalChannel.ts:29

Current tape index (−1 = before the first step / pristine start).

---

### length

&gt; **length**: `number`

Defined in: src/devtools/rehearsalChannel.ts:31

Total number of steps on the tape.
