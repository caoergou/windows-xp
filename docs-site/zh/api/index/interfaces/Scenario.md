---
title: "接口：Scenario"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / Scenario

# 接口：Scenario

定义于：src/scenario/types.ts:200

一个完整场景：初始标志 + 触发规则手册。

## 属性

### id

&gt; **id**: `string`

定义于：src/scenario/types.ts:202

稳定的 ID（命名空间化持久化进度；更改后会重新开始）。

---

### initialFlags?

&gt; `optional` **initialFlags?**: `Record`\&lt;`string`, [`FlagValue`](/windows-xp/docs/zh/api/index/type-aliases/FlagValue.md)\&gt;

定义于：src/scenario/types.ts:204

在任何触发器运行前注入的标志。

---

### rehearsal?

&gt; `optional` **rehearsal?**: [`RehearsalPlan`](/windows-xp/docs/zh/api/index/interfaces/RehearsalPlan.md)

定义于：src/scenario/types.ts:219

排练/寻找引擎（#207）以及无头求解器回归输入的可选标准流程。
不需要快进的场景可省略。

---

### strings?

&gt; `optional` **strings?**: `Partial`\&lt;`Record`\&lt;`string`, `Record`\&lt;`string`, `string`\&gt;\&gt;\&gt;

定义于：src/scenario/types.ts:213

每区域设置的节拍文本表（#207）。动作通过键
（`titleKey`、`bodyKey`、`textKey`、`contentKey`）引用条目；运行时会根据
当前 UI 区域设置解析。这样作者可以在不触碰逻辑的情况下本地化/润色脚本。

---

### triggers

&gt; **triggers**: [`Trigger`](/windows-xp/docs/zh/api/index/interfaces/Trigger.md)[]

定义于：src/scenario/types.ts:206

规则手册。
