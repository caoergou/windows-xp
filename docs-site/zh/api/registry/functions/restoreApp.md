[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [registry](/windows-xp/docs/zh/api/registry/index.md) / restoreApp

# Function: restoreApp()

&gt; **restoreApp**\&lt;`P`\&gt;(`Component`): \{(`props`): `Element`; `displayName`: `string`; \}

Defined in: src/registry/defineApp.tsx:68

Wrap a component so the registry can restore it from persisted (`unknown`)
props. Exported for authors who build an [AppRegistryEntry](/windows-xp/docs/zh/api/index/interfaces/AppRegistryEntry.md) by hand and
want the same `unknown → props` cast the built-ins use.

## Type Parameters

### P

`P` _extends_ `Record`\&lt;`string`, `unknown`\&gt;

## Parameters

### Component

`ComponentType`\&lt;`P`\&gt;

## Returns

\{(`props`): `Element`; `displayName`: `string`; \}

### displayName

&gt; **displayName**: `string`
