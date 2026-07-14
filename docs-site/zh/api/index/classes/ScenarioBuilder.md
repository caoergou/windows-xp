[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / ScenarioBuilder

# Class: ScenarioBuilder

Defined in: src/scenario/builder.ts:149

A scenario under construction. Call `.build()` for the Layer-1 [Scenario](/windows-xp/docs/zh/api/index/interfaces/Scenario.md).

## Constructors

### Constructor

&gt; **new ScenarioBuilder**(`scenarioId`): `ScenarioBuilder`

Defined in: src/scenario/builder.ts:153

#### Parameters

##### scenarioId

`string`

#### Returns

`ScenarioBuilder`

## Methods

### build()

&gt; **build**(): [`Scenario`](/windows-xp/docs/zh/api/index/interfaces/Scenario.md)

Defined in: src/scenario/builder.ts:175

Compile to the Layer-1 Scenario JSON.

#### Returns

[`Scenario`](/windows-xp/docs/zh/api/index/interfaces/Scenario.md)

---

### initialFlag()

&gt; **initialFlag**(`name`, `value`): `this`

Defined in: src/scenario/builder.ts:156

Seed an initial flag value.

#### Parameters

##### name

`string`

##### value

[`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md)

#### Returns

`this`

---

### on()

&gt; **on**(`on`, `match?`): `TriggerBuilder`

Defined in: src/scenario/builder.ts:165

Begin a trigger. An optional `match` becomes an implicit `event` payload
condition ANDed with any `.when(...)`.

#### Parameters

##### on

`"app:launch"` \| `"app:close"` \| `"window:focus"` \| `"window:minimize"` \| `"window:maximize"` \| `"window:restore"` \| `"startmenu:open"` \| `"startmenu:close"` \| `"contextmenu:open"` \| `"file:open"` \| `"file:create"` \| `"file:update"` \| `"file:delete"` \| `"file:rename"` \| `"file:move"` \| `"file:copy"` \| `"file:restore"` \| `"file:unlock"` \| `"file:properties"` \| `"folder:delete"` \| `"recyclebin:empty"` \| `"password:fail"` \| `"session:login"` \| `"session:login-fail"` \| `"session:logout"` \| `"session:boot-complete"` \| `"session:shutdown"` \| `"flag:change"` \| `"cmd:exec"` \| `"ie:navigate"` \| `"wallpaper:change"` \| `"screensaver:start"` \| `"screensaver:stop"` \| `"notification:show"` \| `"notification:click"` \| `"time:hour"` \| `"time:fire"` \| `"user:idle"` \| `"user:active"` \| `"qq:login"` \| `"qq:open"` \| `"qq:online"` \| `"qq:message"` \| `"qq:reply"` \| `"qq:offline"` \| `"qq:status"` \| `"qq:choice"` \| `"game:start"` \| `"game:win"` \| `"game:lose"` \| `"media:play"` \| `"media:pause"` \| `"media:ended"` \| `"media:seek"` \| `"search:query"` \| `"evidence:collect"` \| `"evidence:pin"` \| `"evidence:link"` \| `"evidence:unpin"` \| `"deduction:submit"` \| `"deduction:verified"` \| `"deduction:failed"` \| `"lesson:start"` \| `"lesson:step-complete"` \| `"lesson:hint-shown"` \| `"lesson:step-failed"` \| `"lesson:complete"` \| `"install:start"` \| `"install:complete"` \| `"install:cancelled"` \| `"ui:action"` \| `"link:external"` \| (`"app:launch"` \| `"app:close"` \| `"window:focus"` \| `"window:minimize"` \| `"window:maximize"` \| `"window:restore"` \| `"startmenu:open"` \| `"startmenu:close"` \| `"contextmenu:open"` \| `"file:open"` \| `"file:create"` \| `"file:update"` \| `"file:delete"` \| `"file:rename"` \| `"file:move"` \| `"file:copy"` \| `"file:restore"` \| `"file:unlock"` \| `"file:properties"` \| `"folder:delete"` \| `"recyclebin:empty"` \| `"password:fail"` \| `"session:login"` \| `"session:login-fail"` \| `"session:logout"` \| `"session:boot-complete"` \| `"session:shutdown"` \| `"flag:change"` \| `"cmd:exec"` \| `"ie:navigate"` \| `"wallpaper:change"` \| `"screensaver:start"` \| `"screensaver:stop"` \| `"notification:show"` \| `"notification:click"` \| `"time:hour"` \| `"time:fire"` \| `"user:idle"` \| `"user:active"` \| `"qq:login"` \| `"qq:open"` \| `"qq:online"` \| `"qq:message"` \| `"qq:reply"` \| `"qq:offline"` \| `"qq:status"` \| `"qq:choice"` \| `"game:start"` \| `"game:win"` \| `"game:lose"` \| `"media:play"` \| `"media:pause"` \| `"media:ended"` \| `"media:seek"` \| `"search:query"` \| `"evidence:collect"` \| `"evidence:pin"` \| `"evidence:link"` \| `"evidence:unpin"` \| `"deduction:submit"` \| `"deduction:verified"` \| `"deduction:failed"` \| `"lesson:start"` \| `"lesson:step-complete"` \| `"lesson:hint-shown"` \| `"lesson:step-failed"` \| `"lesson:complete"` \| `"install:start"` \| `"install:complete"` \| `"install:cancelled"` \| `"ui:action"` \| `"link:external"`)[]

##### match?

`Record`\&lt;`string`, `Scalar` \| `Scalar`[]\&gt;

#### Returns

`TriggerBuilder`
