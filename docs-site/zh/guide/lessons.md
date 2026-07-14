---
title: 引导式教程
---

# 引导式教程

用教程（lesson）一步一步教用户如何使用桌面。教程是一种线性、事件驱动的引导流程：每一步都等待一个真实事件（打开记事本、点击开始菜单），而不是点击“下一步”按钮，因此进度是由学习者实际做了什么来验证的。

## Hello world 教程

```jsx
import { useRef } from 'react';
import { WindowsXP, defineLesson } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';
import type { XPHandle } from '@caoergou/windows-xp';

const myLesson = defineLesson({
  id: 'open-start-menu', // 自定义字符串，需与 startLesson('open-start-menu') 一致
  title: '打开开始菜单',
  steps: [
    {
      instruction: '点击开始按钮',
      anchor: 'start-button',
      expect: { on: 'startmenu:open' },
    },
  ],
});

export default function App() {
  const xp = useRef<XPHandle>(null);
  return (
    <>
      <WindowsXP ref={xp} lessons={[myLesson]} autoLogin />
      <button onClick={() => xp.current?.startLesson('open-start-menu', 'try')}>
        开始教程
      </button>
    </>
  );
}
```

一个步骤至少包含三个必填字段：

- `instruction` —— 显示给学习者的文字。
- `anchor` —— 要高亮的 UI 元素（见下文[锚点](#锚点)）。
- `expect` —— 证明步骤完成的事件。

可选字段包括 `hints`（提示阶梯）、`onWrongAction`（错误动作反馈）、`demonstrate`（演示模式动作）等。

## 模式

教程可以运行在三种模式下：

- `try` —— 引导练习。提供提示；正确事件触发后步骤推进，错误动作只会触发反馈而不会让教程失败。
- `do` —— 评分考核。学习者必须正确完成每一步；最终分数和完成状态会以 `lesson:*` 事件发出。
- `watch` —— 演示。引擎自动播放步骤，学习者可以先观察再尝试。

## 锚点

锚点告诉教程引擎要高亮哪个 UI 元素。常用锚点：

| 锚点           | 元素               |
| -------------- | ------------------ |
| `start-button` | 任务栏上的开始按钮 |
| `desktop`      | 桌面背景           |
| `taskbar`      | 任务栏             |

如果你开发自定义应用，可以在组件内的元素上添加 `data-xp-anchor` 属性来暴露自己的锚点。

## 内置示例教程

包导出了一个小的示例教程，可以直接放进去体验：

```jsx
import { notepadBasicsLesson } from '@caoergou/windows-xp';

function App() {
  return <WindowsXP lessons={[notepadBasicsLesson]} autoLogin />;
}
```

## 事件与持久化

进度会按实例持久化（`lesson_progress`），刷新后可恢复；调用 `stopLesson()` 会清除保存的进度。`lesson:*` 事件会通过 `onEvent` 流出（可以映射到 xAPI 供 LMS 使用）。教程文本（`instruction`、`hint` 等）可以直接写字符串，也可以是 i18n key，会按当前语言解析。
