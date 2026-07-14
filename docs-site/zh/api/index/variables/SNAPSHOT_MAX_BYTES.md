[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / SNAPSHOT_MAX_BYTES

# Variable: SNAPSHOT_MAX_BYTES

&gt; `const` **SNAPSHOT_MAX_BYTES**: `number`

Defined in: src/snapshot.ts:55

Reject a snapshot larger than this (#208). A shared save is untrusted input;
an oversized blob could blow the storage quota mid-write. 5 MB of JSON is far
beyond any real desktop (file contents live in it, but not media blobs).
