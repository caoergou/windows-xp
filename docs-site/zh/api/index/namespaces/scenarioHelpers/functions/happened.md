[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / [scenarioHelpers](/windows-xp/docs/zh/api/index/namespaces/scenarioHelpers/index.md) / happened

# Function: happened()

&gt; **happened**(`type`, `match?`): [`Condition`](/windows-xp/docs/zh/api/index/type-aliases/Condition.md)

Defined in: src/scenario/builder.ts:32

## Parameters

### type

`"app:launch"` \| `"app:close"` \| `"window:focus"` \| `"window:minimize"` \| `"window:maximize"` \| `"window:restore"` \| `"startmenu:open"` \| `"startmenu:close"` \| `"contextmenu:open"` \| `"file:open"` \| `"file:create"` \| `"file:update"` \| `"file:delete"` \| `"file:rename"` \| `"file:move"` \| `"file:copy"` \| `"file:restore"` \| `"file:unlock"` \| `"file:properties"` \| `"folder:delete"` \| `"recyclebin:empty"` \| `"password:fail"` \| `"session:login"` \| `"session:login-fail"` \| `"session:logout"` \| `"session:boot-complete"` \| `"session:shutdown"` \| `"flag:change"` \| `"cmd:exec"` \| `"ie:navigate"` \| `"wallpaper:change"` \| `"screensaver:start"` \| `"screensaver:stop"` \| `"notification:show"` \| `"notification:click"` \| `"time:hour"` \| `"time:fire"` \| `"user:idle"` \| `"user:active"` \| `"qq:login"` \| `"qq:open"` \| `"qq:online"` \| `"qq:message"` \| `"qq:reply"` \| `"qq:offline"` \| `"qq:status"` \| `"qq:choice"` \| `"game:start"` \| `"game:win"` \| `"game:lose"` \| `"media:play"` \| `"media:pause"` \| `"media:ended"` \| `"media:seek"` \| `"search:query"` \| `"evidence:collect"` \| `"evidence:pin"` \| `"evidence:link"` \| `"evidence:unpin"` \| `"deduction:submit"` \| `"deduction:verified"` \| `"deduction:failed"` \| `"lesson:start"` \| `"lesson:step-complete"` \| `"lesson:hint-shown"` \| `"lesson:step-failed"` \| `"lesson:complete"` \| `"install:start"` \| `"install:complete"` \| `"install:cancelled"` \| `"ui:action"` \| `"link:external"`

### match?

`Record`\&lt;`string`, `Scalar` \| `Scalar`[]\&gt;

## Returns

[`Condition`](/windows-xp/docs/zh/api/index/type-aliases/Condition.md)
