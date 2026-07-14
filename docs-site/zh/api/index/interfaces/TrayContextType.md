[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / TrayContextType

# Interface: TrayContextType

Defined in: src/context/TrayContext.tsx:48

## Properties

### dismissNotification

&gt; **dismissNotification**: (`id`) =&gt; `void`

Defined in: src/context/TrayContext.tsx:60

Dismiss a queued or visible notification by id.

#### Parameters

##### id

`string`

#### Returns

`void`

---

### items

&gt; **items**: [`TrayItem`](/windows-xp/docs/zh/api/index/interfaces/TrayItem.md)[]

Defined in: src/context/TrayContext.tsx:49

---

### notify

&gt; **notify**: (`options`) =&gt; `string`

Defined in: src/context/TrayContext.tsx:58

Pop an XP tray balloon. One shows at a time; further calls queue behind it,
XP-style. Plays the notify sound and emits `notification:show` on display
and `notification:click` on click. Returns the notification id.

#### Parameters

##### options

[`NotifyOptions`](/windows-xp/docs/zh/api/index/interfaces/NotifyOptions.md)

#### Returns

`string`

---

### register

&gt; **register**: (`id`, `config`) =&gt; `void`

Defined in: src/context/TrayContext.tsx:50

#### Parameters

##### id

`string`

##### config

`Omit`\&lt;[`TrayItem`](/windows-xp/docs/zh/api/index/interfaces/TrayItem.md), `"id"`\&gt;

#### Returns

`void`

---

### unregister

&gt; **unregister**: (`id`) =&gt; `void`

Defined in: src/context/TrayContext.tsx:51

#### Parameters

##### id

`string`

#### Returns

`void`

---

### update

&gt; **update**: (`id`, `updates`) =&gt; `void`

Defined in: src/context/TrayContext.tsx:52

#### Parameters

##### id

`string`

##### updates

`Partial`\&lt;`Omit`\&lt;[`TrayItem`](/windows-xp/docs/zh/api/index/interfaces/TrayItem.md), `"id"`\&gt;\&gt;

#### Returns

`void`
