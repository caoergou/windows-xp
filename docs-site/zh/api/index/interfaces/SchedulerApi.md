---
title: "接口：SchedulerApi"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / SchedulerApi

# 接口：SchedulerApi

定义于：src/context/SchedulerContext.tsx:44

## 属性

### cancelSchedule

&gt; **cancelSchedule**: (`id`) =&gt; `void`

定义于：src/context/SchedulerContext.tsx:48

按 ID 取消待执行的调度。

#### 参数

##### id

`string`

#### 返回值

`void`

---

### listSchedules

&gt; **listSchedules**: () =&gt; `string`[]

定义于：src/context/SchedulerContext.tsx:50

所有待执行调度的 ID。

#### 返回值

`string`[]

---

### schedule

&gt; **schedule**: (`options`) =&gt; `string`

定义于：src/context/SchedulerContext.tsx:46

注册（或替换）一个调度；返回其 ID。

#### 参数

##### options

[`ScheduleOptions`](/windows-xp/docs/zh/api/index/interfaces/ScheduleOptions.md)

#### 返回值

`string`
