[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / StartMenuApp

# Interface: StartMenuApp

Defined in: src/data/culture/types.ts:34

## Extends

- [`CulturalItem`](/windows-xp/docs/zh/api/index/interfaces/CulturalItem.md)

## Properties

### action

&gt; **action**: `string`

Defined in: src/data/culture/types.ts:36

Internal start-menu action id (the app/route it opens).

---

### icon

&gt; **icon**: `string`

Defined in: src/data/culture/types.ts:40

`XPIcon` key.

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

### nameKey

&gt; **nameKey**: `string`

Defined in: src/data/culture/types.ts:38

i18n key for the label — provide it in the package's `i18n` or it renders as the raw key.
