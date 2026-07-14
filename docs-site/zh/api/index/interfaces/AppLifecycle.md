[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / AppLifecycle

# Interface: AppLifecycle

Defined in: src/types/index.ts:234

App lifecycle callbacks. Runtime-only — never persisted (see AppRegistryEntry).

## Properties

### onClose?

&gt; `optional` **onClose?**: (`windowId`) =&gt; `void`

Defined in: src/types/index.ts:236

#### Parameters

##### windowId

`string`

#### Returns

`void`

---

### onFocus?

&gt; `optional` **onFocus?**: (`windowId`) =&gt; `void`

Defined in: src/types/index.ts:237

#### Parameters

##### windowId

`string`

#### Returns

`void`

---

### onOpen?

&gt; `optional` **onOpen?**: (`windowId`) =&gt; `void`

Defined in: src/types/index.ts:235

#### Parameters

##### windowId

`string`

#### Returns

`void`
