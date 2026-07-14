[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / PersistenceMode

# Type Alias: PersistenceMode

&gt; **PersistenceMode** = `"local"` \| `"session"` \| `"none"`

Defined in: src/utils/storage.ts:86

How a storage handle persists desktop state (#138).

- `'local'` (default): localStorage metadata + IndexedDB file content —
  survives across visits. Right for games/progress.
- `'session'`: sessionStorage metadata + in-memory file content — per-tab
  continuity (survives reload within the tab), gone when the tab closes.
- `'none'`: everything in memory, no IndexedDB opened — every mount is
  pristine. Right for campaign pages, blogs, and teaching sandboxes.
