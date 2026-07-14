[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / ModalContextType

# Interface: ModalContextType

Defined in: src/context/ModalContext.tsx:7

## Properties

### dialog

&gt; **dialog**: `object`

Defined in: src/context/ModalContext.tsx:25

#### alert

&gt; **alert**: (`opts`) =&gt; `Promise`\&lt;`void`\&gt;

##### Parameters

###### opts

###### message

`string`

###### title

`string`

###### type?

`"info"` \| `"warning"` \| `"error"`

##### Returns

`Promise`\&lt;`void`\&gt;

#### confirm

&gt; **confirm**: (`opts`) =&gt; `Promise`\&lt;`boolean`\&gt;

##### Parameters

###### opts

###### cancelLabel?

`string`

###### confirmLabel?

`string`

###### message

`string`

###### title

`string`

###### type?

`"info"` \| `"warning"` \| `"error"` \| `"question"`

##### Returns

`Promise`\&lt;`boolean`\&gt;

#### password

&gt; **password**: (`opts`) =&gt; `Promise`\&lt;`boolean`\&gt;

##### Parameters

###### opts

###### correctPassword

`string`

###### hint?

`string`

###### message

`string`

###### onFail?

() =&gt; `void`

###### title

`string`

##### Returns

`Promise`\&lt;`boolean`\&gt;

#### prompt

&gt; **prompt**: (`opts`) =&gt; `Promise`\&lt;`string` \| `null`\&gt;

##### Parameters

###### opts

###### defaultValue?

`string`

###### message

`string`

###### title

`string`

##### Returns

`Promise`\&lt;`string` \| `null`\&gt;

---

### hideModal

&gt; **hideModal**: () =&gt; `void`

Defined in: src/context/ModalContext.tsx:9

#### Returns

`void`

---

### showConfirm

&gt; **showConfirm**: (`title`, `message`, `type?`, `confirmLabel?`, `cancelLabel?`) =&gt; `Promise`\&lt;`boolean`\&gt;

Defined in: src/context/ModalContext.tsx:18

#### Parameters

##### title

`string`

##### message

`string`

##### type?

`"info"` \| `"warning"` \| `"error"` \| `"question"`

##### confirmLabel?

`string`

##### cancelLabel?

`string`

#### Returns

`Promise`\&lt;`boolean`\&gt;

---

### showInput

&gt; **showInput**: (`title`, `message`, `defaultValue?`) =&gt; `Promise`\&lt;`string` \| `null`\&gt;

Defined in: src/context/ModalContext.tsx:10

#### Parameters

##### title

`string`

##### message

`string`

##### defaultValue?

`string`

#### Returns

`Promise`\&lt;`string` \| `null`\&gt;

---

### showModal

&gt; **showModal**: (`title`, `message`, `type?`) =&gt; `Promise`\&lt;`void`\&gt;

Defined in: src/context/ModalContext.tsx:8

#### Parameters

##### title

`string`

##### message

`string`

##### type?

`"info"` \| `"warning"` \| `"error"`

#### Returns

`Promise`\&lt;`void`\&gt;

---

### showPasswordDialog

&gt; **showPasswordDialog**: (`options`) =&gt; `Promise`\&lt;`boolean`\&gt;

Defined in: src/context/ModalContext.tsx:11

#### Parameters

##### options

###### correctPassword

`string`

###### hint?

`string`

###### message

`string`

###### onFail?

() =&gt; `void`

###### title

`string`

#### Returns

`Promise`\&lt;`boolean`\&gt;
