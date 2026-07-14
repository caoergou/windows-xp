[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / PuzzleNode

# Interface: PuzzleNode

Defined in: src/scenario/puzzleGraph.ts:85

One node in the dependency graph.

## Properties

### gate?

&gt; `optional` **gate?**: `boolean`

Defined in: src/scenario/puzzleGraph.ts:103

Marks an act bottleneck: everything "after" it must transitively require it.

---

### grants?

&gt; `optional` **grants?**: [`Action`](/windows-xp/docs/zh/api/index/type-aliases/Action.md)[]

Defined in: src/scenario/puzzleGraph.ts:99

Actions performed once, when the puzzle is solved (reveals, unlocks).

---

### hints?

&gt; `optional` **hints?**: [`PuzzleHint`](/windows-xp/docs/zh/api/index/interfaces/PuzzleHint.md)[]

Defined in: src/scenario/puzzleGraph.ts:101

Hint ladder (M12 anti-stuck contract; checked by the linter).

---

### id

&gt; **id**: `string`

Defined in: src/scenario/puzzleGraph.ts:87

Stable id (referenced by other nodes' `requires`).

---

### on?

&gt; `optional` **on?**: `"app:launch"` \| `"app:close"` \| `"window:focus"` \| `"window:minimize"` \| `"window:maximize"` \| `"window:restore"` \| `"startmenu:open"` \| `"startmenu:close"` \| `"contextmenu:open"` \| `"file:open"` \| `"file:create"` \| `"file:update"` \| `"file:delete"` \| `"file:rename"` \| `"file:move"` \| `"file:copy"` \| `"file:restore"` \| `"file:unlock"` \| `"file:properties"` \| `"folder:delete"` \| `"recyclebin:empty"` \| `"password:fail"` \| `"session:login"` \| `"session:login-fail"` \| `"session:logout"` \| `"session:boot-complete"` \| `"session:shutdown"` \| `"flag:change"` \| `"cmd:exec"` \| `"ie:navigate"` \| `"wallpaper:change"` \| `"screensaver:start"` \| `"screensaver:stop"` \| `"notification:show"` \| `"notification:click"` \| `"time:hour"` \| `"time:fire"` \| `"user:idle"` \| `"user:active"` \| `"qq:login"` \| `"qq:open"` \| `"qq:online"` \| `"qq:message"` \| `"qq:reply"` \| `"qq:offline"` \| `"qq:status"` \| `"qq:choice"` \| `"game:start"` \| `"game:win"` \| `"game:lose"` \| `"media:play"` \| `"media:pause"` \| `"media:ended"` \| `"media:seek"` \| `"search:query"` \| `"evidence:collect"` \| `"evidence:pin"` \| `"evidence:link"` \| `"evidence:unpin"` \| `"deduction:submit"` \| `"deduction:verified"` \| `"deduction:failed"` \| `"lesson:start"` \| `"lesson:step-complete"` \| `"lesson:hint-shown"` \| `"lesson:step-failed"` \| `"lesson:complete"` \| `"install:start"` \| `"install:complete"` \| `"install:cancelled"` \| `"ui:action"` \| `"link:external"` \| (`"app:launch"` \| `"app:close"` \| `"window:focus"` \| `"window:minimize"` \| `"window:maximize"` \| `"window:restore"` \| `"startmenu:open"` \| `"startmenu:close"` \| `"contextmenu:open"` \| `"file:open"` \| `"file:create"` \| `"file:update"` \| `"file:delete"` \| `"file:rename"` \| `"file:move"` \| `"file:copy"` \| `"file:restore"` \| `"file:unlock"` \| `"file:properties"` \| `"folder:delete"` \| `"recyclebin:empty"` \| `"password:fail"` \| `"session:login"` \| `"session:login-fail"` \| `"session:logout"` \| `"session:boot-complete"` \| `"session:shutdown"` \| `"flag:change"` \| `"cmd:exec"` \| `"ie:navigate"` \| `"wallpaper:change"` \| `"screensaver:start"` \| `"screensaver:stop"` \| `"notification:show"` \| `"notification:click"` \| `"time:hour"` \| `"time:fire"` \| `"user:idle"` \| `"user:active"` \| `"qq:login"` \| `"qq:open"` \| `"qq:online"` \| `"qq:message"` \| `"qq:reply"` \| `"qq:offline"` \| `"qq:status"` \| `"qq:choice"` \| `"game:start"` \| `"game:win"` \| `"game:lose"` \| `"media:play"` \| `"media:pause"` \| `"media:ended"` \| `"media:seek"` \| `"search:query"` \| `"evidence:collect"` \| `"evidence:pin"` \| `"evidence:link"` \| `"evidence:unpin"` \| `"deduction:submit"` \| `"deduction:verified"` \| `"deduction:failed"` \| `"lesson:start"` \| `"lesson:step-complete"` \| `"lesson:hint-shown"` \| `"lesson:step-failed"` \| `"lesson:complete"` \| `"install:start"` \| `"install:complete"` \| `"install:cancelled"` \| `"ui:action"` \| `"link:external"`)[]

Defined in: src/scenario/puzzleGraph.ts:95

Event type(s) that re-check `solvedWhen`. Derived from `solvedWhen`'s
`happened`/`count` types when omitted; required when `solvedWhen` only reads
flags/FS/the triggering event's payload.

---

### requires?

&gt; `optional` **requires?**: `string`[]

Defined in: src/scenario/puzzleGraph.ts:89

Puzzle ids that must be solved before this one can be solved.

---

### solvedWhen

&gt; **solvedWhen**: [`Condition`](/windows-xp/docs/zh/api/index/type-aliases/Condition.md)

Defined in: src/scenario/puzzleGraph.ts:97

The condition that marks this puzzle solved.
