---
title: "类型别名：XPEvent"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / XPEvent

# 类型别名：XPEvent

> **XPEvent** = `XPEventBody` & `object`

定义于：src/events.ts:196

引擎的事件类型。`XPEventBody` 是负载联合类型；可选的 `rehearsal` 标记（#207）
由 seek/rehearsal 引擎在将事件重放到 journal 时加盖。`onEvent` 宿主桥会丢弃
`rehearsal` 事件，因此快进（fast-forward）到某一 beat 永远不会触发外部副作用或污染宿主分析数据——
而引擎自身的 `happened`/`count` 谓词仍然能看到它们（关卡判断保持正确）。真实游戏永远不会设置它。

## 类型声明

### rehearsal?

> `optional` **rehearsal?**: `boolean`
