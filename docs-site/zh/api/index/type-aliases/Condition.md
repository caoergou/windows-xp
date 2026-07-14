[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / Condition

# Type Alias: Condition

&gt; **Condition** = \{ `all`: `Condition`[]; \} \| \{ `any`: `Condition`[]; \} \| \{ `not`: `Condition`; \} \| \{ `eq?`: [`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md); `flag`: `string`; `gte?`: `number`; `lte?`: `number`; \} \| \{ `event`: `Record`\&lt;`string`, `Scalar` \| `Scalar`[]\&gt;; \} \| \{ `happened`: \{ `match?`: `Record`\&lt;`string`, `Scalar` \| `Scalar`[]\&gt;; `type`: [`XPEventType`](/windows-xp/docs/zh/api/index/type-aliases/XPEventType.md); \}; \} \| \{ `count`: \{ `match?`: `Record`\&lt;`string`, `Scalar` \| `Scalar`[]\&gt;; `type`: [`XPEventType`](/windows-xp/docs/zh/api/index/type-aliases/XPEventType.md); \}; `eq?`: `number`; `gte?`: `number`; `lte?`: `number`; \} \| \{ `exists`: `string`[]; \} \| \{ `unlocked`: `string`[]; \} \| \{ `contentContains`: \{ `contains`: `string`; `path`: `string`[]; \}; \} \| \{ `pinned`: `string`; \} \| \{ `linked`: \{ `a`: `string`; `b`: `string`; \}; \} \| \{ `searched`: `string`; \} \| \{ `found`: `string`; \}

Defined in: src/scenario/types.ts:31

A condition tree evaluated when a trigger fires. Composable with
`all`/`any`/`not`; leaf predicates read flags, the triggering event's payload,
the persisted event journal, and the filesystem.

## Union Members

### Type Literal

\{ `all`: `Condition`[]; \}

AND — every child must hold.

---

### Type Literal

\{ `any`: `Condition`[]; \}

OR — at least one child must hold.

---

### Type Literal

\{ `not`: `Condition`; \}

NOT — the child must not hold.

---

### Type Literal

\{ `eq?`: [`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md); `flag`: `string`; `gte?`: `number`; `lte?`: `number`; \}

Flag predicate. With no comparator, tests truthiness. `eq` compares equality;
`gte`/`lte` compare numerically (counters).

---

### Type Literal

\{ `event`: `Record`\&lt;`string`, `Scalar` \| `Scalar`[]\&gt;; \}

Payload match on the _triggering_ event: every listed field must equal the
event's field (deep-equal for arrays like `path`).

---

### Type Literal

\{ `happened`: \{ `match?`: `Record`\&lt;`string`, `Scalar` \| `Scalar`[]\&gt;; `type`: [`XPEventType`](/windows-xp/docs/zh/api/index/type-aliases/XPEventType.md); \}; \}

True if an event of `type` matching `match` has ever happened (event journal).

---

### Type Literal

\{ `count`: \{ `match?`: `Record`\&lt;`string`, `Scalar` \| `Scalar`[]\&gt;; `type`: [`XPEventType`](/windows-xp/docs/zh/api/index/type-aliases/XPEventType.md); \}; `eq?`: `number`; `gte?`: `number`; `lte?`: `number`; \}

Count of journal events of `type` matching `match`, compared with `gte`/`lte`/`eq`.

---

### Type Literal

\{ `exists`: `string`[]; \}

FS predicate: a node exists at `path`.

---

### Type Literal

\{ `unlocked`: `string`[]; \}

FS predicate: the node at `path` exists and is not locked.

---

### Type Literal

\{ `contentContains`: \{ `contains`: `string`; `path`: `string`[]; \}; \}

FS predicate: the text file at `path` contains `contains`.

---

### Type Literal

\{ `pinned`: `string`; \}

Evidence-board predicate: item `pinned` is currently on the board (more `evidence:pin` than `evidence:unpin` in the journal).

---

### Type Literal

\{ `linked`: \{ `a`: `string`; `b`: `string`; \}; \}

Evidence-board predicate: items `a` and `b` are linked and both still pinned (order-insensitive).

---

### Type Literal

\{ `searched`: `string`; \}

Search-oracle predicate: a `search:query` was run whose query contains `searched` (case-insensitive substring).

---

### Type Literal

\{ `found`: `string`; \}

Search-oracle predicate: a `search:query` surfaced the result `found` (its id appeared in `resultIds`).
