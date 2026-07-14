[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / TrayItem

# Interface: TrayItem

Defined in: src/context/TrayContext.tsx:8

## Properties

### contextMenuItems?

&gt; `optional` **contextMenuItems?**: [`MenuItem`](/windows-xp/docs/zh/api/index/interfaces/MenuItem.md)[]

Defined in: src/context/TrayContext.tsx:19

Right-click context-menu items for this tray icon (#refine-qq). When present,
right-clicking the icon raises the shared XP ContextMenu. Structured
data only — the tray owner supplies `MenuItem`s, never hand-rolled menu DOM.

---

### icon

&gt; **icon**: `string`

Defined in: src/context/TrayContext.tsx:10

---

### id

&gt; **id**: `string`

Defined in: src/context/TrayContext.tsx:9

---

### onClick?

&gt; `optional` **onClick?**: () =&gt; `void`

Defined in: src/context/TrayContext.tsx:13

#### Returns

`void`

---

### order

&gt; **order**: `number`

Defined in: src/context/TrayContext.tsx:12

---

### tooltip

&gt; **tooltip**: `string`

Defined in: src/context/TrayContext.tsx:11
