[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [registry](/windows-xp/docs/zh/api/registry/index.md) / resolveFileOpen

# Function: resolveFileOpen()

&gt; **resolveFileOpen**(`key`, `item`): \{ `appId`: `string`; `component`: `ReactNode`; `icon`: `string`; `windowProps`: \{ `componentProps`: `unknown`; `height?`: `number`; `isMaximized?`: `boolean`; `left?`: `number`; `minHeight?`: `number`; `minWidth?`: `number`; `onClose`: ((`windowId`) =&gt; `void`) \| `null`; `onFocus`: ((`windowId`) =&gt; `void`) \| `null`; `onOpen`: ((`windowId`) =&gt; `void`) \| `null`; `resizable?`: `boolean`; `singleton?`: `boolean`; `top?`: `number`; `width?`: `number`; \}; \} \| `null`

Defined in: src/registry/apps.tsx:577

resolveFileOpen - resolve a filesystem node into a parameter object that can be passed directly to openWindow().

## Parameters

### key

`string`

The node's key among its parent's children (used as Explorer's initialPath)

### item

[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)

A node from filesystem.json

## Returns

\{ `appId`: `string`; `component`: `ReactNode`; `icon`: `string`; `windowProps`: \{ `componentProps`: `unknown`; `height?`: `number`; `isMaximized?`: `boolean`; `left?`: `number`; `minHeight?`: `number`; `minWidth?`: `number`; `onClose`: ((`windowId`) =&gt; `void`) \| `null`; `onFocus`: ((`windowId`) =&gt; `void`) \| `null`; `onOpen`: ((`windowId`) =&gt; `void`) \| `null`; `resizable?`: `boolean`; `singleton?`: `boolean`; `top?`: `number`; `width?`: `number`; \}; \} \| `null`

Returns null when the node cannot be opened (DummyApp or unregistered); the caller is responsible for showing a hint.
