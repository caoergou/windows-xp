[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / Action

# Type Alias: Action

&gt; **Action** = \{ `setFlag`: `string`; `value?`: [`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md); \} \| \{ `by?`: `number`; `incFlag`: `string`; \} \| \{ `unlock`: `string`[]; \} \| \{ `addFile`: \{ `contentKey?`: `string`; `node?`: `Partial`\&lt;[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)\&gt;; `path`: `string`[]; \}; \} \| \{ `removeFile`: `string`[]; \} \| \{ `writeFile`: \{ `content`: `string`; `path`: `string`[]; \}; \} \| \{ `notify`: \{ `anchorId?`: `string`; `body?`: `string`; `bodyKey?`: `string`; `icon?`: `string`; `timeout?`: `number`; `title?`: `string`; `titleKey?`: `string`; \}; \} \| \{ `qqMessage`: \{ `buddyId`: `string`; `text?`: `string`; `textKey?`: `string`; \}; \} \| \{ `qqOnline`: `string`; \} \| \{ `openApp`: \{ `appId`: `string`; `props?`: `Record`\&lt;`string`, `unknown`\&gt;; \}; \} \| \{ `openFile`: `string`[]; \} \| \{ `playSound`: `string`; \} \| \{ `emit`: [`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md); \} \| \{ `alert`: \{ `message?`: `string`; `messageKey?`: `string`; `title?`: `string`; `titleKey?`: `string`; \}; \} \| \{ `note`: [`ScenarioNote`](/windows-xp/docs/zh/api/index/interfaces/ScenarioNote.md); \} \| \{ `removeNote`: `string`; \} \| \{ `after`: \{ `do`: `Action`[]; `ms`: `number`; \}; \}

Defined in: src/scenario/types.ts:77

An action executed when a trigger fires and its condition holds. Each maps to
a shipped actuation primitive so the core engine stays ignorant of game
semantics.

## Union Members

### Type Literal

\{ `setFlag`: `string`; `value?`: [`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md); \}

Set a flag (default `true`).

---

### Type Literal

\{ `by?`: `number`; `incFlag`: `string`; \}

Increment a numeric flag by `by` (default 1); treats missing/non-number as 0.

---

### Type Literal

\{ `unlock`: `string`[]; \}

Clear a node's `locked` flag (the "door opens" beat).

---

### Type Literal

\{ `addFile`: \{ `contentKey?`: `string`; `node?`: `Partial`\&lt;[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)\&gt;; `path`: `string`[]; \}; \}

Create a file/folder node at `path` (a scripted "new file appeared").
`contentKey` resolves the file's text body against the scenario's string
table (#207) at fire time, overriding `node.content` — so an in-world
document the player reads localizes with the rest of the beat text.

---

### Type Literal

\{ `removeFile`: `string`[]; \}

Delete the node at `path`.

---

### Type Literal

\{ `writeFile`: \{ `content`: `string`; `path`: `string`[]; \}; \}

Overwrite a text file's content at `path`.

---

### Type Literal

\{ `notify`: \{ `anchorId?`: `string`; `body?`: `string`; `bodyKey?`: `string`; `icon?`: `string`; `timeout?`: `number`; `title?`: `string`; `titleKey?`: `string`; \}; \}

Pop an XP tray balloon (the `showPopup` beat). `titleKey`/`bodyKey` resolve against the scenario's string table (#207).

---

### Type Literal

\{ `qqMessage`: \{ `buddyId`: `string`; `text?`: `string`; `textKey?`: `string`; \}; \}

Deliver an incoming QQ message from a buddy. `textKey` resolves against the string table (#207).

---

### Type Literal

\{ `qqOnline`: `string`; \}

Bring a QQ buddy online (knock + tray blink + balloon).

---

### Type Literal

\{ `openApp`: \{ `appId`: `string`; `props?`: `Record`\&lt;`string`, `unknown`\&gt;; \}; \}

Open a registered app by id.

---

### Type Literal

\{ `openFile`: `string`[]; \}

Open a filesystem node by absolute path.

---

### Type Literal

\{ `playSound`: `string`; \}

Play a named XP system sound.

---

### Type Literal

\{ `emit`: [`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md); \}

Inject an event onto the bus (also visible to `onEvent` and other triggers).

---

### Type Literal

\{ `alert`: \{ `message?`: `string`; `messageKey?`: `string`; `title?`: `string`; `titleKey?`: `string`; \}; \}

Show a modal alert dialog. `titleKey`/`messageKey` resolve against the string table (#207).

---

### Type Literal

\{ `note`: [`ScenarioNote`](/windows-xp/docs/zh/api/index/interfaces/ScenarioNote.md); \}

Pin or update a desktop sticky note (#207) — the cheapest "narration" channel
for nudging the story forward. Upserts by `id`; call again with the same id to
change the text.

---

### Type Literal

\{ `removeNote`: `string`; \}

Remove a desktop sticky note by id (#207).

---

### Type Literal

\{ `after`: \{ `do`: `Action`[]; `ms`: `number`; \}; \}

Run nested actions after `ms` milliseconds. Persisted via the #130 scheduler:
survives reload and fires on next load if the delay elapsed while closed.
