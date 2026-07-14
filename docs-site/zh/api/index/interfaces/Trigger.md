[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / Trigger

# Interface: Trigger

Defined in: src/scenario/types.ts:160

One `{ on, when?, do }` rule.

## Properties

### do

&gt; **do**: [`Action`](/windows-xp/docs/zh/api/index/type-aliases/Action.md)[]

Defined in: src/scenario/types.ts:168

Actions to run, in order.

---

### id?

&gt; `optional` **id?**: `string`

Defined in: src/scenario/types.ts:162

Optional stable id (used for once/max bookkeeping and debugging).

---

### max?

&gt; `optional` **max?**: `number`

Defined in: src/scenario/types.ts:172

Fire at most this many times (mutually reinforcing with `once`).

---

### on

&gt; **on**: `"app:launch"` \| `"app:close"` \| `"window:focus"` \| `"window:minimize"` \| `"window:maximize"` \| `"window:restore"` \| `"startmenu:open"` \| `"startmenu:close"` \| `"contextmenu:open"` \| `"file:open"` \| `"file:create"` \| `"file:update"` \| `"file:delete"` \| `"file:rename"` \| `"file:move"` \| `"file:copy"` \| `"file:restore"` \| `"file:unlock"` \| `"file:properties"` \| `"folder:delete"` \| `"recyclebin:empty"` \| `"password:fail"` \| `"session:login"` \| `"session:login-fail"` \| `"session:logout"` \| `"session:boot-complete"` \| `"session:shutdown"` \| `"flag:change"` \| `"cmd:exec"` \| `"ie:navigate"` \| `"wallpaper:change"` \| `"screensaver:start"` \| `"screensaver:stop"` \| `"notification:show"` \| `"notification:click"` \| `"time:hour"` \| `"time:fire"` \| `"user:idle"` \| `"user:active"` \| `"qq:login"` \| `"qq:open"` \| `"qq:online"` \| `"qq:message"` \| `"qq:reply"` \| `"qq:offline"` \| `"qq:status"` \| `"qq:choice"` \| `"game:start"` \| `"game:win"` \| `"game:lose"` \| `"media:play"` \| `"media:pause"` \| `"media:ended"` \| `"media:seek"` \| `"search:query"` \| `"evidence:collect"` \| `"evidence:pin"` \| `"evidence:link"` \| `"evidence:unpin"` \| `"deduction:submit"` \| `"deduction:verified"` \| `"deduction:failed"` \| `"lesson:start"` \| `"lesson:step-complete"` \| `"lesson:hint-shown"` \| `"lesson:step-failed"` \| `"lesson:complete"` \| `"install:start"` \| `"install:complete"` \| `"install:cancelled"` \| `"ui:action"` \| `"link:external"` \| (`"app:launch"` \| `"app:close"` \| `"window:focus"` \| `"window:minimize"` \| `"window:maximize"` \| `"window:restore"` \| `"startmenu:open"` \| `"startmenu:close"` \| `"contextmenu:open"` \| `"file:open"` \| `"file:create"` \| `"file:update"` \| `"file:delete"` \| `"file:rename"` \| `"file:move"` \| `"file:copy"` \| `"file:restore"` \| `"file:unlock"` \| `"file:properties"` \| `"folder:delete"` \| `"recyclebin:empty"` \| `"password:fail"` \| `"session:login"` \| `"session:login-fail"` \| `"session:logout"` \| `"session:boot-complete"` \| `"session:shutdown"` \| `"flag:change"` \| `"cmd:exec"` \| `"ie:navigate"` \| `"wallpaper:change"` \| `"screensaver:start"` \| `"screensaver:stop"` \| `"notification:show"` \| `"notification:click"` \| `"time:hour"` \| `"time:fire"` \| `"user:idle"` \| `"user:active"` \| `"qq:login"` \| `"qq:open"` \| `"qq:online"` \| `"qq:message"` \| `"qq:reply"` \| `"qq:offline"` \| `"qq:status"` \| `"qq:choice"` \| `"game:start"` \| `"game:win"` \| `"game:lose"` \| `"media:play"` \| `"media:pause"` \| `"media:ended"` \| `"media:seek"` \| `"search:query"` \| `"evidence:collect"` \| `"evidence:pin"` \| `"evidence:link"` \| `"evidence:unpin"` \| `"deduction:submit"` \| `"deduction:verified"` \| `"deduction:failed"` \| `"lesson:start"` \| `"lesson:step-complete"` \| `"lesson:hint-shown"` \| `"lesson:step-failed"` \| `"lesson:complete"` \| `"install:start"` \| `"install:complete"` \| `"install:cancelled"` \| `"ui:action"` \| `"link:external"`)[]

Defined in: src/scenario/types.ts:164

Event type(s) this trigger listens for.

---

### once?

&gt; `optional` **once?**: `boolean`

Defined in: src/scenario/types.ts:170

Fire at most once for the lifetime of the save (default false).

---

### when?

&gt; `optional` **when?**: [`Condition`](/windows-xp/docs/zh/api/index/type-aliases/Condition.md)

Defined in: src/scenario/types.ts:166

Optional guard; the actions run only when it evaluates true.
