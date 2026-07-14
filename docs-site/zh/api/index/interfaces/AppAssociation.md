[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / AppAssociation

# Interface: AppAssociation\&lt;TFileNode, TProps\&gt;

Defined in: src/types/index.ts:244

File→app association. The app opens for any filesystem node whose `.app`
equals `appField`; `getProps` maps that node to the app's restore props.

## Type Parameters

### TFileNode

`TFileNode` _extends_ [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md) = [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)

### TProps

`TProps` = `unknown`

## Properties

### appField

&gt; **appField**: `string`

Defined in: src/types/index.ts:245

---

### getProps

&gt; **getProps**: (`item`) =&gt; `TProps`

Defined in: src/types/index.ts:246

#### Parameters

##### item

`TFileNode`

#### Returns

`TProps`
