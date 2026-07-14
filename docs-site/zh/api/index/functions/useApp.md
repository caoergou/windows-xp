---
title: "函数：useApp()"
---

[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / useApp

# 函数：useApp()

&gt; **useApp**(`windowId?`): `object`

定义于：src/hooks/useApp.ts:23

useApp(windowId) —— App 组件与系统交互的唯一入口。

在 Window.jsx 通过 cloneElement 注入 windowId 后，App 组件只需调用此钩子，
而无需直接导入任何 Context。

用法：
function MyApp({ windowId, ...props }) {
const api = useApp(windowId);
await api.dialog.alert({ title: 'Tip', message: 'Hello' });
}

## 参数

### windowId?

`string`

## 返回值

`object`

### dialog

&gt; **dialog**: `object` = `modalRef.current.dialog`

#### dialog.alert

&gt; **alert**: (`opts`) =&gt; `Promise`\&lt;`void`\&gt;

##### 参数

###### opts

###### message

`string`

###### title

`string`

###### type?

`"info"` \| `"warning"` \| `"error"`

##### 返回值

`Promise`\&lt;`void`\&gt;

#### dialog.confirm

&gt; **confirm**: (`opts`) =&gt; `Promise`\&lt;`boolean`\&gt;

##### 参数

###### opts

###### cancelLabel?

`string`

###### confirmLabel?

`string`

###### message

`string`

###### title

`string`

###### type?

`"info"` \| `"warning"` \| `"error"` \| `"question"`

##### 返回值

`Promise`\&lt;`boolean`\&gt;

#### dialog.password

&gt; **password**: (`opts`) =&gt; `Promise`\&lt;`boolean`\&gt;

##### 参数

###### opts

###### correctPassword

`string`

###### hint?

`string`

###### message

`string`

###### onFail?

() =&gt; `void`

###### title

`string`

##### 返回值

`Promise`\&lt;`boolean`\&gt;

#### dialog.prompt

&gt; **prompt**: (`opts`) =&gt; `Promise`\&lt;`string` \| `null`\&gt;

##### 参数

###### opts

###### defaultValue?

`string`

###### message

`string`

###### title

`string`

##### 返回值

`Promise`\&lt;`string` \| `null`\&gt;

### fs

&gt; **fs**: `object`

#### fs.checkAccess

&gt; **checkAccess**: (`node`, `passwordInput`) =&gt; `boolean` = `fileSystemRef.current.checkAccess`

##### 参数

###### node

[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)

###### passwordInput

`string`

##### 返回值

`boolean`

#### fs.createFile

&gt; **createFile**: (`path`, `node`) =&gt; `void`

##### 参数

###### path

`string`[]

###### node?

`Partial`\&lt;[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)\&gt; = `{}`

##### 返回值

`void`

#### fs.deleteFile

&gt; **deleteFile**: (`path`) =&gt; `void`

##### 参数

###### path

`string`[]

##### 返回值

`void`

#### fs.readDir

&gt; **readDir**: (`path`) =&gt; `Record`\&lt;`string`, [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)\&gt; \| `null`

##### 参数

###### path

`string`[]

##### 返回值

`Record`\&lt;`string`, [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md)\&gt; \| `null`

#### fs.readFile

&gt; **readFile**: (`path`) =&gt; [`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md) \| `null`

##### 参数

###### path

`string`[]

##### 返回值

[`FileNode`](/windows-xp/docs/zh/api/index/type-aliases/FileNode.md) \| `null`

#### fs.writeFile

&gt; **writeFile**: (`path`, `content`) =&gt; `void`

##### 参数

###### path

`string`[]

###### content

`string`

##### 返回值

`void`

### openWindow

&gt; **openWindow**: (...`args`) =&gt; `string`

#### 参数

##### args

...\[`string`, `string`, `ReactNode`, `string`, [`WindowProps`](/windows-xp/docs/zh/api/index/interfaces/WindowProps.md)\]

#### 返回值

`string`

### session

&gt; **session**: `object`

#### session.logout

&gt; **logout**: () =&gt; `void`

##### 返回值

`void`

#### session.user

&gt; **user**: `string` = `userSessionRef.current.user.name`

### sound

&gt; **sound**: `object`

#### sound.play

&gt; **play**: (`name`) =&gt; `void` \| `undefined`

##### 参数

###### name

`string`

##### 返回值

`void` \| `undefined`

### tray

&gt; **tray**: `object`

#### tray.register

&gt; **register**: (`config`) =&gt; `void`

##### 参数

###### config

`Omit`\&lt;[`TrayItem`](/windows-xp/docs/zh/api/index/interfaces/TrayItem.md), `"id"`\&gt;

##### 返回值

`void`

#### tray.unregister

&gt; **unregister**: () =&gt; `void`

##### 返回值

`void`

#### tray.update

&gt; **update**: (`updates`) =&gt; `void`

##### 参数

###### updates

`Partial`\&lt;`Omit`\&lt;[`TrayItem`](/windows-xp/docs/zh/api/index/interfaces/TrayItem.md), `"id"`\&gt;\&gt;

##### 返回值

`void`

### window

&gt; **window**: `object`

#### window.close

&gt; **close**: () =&gt; `void`

##### 返回值

`void`

#### window.flash

&gt; **flash**: () =&gt; `void`

##### 返回值

`void`

#### window.hide

&gt; **hide**: () =&gt; `void`

##### 返回值

`void`

#### window.id

&gt; **id**: `string` = `resolvedWindowId`

#### window.maximize

&gt; **maximize**: () =&gt; `void`

##### 返回值

`void`

#### window.minimize

&gt; **minimize**: () =&gt; `void`

##### 返回值

`void`

#### window.move

&gt; **move**: (`left`, `top`) =&gt; `void`

##### 参数

###### left

`number`

###### top

`number`

##### 返回值

`void`

#### window.resize

&gt; **resize**: (`width`, `height`) =&gt; `void`

##### 参数

###### width

`number`

###### height

`number`

##### 返回值

`void`

#### window.setBadge

&gt; **setBadge**: (`value`) =&gt; `void`

##### 参数

###### value

`string` \| `number` \| `null`

##### 返回值

`void`

#### window.setCloseGuard

&gt; **setCloseGuard**: (`guard`) =&gt; `void`

##### 参数

###### guard

((`forceClose`) =&gt; `void`) \| `null`

##### 返回值

`void`

#### window.setMinimizeGuard

&gt; **setMinimizeGuard**: (`guard`) =&gt; `void`

##### 参数

###### guard

((`defaultMinimize`) =&gt; `void`) \| `null`

##### 返回值

`void`

#### window.setProgress

&gt; **setProgress**: (`pct`) =&gt; `void`

##### 参数

###### pct

`number` \| `null`

##### 返回值

`void`

#### window.setTitle

&gt; **setTitle**: (`title`) =&gt; `void`

##### 参数

###### title

`string`

##### 返回值

`void`
