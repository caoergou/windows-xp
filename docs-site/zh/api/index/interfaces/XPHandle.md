---
title: "接口：XPHandle"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / XPHandle

# 接口：XPHandle

定义于：src/components/XPBridge.tsx:124

通过 &lt;WindowsXP/&gt; 的 `ref` 暴露的命令式句柄（#76，在 #115 中扩展）：
让宿主以编程方式驱动桌面（演示、测试、场景脚本）。保留五个原始顶层方法以向后兼容；
新能力按领域分组。

## 属性

### appearance

> **appearance**: [`XPAppearanceApi`](/windows-xp/docs/zh/api/index/interfaces/XPAppearanceApi.md)

定义于：src/components/XPBridge.tsx:151

外观控制。

---

### cancelSchedule

> **cancelSchedule**: (`id`) =&gt; `void`

定义于：src/components/XPBridge.tsx:169

按 id 取消待执行的调度（#130）。

#### 参数

##### id

`string`

#### 返回值

`void`

---

### closeWindow

> **closeWindow**: (`id`) =&gt; `void`

定义于：src/components/XPBridge.tsx:141

按 id 关闭窗口。

#### 参数

##### id

`string`

#### 返回值

`void`

---

### emit

> **emit**: (`event`) =&gt; `void`

定义于：src/components/XPBridge.tsx:161

将事件注入到 `onEvent` 和场景 triggers 读取的同一总线。

#### 参数

##### event

[`XPEvent`](/windows-xp/docs/zh/api/index/type-aliases/XPEvent.md)

#### 返回值

`void`

---

### fs

> **fs**: [`XPFsApi`](/windows-xp/docs/zh/api/index/interfaces/XPFsApi.md)

定义于：src/components/XPBridge.tsx:147

文件系统驱动。

---

### getShareUrl

> **getShareUrl**: (`windowId`) =&gt; `string` \| `null`

定义于：src/components/XPBridge.tsx:139

构建一个可共享的永久链接（`?open=…`），在新加载时重现 `windowId`（#136）。
对于纯组件窗口（没有源路径）或没有 DOM 的情况返回 null。

#### 参数

##### windowId

`string`

#### 返回值

`string` \| `null`

---

### getSnapshot

> **getSnapshot**: () =&gt; [`XPSnapshot`](/windows-xp/docs/zh/api/index/interfaces/XPSnapshot.md)

定义于：src/components/XPBridge.tsx:181

将完整桌面状态捕获为可移植、带版本的快照（#117）。

#### 返回值

[`XPSnapshot`](/windows-xp/docs/zh/api/index/interfaces/XPSnapshot.md)

---

### loadSnapshot

> **loadSnapshot**: (`snapshot`) =&gt; `Promise`&lt;`void`&gt;

定义于：src/components/XPBridge.tsx:186

用快照替换当前实例的状态并重新加载以恢复状态。
版本缺失或太新时抛出 [XPSnapshotVersionError](/windows-xp/docs/zh/api/index/classes/XPSnapshotVersionError.md)。

#### 参数

##### snapshot

[`XPSnapshot`](/windows-xp/docs/zh/api/index/interfaces/XPSnapshot.md)

#### 返回值

`Promise`&lt;`void`&gt;

---

### notify

> **notify**: (`options`) =&gt; `string`

定义于：src/components/XPBridge.tsx:159

弹出一个 XP 托盘气泡通知（#118）。返回通知 id。

#### 参数

##### options

[`NotifyOptions`](/windows-xp/docs/zh/api/index/interfaces/NotifyOptions.md)

#### 返回值

`string`

---

### openApp

> **openApp**: (`appId`, `props?`) =&gt; `string` \| `null`

定义于：src/components/XPBridge.tsx:126

按 id 打开已注册的应用，可选择传入组件 props。

#### 参数

##### appId

`string`

##### props?

`Record`&lt;`string`, `unknown`&gt;

#### 返回值

`string` \| `null`

---

### openExternal

> **openExternal**: (`url`, `opts?`) =&gt; `void`

定义于：src/components/XPBridge.tsx:133

从虚构环境跳转到真实 URL（#136）。默认在新标签页打开；
传入 `{ newTab: false }` 以导航当前标签页。触发 `link:external`。

#### 参数

##### url

`string`

##### opts?

###### newTab?

`boolean`

#### 返回值

`void`

---

### openFile

> **openFile**: (`path`) =&gt; `string` \| `null`

定义于：src/components/XPBridge.tsx:128

按绝对路径打开文件系统节点（会解析到对应应用）。

#### 参数

##### path

`string`[]

#### 返回值

`string` \| `null`

---

### qq

> **qq**: `XPQQApi`

定义于：src/components/XPBridge.tsx:155

QQ Messenger 驱动（#119）。

---

### reset

> **reset**: () =&gt; `void`

定义于：src/components/XPBridge.tsx:145

清除所有持久化的桌面状态（localStorage + IndexedDB）并重新加载。

#### 返回值

`void`

---

### scenario

> **scenario**: [`XPScenarioApi`](/windows-xp/docs/zh/api/index/interfaces/XPScenarioApi.md)

定义于：src/components/XPBridge.tsx:179

对场景 walkthrough 的排练/确定性寻址（#207）。

---

### schedule

> **schedule**: (`options`) =&gt; `string`

定义于：src/components/XPBridge.tsx:167

在延迟后或 wall-clock 截止时间触发一个事件（#130）。
待调度项在每个实例中持久化，如果页面关闭期间截止时间已过，下次加载时仍会触发。返回 schedule id。

#### 参数

##### options

[`ScheduleOptions`](/windows-xp/docs/zh/api/index/interfaces/ScheduleOptions.md)

#### 返回值

`string`

---

### session

> **session**: [`XPSessionApi`](/windows-xp/docs/zh/api/index/interfaces/XPSessionApi.md)

定义于：src/components/XPBridge.tsx:149

会话控制。

---

### showAlert

> **showAlert**: (`title`, `message`) =&gt; `void`

定义于：src/components/XPBridge.tsx:143

显示一个 XP 对话框。

#### 参数

##### title

`string`

##### message

`string`

#### 返回值

`void`

---

### sound

> **sound**: `object`

定义于：src/components/XPBridge.tsx:157

播放指定名称的 XP 系统声音。

#### play

> **play**: (`name`) =&gt; `void`

##### 参数

###### name

`string`

##### 返回值

`void`

---

### startLesson

> **startLesson**: (`lessonId`, `mode?`) =&gt; `boolean`

定义于：src/components/XPBridge.tsx:175

按 id 启动一个引导课程（#141），模式可为 `try`（默认）、`do` 或 `watch`。
如果未通过 `lessons` prop 注册该课程，则返回 false。触发 `lesson:*` 事件；
进度在每个实例中持久化。

#### 参数

##### lessonId

`string`

##### mode?

[`LessonMode`](/windows-xp/docs/zh/api/index/type-aliases/LessonMode.md)

#### 返回值

`boolean`

---

### stopLesson

> **stopLesson**: () =&gt; `void`

定义于：src/components/XPBridge.tsx:177

停止正在运行的课程并清除其保存的进度（#141）。

#### 返回值

`void`

---

### windows

> **windows**: [`XPWindowsApi`](/windows-xp/docs/zh/api/index/interfaces/XPWindowsApi.md)

定义于：src/components/XPBridge.tsx:153

窗口内省与控制。
