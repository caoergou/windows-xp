[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / FileContentNode

# Interface: FileContentNode

Defined in: src/types/index.ts:90

Regular file node

## Extends

- `BaseFileNode`

## Properties

### app?

&gt; `optional` **app?**: `string`

Defined in: src/types/index.ts:93

---

### broken?

&gt; `optional` **broken?**: `boolean`

Defined in: src/types/index.ts:45

#### Inherited from

`BaseFileNode.broken`

---

### content?

&gt; `optional` **content?**: `string`

Defined in: src/types/index.ts:92

---

### cultureId?

&gt; `optional` **cultureId?**: `string`

Defined in: src/types/index.ts:42

#### Inherited from

`BaseFileNode.cultureId`

---

### description?

&gt; `optional` **description?**: `string`

Defined in: src/types/index.ts:95

---

### exifData?

&gt; `optional` **exifData?**: [`ExifData`](/windows-xp/docs/zh/api/index/interfaces/ExifData.md)

Defined in: src/types/index.ts:68

Directly embedded EXIF data

#### Inherited from

`BaseFileNode.exifData`

---

### exifPath?

&gt; `optional` **exifPath?**: `string`

Defined in: src/types/index.ts:66

Path pointing to an EXIF JSON file (under src/data/photos)

#### Inherited from

`BaseFileNode.exifPath`

---

### hidden?

&gt; `optional` **hidden?**: `boolean`

Defined in: src/types/index.ts:52

XP "Hidden" attribute (#219). Filtered out of Explorer unless the user turns
on "show hidden files"; shown ghosted (dimmed) when revealed. Lets a scenario
hide a clue the player must go looking for.

#### Inherited from

`BaseFileNode.hidden`

---

### hint?

&gt; `optional` **hint?**: `string`

Defined in: src/types/index.ts:46

#### Inherited from

`BaseFileNode.hint`

---

### icon?

&gt; `optional` **icon?**: `string`

Defined in: src/types/index.ts:39

#### Inherited from

`BaseFileNode.icon`

---

### locked?

&gt; `optional` **locked?**: `boolean`

Defined in: src/types/index.ts:43

#### Inherited from

`BaseFileNode.locked`

---

### managedByCulture?

&gt; `optional` **managedByCulture?**: `boolean`

Defined in: src/types/index.ts:41

Derived desktop entry owned by the active culture profile.

#### Inherited from

`BaseFileNode.managedByCulture`

---

### mtime?

&gt; `optional` **mtime?**: `string`

Defined in: src/types/index.ts:64

Last-modified timestamp, ISO 8601 (#219). Surfaces in the Details "Date
Modified" column (and its sort) and the Properties dialog; absent falls back
to the stable XP-era date.

#### Inherited from

`BaseFileNode.mtime`

---

### name

&gt; **name**: `string`

Defined in: src/types/index.ts:38

#### Inherited from

`BaseFileNode.name`

---

### password?

&gt; `optional` **password?**: `string`

Defined in: src/types/index.ts:44

#### Inherited from

`BaseFileNode.password`

---

### protected?

&gt; `optional` **protected?**: `boolean`

Defined in: src/types/index.ts:58

Protected/system file (#219). The in-fiction UI refuses to delete or rename
it (a "you can't just trash this" beat); the host's imperative `fs.*` API is
unaffected.

#### Inherited from

`BaseFileNode.protected`

---

### readOnly?

&gt; `optional` **readOnly?**: `boolean`

Defined in: src/types/index.ts:94

---

### type

&gt; **type**: `"file"`

Defined in: src/types/index.ts:91
