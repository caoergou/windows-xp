[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [registry](/windows-xp/docs/zh/api/registry/index.md) / SerializableProps

# Type Alias: SerializableProps

&gt; **SerializableProps** = `Record`\&lt;`string`, [`JsonValue`](/windows-xp/docs/zh/api/index/type-aliases/JsonValue.md)\&gt;

Defined in: src/registry/defineApp.tsx:18

Props an app receives on restore. They are persisted to storage to rebuild
the window after a refresh, so they MUST be JSON-serializable — the
`JsonValue` constraint makes a non-serializable prop (function, element,
class instance) a COMPILE-TIME error instead of a silent refresh bug.
