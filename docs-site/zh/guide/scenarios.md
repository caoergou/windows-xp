---
title: 场景系统
---

# 场景系统

场景（scenario）是一段 JSON 脚本，它让桌面根据玩家的操作作出反应。例如，当玩家打开某个文件时，你可以解锁一个文件夹、显示一条通知，或者写入一个新文件——不需要写 React 代码。

## Hello world 触发器

```jsx
import { WindowsXP } from '@caoergou/windows-xp';

const scenario = {
  id: 'hello',
  triggers: [
    {
      id: 'open-readme',
      on: 'file:open',
      when: { event: { name: 'ReadMe.txt' } },
      do: [{ notify: { title: 'ReadMe', body: '你打开了它！' } }],
    },
  ],
};

<WindowsXP scenario={scenario} autoLogin />;
```

一个触发器包含三个部分：

- `on` —— 要监听的事件（这里是文件被打开）。
- `when` —— 可选条件（这里是文件名必须是 `ReadMe.txt`）。
- `do` —— 要执行的动作列表。

## 更完整的示例

熟悉基本结构后，你可以组合 flags、条件和多个动作来构建一个谜题段落：

```jsx
import { WindowsXP } from '@caoergou/windows-xp';

const scenario = {
  id: 'prologue-v1',
  initialFlags: { readLog: false },
  triggers: [
    {
      id: 'read-chat-log',
      on: 'file:open',
      when: { event: { name: '聊天记录.txt' } },
      once: true,
      do: [
        { setFlag: 'readLog', value: true },
        { unlock: ['我的电脑', '本地磁盘 (C:)', 'WINDOWS'] },
        { qqOnline: 'crystal' }, // 让 QQ 好友 crystal 上线（需配合 QQ 文化包）
      ],
    },
  ],
};

<WindowsXP scenario={scenario} autoLogin />;
```

进度（flags、有限的事件日志、每个触发器的触发次数、待执行的延迟 `after` 动作）会按实例持久化，并在 `scenario.id` 变化时重置；flags 会保存到快照的 `flags` 字段中。完整 schema 参考 —— 包括所有条件和动作、`once`/`max` 语义、`happened`/`count` 谓词、延迟动作，以及一个完整示例 —— 见 [`docs/SCENARIOS.md`](https://github.com/caoergou/windows-xp/blob/main/docs/SCENARIOS.md)。

## 场景 DevTools

`onEvent={console.log}` 已经能告诉你*发生*了什么 —— 因此这个面板不会重复输出事件流。它显示的是普通事件流不会输出的两类内部状态：**触发器为什么没触发**，以及当前的 flags。设置 `devtools` 即可挂载一个 XP 风格的浮层：

```tsx
<WindowsXP scenario={scenario} devtools autoLogin />
```

两个标签页：

- **Triggers** —— 针对最近一个事件，列出每个已注册触发器的结果：`fired`（已触发）、`no match`（事件类型不匹配 `on`），或跳过原因。当触发器匹配但 `when` 为 false 时，条件树会标注 ✓/✗，让**具体为假的谓词**一目了然（例如 `✗ flag door_open (undefined) is truthy` —— 运行时只计算一个布尔值，否则这个现象是不可见的）。
- **Flags** —— 每个当前 flag 的值，以及*最后是谁修改了它*（哪个事件 → 哪个触发器）。

它读取运行时发布的 trace，是可选功能，并且会在生产构建中被打包工具自动移除（tree-shake）（只要从不设置 `devtools`）。高级宿主也可以自行挂载 `<DevToolsPanel/>`，或订阅 `subscribeTrace(prefix, …)` 来接入自己的控制台日志或 UI：

```tsx
import { DevToolsPanel, subscribeTrace } from '@caoergou/windows-xp';
```
