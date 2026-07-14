---
title: "函数：defineApp()"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [registry](/windows-xp/docs/zh/api/registry/index.md) / defineApp

# 函数：defineApp()

&gt; **defineApp**\&lt;`TProps`\&gt;(`config`): [`AppRegistryEntry`](/windows-xp/docs/zh/api/index/interfaces/AppRegistryEntry.md)\&lt;`TProps`\&gt;

定义于：src/registry/defineApp.tsx:98

通过一次类型化调用定义一个桌面应用程序。

## 类型参数

### TProps

`TProps` _extends_ [`SerializableProps`](/windows-xp/docs/zh/api/registry/type-aliases/SerializableProps.md) = `Record`\&lt;`string`, `never`\&gt;

## 参数

### config

[`DefineAppConfig`](/windows-xp/docs/zh/api/registry/interfaces/DefineAppConfig.md)\&lt;`TProps`\&gt;

## 返回值

[`AppRegistryEntry`](/windows-xp/docs/zh/api/index/interfaces/AppRegistryEntry.md)\&lt;`TProps`\&gt;

## 示例

```tsx
const HelloApp = defineApp({
  id: 'Hello',
  name: 'Hello',
  component: () => <div>Hello from Windows XP!</div>,
});
// <WindowsXP apps={[HelloApp]} />
```
