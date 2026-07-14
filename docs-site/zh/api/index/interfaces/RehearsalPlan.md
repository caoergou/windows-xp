[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / RehearsalPlan

# Interface: RehearsalPlan

Defined in: src/scenario/types.ts:195

A canonical walkthrough the rehearsal/seek engine (#207) replays to jump to
any story beat deterministically ("rehearsal mode"). Because triggers and events are
data, replaying a prefix through the headless solver reconstructs the exact
state of having played to that beat - so an author tests the finale in a
second instead of playing ten minutes. Authoring it also gives the solver its
regression walkthrough ("CI for stories").

## Properties

### walkthrough

&gt; **walkthrough**: [`RehearsalStep`](/windows-xp/docs/zh/api/index/interfaces/RehearsalStep.md)[]

Defined in: src/scenario/types.ts:196
