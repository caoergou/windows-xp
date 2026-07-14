---
title: "接口：XPWindowsApi"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / XPWindowsApi

# 接口：XPWindowsApi

定义于：src/components/XPBridge.tsx:71

窗口内省与控制（#115）。

## 属性

### focus

> **focus**: (`id`) =&gt; `void`

定义于：src/components/XPBridge.tsx:73

#### 参数

##### id

`string`

#### 返回值

`void`

---

### list

> **list**: () =&gt; [`XPWindowInfo`](/windows-xp/docs/zh/api/index/interfaces/XPWindowInfo.md)[]

定义于：src/components/XPBridge.tsx:72

#### 返回值

[`XPWindowInfo`](/windows-xp/docs/zh/api/index/interfaces/XPWindowInfo.md)[]

---

### maximize

> **maximize**: (`id`) =&gt; `void`

定义于：src/components/XPBridge.tsx:75

#### 参数

##### id

`string`

#### 返回值

`void`

---

### minimize

> **minimize**: (`id`) =&gt; `void`

定义于：src/components/XPBridge.tsx:74

#### 参数

##### id

`string`

#### 返回值

`void`

---

### restore

> **restore**: (`id`) =&gt; `void`

定义于：src/components/XPBridge.tsx:76

#### 参数

##### id

`string`

#### 返回值

`void`
