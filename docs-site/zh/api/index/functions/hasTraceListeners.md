[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / hasTraceListeners

# Function: hasTraceListeners()

&gt; **hasTraceListeners**(`prefix`): `boolean`

Defined in: src/devtools/traceChannel.ts:75

Whether anyone is listening on `prefix`. The ScenarioRunner guards its extra
trace-building on this so a production build with no panel pays nothing.

## Parameters

### prefix

`string`

## Returns

`boolean`
