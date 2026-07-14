---
title: "接口：ScheduleOptions"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / ScheduleOptions

# 接口：ScheduleOptions

定义于：src/context/SchedulerContext.tsx:33

## 属性

### at?

&gt; `optional` **at?**: `number`

定义于：src/context/SchedulerContext.tsx:39

在该 epoch 毫秒截止时间触发（优先级高于 `delayMs`）。

---

### delayMs?

&gt; `optional` **delayMs?**: `number`

定义于：src/context/SchedulerContext.tsx:37

从现在起经过这么多毫秒后触发。

---

### event?

&gt; `optional` **event?**: [`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md)

定义于：src/context/SchedulerContext.tsx:41

触发时发出的事件；默认为 `{ type: 'time:fire', id }`。

---

### id?

&gt; `optional` **id?**: `string`

定义于：src/context/SchedulerContext.tsx:35

稳定的 ID——复用同一个 ID 会替换现有调度。省略时自动生成。
