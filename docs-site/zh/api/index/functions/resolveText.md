[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / resolveText

# Function: resolveText()

&gt; **resolveText**(`strings`, `locale`, `key`): `string`

Defined in: src/scenario/strings.ts:21

Resolve a string key against the active `locale`, falling back to any other
table that defines it, then to the key itself (so an unresolved key is
visible rather than blank).

## Parameters

### strings

`Partial`\&lt;`Record`\&lt;`string`, `Record`\&lt;`string`, `string`\&gt;\&gt;\&gt; \| `undefined`

### locale

`string`

### key

`string`

## Returns

`string`
