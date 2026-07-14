[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / fsTreeToSolveNodes

# Function: fsTreeToSolveNodes()

&gt; **fsTreeToSolveNodes**(`root`): [`SolveFsNode`](/windows-xp/docs/zh/api/index/interfaces/SolveFsNode.md)[]

Defined in: src/scenario/rehearsal.ts:83

Walk a filesystem tree into the flat `{ path, locked, content }` seeds the
solver's FS model consumes, so seeking evaluates FS gates against the real
starting world rather than an empty disk.

## Parameters

### root

[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)

## Returns

[`SolveFsNode`](/windows-xp/docs/zh/api/index/interfaces/SolveFsNode.md)[]
