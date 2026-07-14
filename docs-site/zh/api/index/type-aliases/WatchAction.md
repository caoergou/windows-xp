[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / WatchAction

# Type Alias: WatchAction

&gt; **WatchAction** = \{ `openApp`: `string`; `props?`: `Record`\&lt;`string`, `unknown`\&gt;; \} \| \{ `emit`: [`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md); \}

Defined in: src/lesson/types.ts:41

How Watch mode auto-performs a step (drives the imperative handle, then the
resulting event advances the step through the same gate as Try/Do). Omit and
Watch will fall back to emitting the step's `expect` as-is.
