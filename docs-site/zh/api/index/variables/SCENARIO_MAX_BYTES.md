[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / SCENARIO_MAX_BYTES

# Variable: SCENARIO_MAX_BYTES

&gt; `const` **SCENARIO_MAX_BYTES**: `number`

Defined in: src/scenario/validate.ts:23

Reject a scenario larger than this — a sanity ceiling on untrusted
hand-written/loaded JSON, not a quota guard (a scenario object isn't persisted
to storage; only its derived flags/journal are). Generous on purpose: an
author may inline file contents via `writeFile`/`addFile`, so a real
content-heavy story can run to hundreds of KB. 2 MB catches pathological input
while comfortably fitting any genuine scenario.
