[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / RehearsalController

# Interface: RehearsalController

Defined in: src/devtools/rehearsalChannel.ts:37

The imperative surface the ScenarioRunner exposes to seek-bar consumers.

## Properties

### exitRehearsal

&gt; **exitRehearsal**: () =&gt; `void`

Defined in: src/devtools/rehearsalChannel.ts:47

Leave rehearsal and restore the pre-rehearsal live save.

#### Returns

`void`

---

### getState

&gt; **getState**: () =&gt; [`RehearsalState`](/windows-xp/docs/zh/api/index/interfaces/RehearsalState.md)

Defined in: src/devtools/rehearsalChannel.ts:49

The current cursor (for a consumer that mounts mid-session).

#### Returns

[`RehearsalState`](/windows-xp/docs/zh/api/index/interfaces/RehearsalState.md)

---

### seekTo

&gt; **seekTo**: (`beat`) =&gt; `boolean`

Defined in: src/devtools/rehearsalChannel.ts:39

Jump to a named beat's state; returns false if the beat is unknown.

#### Parameters

##### beat

`string`

#### Returns

`boolean`

---

### seekToIndex

&gt; **seekToIndex**: (`index`) =&gt; `void`

Defined in: src/devtools/rehearsalChannel.ts:41

Jump to a tape index (clamped; −1 = pristine start).

#### Parameters

##### index

`number`

#### Returns

`void`

---

### stepBack

&gt; **stepBack**: () =&gt; `void`

Defined in: src/devtools/rehearsalChannel.ts:43

Step one beat back (re-solve the shorter prefix).

#### Returns

`void`

---

### stepForward

&gt; **stepForward**: () =&gt; `void`

Defined in: src/devtools/rehearsalChannel.ts:45

Step one beat forward.

#### Returns

`void`
