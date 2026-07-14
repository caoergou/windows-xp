[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / CulturalItem

# Interface: CulturalItem

Defined in: src/data/culture/types.ts:11

## Extended by

- [`DesktopShortcut`](/windows-xp/docs/zh/api/index/interfaces/DesktopShortcut.md)
- [`StickyNoteContent`](/windows-xp/docs/zh/api/index/interfaces/StickyNoteContent.md)
- [`StartMenuApp`](/windows-xp/docs/zh/api/index/interfaces/StartMenuApp.md)

## Properties

### id

&gt; **id**: `string`

Defined in: src/data/culture/types.ts:13

Unique id within the package.

---

### locales?

&gt; `optional` **locales?**: `string`[]

Defined in: src/data/culture/types.ts:15

Language whitelist; omit to show in every language. Matched base-aware (see filterByLocale).
