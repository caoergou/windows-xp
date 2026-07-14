[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / validateScenario

# Function: validateScenario()

&gt; **validateScenario**(`scenario`): [`ScenarioValidation`](/windows-xp/docs/zh/api/index/interfaces/ScenarioValidation.md)

Defined in: src/scenario/validate.ts:124

Validate a scenario object. Returns collected `errors` / `warnings`, each
prefixed with the offending path (e.g. `triggers[0].do[1]`). Never throws.

## Parameters

### scenario

`unknown`

## Returns

[`ScenarioValidation`](/windows-xp/docs/zh/api/index/interfaces/ScenarioValidation.md)
