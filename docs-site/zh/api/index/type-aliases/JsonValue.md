[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / JsonValue

# Type Alias: JsonValue

&gt; **JsonValue** = `string` \| `number` \| `boolean` \| `null` \| `JsonValue`[] \| \{\[`key`: `string`\]: `JsonValue`; \}

Defined in: src/types/index.ts:13

Any JSON-serializable value.

A window's `componentProps` are written to localStorage to rebuild the window
after a refresh, so a custom app's restore props must be JSON-serializable
(no functions, DOM nodes, or class instances). Constraining an app's props
type with this catches "restoration fails after refresh" bugs at compile time.
