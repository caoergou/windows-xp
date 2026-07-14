[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / DeductionSheetProps

# Interface: DeductionSheetProps

Defined in: src/apps/DeductionSheet/index.tsx:22

## Properties

### formId?

&gt; `optional` **formId?**: `string`

Defined in: src/apps/DeductionSheet/index.tsx:24

Stable form id carried on the emitted events.

---

### groups?

&gt; `optional` **groups?**: `DeductionGroup`[]

Defined in: src/apps/DeductionSheet/index.tsx:34

Slot groups judged together (each a batch).

---

### prompt?

&gt; `optional` **prompt?**: `string`

Defined in: src/apps/DeductionSheet/index.tsx:28

Sentence with `[slotId]` placeholders rendered as inline selects.

---

### slots?

&gt; `optional` **slots?**: `DeductionSlot`[]

Defined in: src/apps/DeductionSheet/index.tsx:32

Slots to fill.

---

### solution?

&gt; `optional` **solution?**: `Record`\&lt;`string`, `string`\&gt;

Defined in: src/apps/DeductionSheet/index.tsx:36

slot id → the correct word.

---

### title?

&gt; `optional` **title?**: `string`

Defined in: src/apps/DeductionSheet/index.tsx:26

Optional heading (i18n key or literal).

---

### windowId?

&gt; `optional` **windowId?**: `string`

Defined in: src/apps/DeductionSheet/index.tsx:37

---

### wordBank?

&gt; `optional` **wordBank?**: `string`[]

Defined in: src/apps/DeductionSheet/index.tsx:30

Words the player can choose from.
