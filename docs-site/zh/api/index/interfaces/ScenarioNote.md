[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / ScenarioNote

# Interface: ScenarioNote

Defined in: src/scenario/types.ts:141

A desktop sticky note pinned by a scenario (#207). JSON-serializable.

## Properties

### color?

&gt; `optional` **color?**: [`NoteColor`](/windows-xp/docs/zh/api/index/type-aliases/NoteColor.md)

Defined in: src/scenario/types.ts:156

Paper colour (default `yellow`).

---

### content?

&gt; `optional` **content?**: `string`

Defined in: src/scenario/types.ts:149

Body text (newlines preserved).

---

### contentKey?

&gt; `optional` **contentKey?**: `string`

Defined in: src/scenario/types.ts:151

String-table key for the body (#207); resolves over `content`.

---

### id

&gt; **id**: `string`

Defined in: src/scenario/types.ts:143

Stable id — upsert/remove key.

---

### title?

&gt; `optional` **title?**: `string`

Defined in: src/scenario/types.ts:145

Optional heading; falls back to a generic "Note" caption.

---

### titleKey?

&gt; `optional` **titleKey?**: `string`

Defined in: src/scenario/types.ts:147

String-table key for the title (#207); resolves over `title`.

---

### x?

&gt; `optional` **x?**: `number`

Defined in: src/scenario/types.ts:153

Desktop position in px; auto-stacked from the top-right when omitted.

---

### y?

&gt; `optional` **y?**: `number`

Defined in: src/scenario/types.ts:154
