[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / XPEventBus

# Class: XPEventBus

Defined in: src/events.ts:205

Minimal synchronous pub/sub. Listener errors are isolated so a faulty host
callback can never break the desktop.

## Constructors

### Constructor

&gt; **new XPEventBus**(): `XPEventBus`

#### Returns

`XPEventBus`

## Methods

### emit()

&gt; **emit**(`event`): `void`

Defined in: src/events.ts:215

#### Parameters

##### event

[`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md)

#### Returns

`void`

---

### subscribe()

&gt; **subscribe**(`listener`): () =&gt; `void`

Defined in: src/events.ts:208

#### Parameters

##### listener

[`XPEventListener`](/windows-xp/docs/zh/api/index/type-aliases/XPEventListener.md)

#### Returns

() =&gt; `void`
