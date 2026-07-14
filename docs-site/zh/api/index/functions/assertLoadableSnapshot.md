[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / assertLoadableSnapshot

# Function: assertLoadableSnapshot()

&gt; **assertLoadableSnapshot**(`value`): `asserts value is XPSnapshot`

Defined in: src/snapshot.ts:105

Validate a value is a loadable snapshot for this build (#117, #208). Throws
[XPSnapshotVersionError](/windows-xp/docs/zh/api/index/classes/XPSnapshotVersionError.md) for a missing/too-new version and
[XPSnapshotError](/windows-xp/docs/zh/api/index/classes/XPSnapshotError.md) for a malformed structure — with the offending path in
the message — rather than letting bad input corrupt storage. Callers validate
before applying, so a rejected snapshot leaves the desktop untouched.

## Parameters

### value

`unknown`

## Returns

`asserts value is XPSnapshot`
