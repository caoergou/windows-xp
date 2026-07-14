---
title: "接口：XPScenarioApi"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / XPScenarioApi

# 接口：XPScenarioApi

定义于：src/components/XPBridge.tsx:103

排练（Rehearsal）/ 确定性定位（#207）—— 作者的迭代循环解锁机制。通过无头求解器重放场景的标准攻略前缀，以在一秒内跳转到任意节拍（beat）的精确状态，而无需将事件回放到总线上（因此不会产生外部副作用）。要求场景声明 `rehearsal.walkthrough`；否则这些方法将无操作 / 返回 false。

## 属性

### exitRehearsal

&gt; **exitRehearsal**: () =&gt; `void`

定义于：src/components/XPBridge.tsx:113

退出排练并恢复排练前的实时存档。

#### 返回值

`void`

---

### getState

&gt; **getState**: () =&gt; [`RehearsalState`](/windows-xp/docs/zh/api/index/interfaces/RehearsalState.md)

定义于：src/components/XPBridge.tsx:115

当前排练游标（活动标志、索引、磁带长度、命名节拍）。

#### 返回值

[`RehearsalState`](/windows-xp/docs/zh/api/index/interfaces/RehearsalState.md)

---

### seekTo

&gt; **seekTo**: (`beat`) =&gt; `boolean`

定义于：src/components/XPBridge.tsx:105

跳转到命名节拍的状态。如果节拍 / 攻略未知，则返回 false。

#### 参数

##### beat

`string`

#### 返回值

`boolean`

---

### seekToIndex

&gt; **seekToIndex**: (`index`) =&gt; `void`

定义于：src/components/XPBridge.tsx:107

跳转到磁带索引（会被钳制；-1 表示初始状态）。

#### 参数

##### index

`number`

#### 返回值

`void`

---

### stepBack

&gt; **stepBack**: () =&gt; `void`

定义于：src/components/XPBridge.tsx:109

回退一步（重新求解更短的前缀）。

#### 返回值

`void`

---

### stepForward

&gt; **stepForward**: () =&gt; `void`

定义于：src/components/XPBridge.tsx:111

前进一步。

#### 返回值

`void`
