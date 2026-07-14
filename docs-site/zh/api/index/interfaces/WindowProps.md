[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / WindowProps

# Interface: WindowProps

Defined in: src/types/index.ts:205

Window configuration properties

## Indexable

&gt; \[`key`: `string`\]: `unknown`

## Properties

### closeGuard?

&gt; `optional` **closeGuard?**: ((`forceClose`) =&gt; `void`) \| `null`

Defined in: src/types/index.ts:218

---

### height?

&gt; `optional` **height?**: `number`

Defined in: src/types/index.ts:208

---

### isMaximized?

&gt; `optional` **isMaximized?**: `boolean`

Defined in: src/types/index.ts:213

---

### left?

&gt; `optional` **left?**: `number`

Defined in: src/types/index.ts:211

---

### minHeight?

&gt; `optional` **minHeight?**: `number`

Defined in: src/types/index.ts:210

---

### minimizeGuard?

&gt; `optional` **minimizeGuard?**: ((`defaultMinimize`) =&gt; `void`) \| `null`

Defined in: src/types/index.ts:219

---

### minWidth?

&gt; `optional` **minWidth?**: `number`

Defined in: src/types/index.ts:209

---

### onClose?

&gt; `optional` **onClose?**: ((`id`) =&gt; `void`) \| `null`

Defined in: src/types/index.ts:216

---

### onFocus?

&gt; `optional` **onFocus?**: ((`id`) =&gt; `void`) \| `null`

Defined in: src/types/index.ts:217

---

### onOpen?

&gt; `optional` **onOpen?**: ((`id`) =&gt; `void`) \| `null`

Defined in: src/types/index.ts:215

---

### resizable?

&gt; `optional` **resizable?**: `boolean`

Defined in: src/types/index.ts:214

---

### singleton?

&gt; `optional` **singleton?**: `boolean`

Defined in: src/types/index.ts:206

---

### sourcePath?

&gt; `optional` **sourcePath?**: `string`[]

Defined in: src/types/index.ts:225

Absolute filesystem path this window was opened from (#136). Set when a
window is opened by path (deep link / openFile / a file double-click) so
`XPHandle.getShareUrl` can reproduce it; absent for component-only windows.

---

### top?

&gt; `optional` **top?**: `number`

Defined in: src/types/index.ts:212

---

### width?

&gt; `optional` **width?**: `number`

Defined in: src/types/index.ts:207
