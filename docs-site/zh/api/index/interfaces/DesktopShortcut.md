[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / DesktopShortcut

# Interface: DesktopShortcut

Defined in: src/data/culture/types.ts:18

## Extends

- [`CulturalItem`](/windows-xp/docs/zh/api/index/interfaces/CulturalItem.md)

## Properties

### app

&gt; **app**: `string`

Defined in: src/data/culture/types.ts:22

App id in the registry to open — must be a registered app (built-in or via the `apps` prop).

---

### icon

&gt; **icon**: `string`

Defined in: src/data/culture/types.ts:24

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

### name

&gt; **name**: `string`

Defined in: src/data/culture/types.ts:20

Display name (also the desktop icon's key).
