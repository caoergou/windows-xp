[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / StickyNoteContent

# Interface: StickyNoteContent

Defined in: src/data/culture/types.ts:27

## Extends

- [`CulturalItem`](/windows-xp/docs/zh/api/index/interfaces/CulturalItem.md)

## Properties

### content

&gt; **content**: `string`

Defined in: src/data/culture/types.ts:31

Note body; `\n` for line breaks.

---

### id

&gt; **id**: `string`

Defined in: src/data/culture/types.ts:13

Unique id within the package.

#### Inherited from

[`CulturalItem`](/windows-xp/docs/zh/api/index/interfaces/CulturalItem.md).[`id`](/windows-xp/docs/zh/api/index/interfaces/CulturalItem.md#id)

---

### locales?

&gt; `optional` **locales?**: `string`[]

Defined in: src/data/culture/types.ts:15

Language whitelist; omit to show in every language. Matched base-aware (see filterByLocale).

#### Inherited from

[`CulturalItem`](/windows-xp/docs/zh/api/index/interfaces/CulturalItem.md).[`locales`](/windows-xp/docs/zh/api/index/interfaces/CulturalItem.md#locales)

---

### title

&gt; **title**: `string`

Defined in: src/data/culture/types.ts:29

Note title.
