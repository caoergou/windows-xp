[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [components](/windows-xp/docs/zh/api/components/index.md) / ErrorBoundary

# Class: ErrorBoundary

Defined in: src/components/ErrorBoundary.tsx:75

Application error boundary component.
Catches errors in child components to prevent the whole desktop from crashing.

## Extends

- `Component`\&lt;`ErrorBoundaryProps`, `ErrorBoundaryState`\&gt;

## Constructors

### Constructor

&gt; **new ErrorBoundary**(`props`): `ErrorBoundary`

Defined in: src/components/ErrorBoundary.tsx:76

#### Parameters

##### props

`ErrorBoundaryProps`

#### Returns

`ErrorBoundary`

#### Overrides

`Component<ErrorBoundaryProps, ErrorBoundaryState>.constructor`

## Properties

### context

&gt; **context**: `unknown`

Defined in: node_modules/@types/react/index.d.ts:1014

If using the new style context, re-declare this in your class to be the
`React.ContextType` of your `static contextType`.
Should be used with type annotation or static contextType.

#### Example

```ts
static contextType = MyContext
// For TS pre-3.7:
context!: React.ContextType<typeof MyContext>
// For TS 3.7 and above:
declare context: React.ContextType<typeof MyContext>
```

#### See

[React Docs](https://react.dev/reference/react/Component#context)

#### Inherited from

`Component.context`

---

### props

&gt; `readonly` **props**: `Readonly`\&lt;`P`\&gt;

Defined in: node_modules/@types/react/index.d.ts:1034

#### Inherited from

`Component.props`

---

### ~~refs~~

&gt; **refs**: `object`

Defined in: node_modules/@types/react/index.d.ts:1041

#### Index Signature

\[`key`: `string`\]: `ReactInstance`

#### Deprecated

#### See

[Legacy React Docs](https://legacy.reactjs.org/docs/refs-and-the-dom.html#legacy-api-string-refs)

#### Inherited from

`Component.refs`

---

### state

&gt; **state**: `Readonly`\&lt;`S`\&gt;

Defined in: node_modules/@types/react/index.d.ts:1035

#### Inherited from

`Component.state`

---

### contextType?

&gt; `static` `optional` **contextType?**: `Context`\&lt;`any`\&gt;

Defined in: node_modules/@types/react/index.d.ts:996

If set, `this.context` will be set at runtime to the current value of the given Context.

#### Example

```ts
type MyContext = number
const Ctx = React.createContext<MyContext>(0)

class Foo extends React.Component {
  static contextType = Ctx
  context!: React.ContextType<typeof Ctx>
  render () {
    return <>My context's value: {this.context}</>;
  }
}
```

#### See

[https://react.dev/reference/react/Component#static-contexttype](https://react.dev/reference/react/Component#static-contexttype)

#### Inherited from

`Component.contextType`

## Methods

### componentDidCatch()

&gt; **componentDidCatch**(`error`, `errorInfo`): `void`

Defined in: src/components/ErrorBoundary.tsx:89

Catches exceptions generated in descendant components. Unhandled exceptions will cause
the entire component tree to unmount.

#### Parameters

##### error

`Error`

##### errorInfo

`ErrorInfo`

#### Returns

`void`

#### Overrides

`Component.componentDidCatch`

---

### componentDidMount()?

&gt; `optional` **componentDidMount**(): `void`

Defined in: node_modules/@types/react/index.d.ts:1377

Called immediately after a component is mounted. Setting state here will trigger re-rendering.

#### Returns

`void`

#### Inherited from

`Component.componentDidMount`

---

### componentDidUpdate()?

&gt; `optional` **componentDidUpdate**(`prevProps`, `prevState`, `snapshot?`): `void`

Defined in: node_modules/@types/react/index.d.ts:1440

Called immediately after updating occurs. Not called for the initial render.

The snapshot is only present if [getSnapshotBeforeUpdate](/windows-xp/docs/zh/api/components/classes/ErrorBoundary.md#getsnapshotbeforeupdate) is present and returns non-null.

#### Parameters

##### prevProps

`Readonly`\&lt;`P`\&gt;

##### prevState

`Readonly`\&lt;`S`\&gt;

##### snapshot?

`any`

#### Returns

`void`

#### Inherited from

`Component.componentDidUpdate`

---

### ~~componentWillMount()?~~

&gt; `optional` **componentWillMount**(): `void`

Defined in: node_modules/@types/react/index.d.ts:1456

Called immediately before mounting occurs, and before Component.render.
Avoid introducing any side-effects or subscriptions in this method.

Note: the presence of NewLifecycle.getSnapshotBeforeUpdate getSnapshotBeforeUpdate
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Returns

`void`

#### Deprecated

16.3, use ComponentLifecycle.componentDidMount componentDidMount or the constructor instead; will stop working in React 17

#### See

- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state)
- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.componentWillMount`

---

### ~~componentWillReceiveProps()?~~

&gt; `optional` **componentWillReceiveProps**(`nextProps`, `nextContext`): `void`

Defined in: node_modules/@types/react/index.d.ts:1487

Called when the component may be receiving new props.
React may call this even if props have not changed, so be sure to compare new and existing
props if you only want to handle changes.

Calling Component.setState generally does not trigger this method.

Note: the presence of NewLifecycle.getSnapshotBeforeUpdate getSnapshotBeforeUpdate
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Parameters

##### nextProps

`Readonly`\&lt;`P`\&gt;

##### nextContext

`any`

#### Returns

`void`

#### Deprecated

16.3, use static StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps instead; will stop working in React 17

#### See

- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props)
- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.componentWillReceiveProps`

---

### componentWillUnmount()?

&gt; `optional` **componentWillUnmount**(): `void`

Defined in: node_modules/@types/react/index.d.ts:1393

Called immediately before a component is destroyed. Perform any necessary cleanup in this method, such as
cancelled network requests, or cleaning up any DOM elements created in `componentDidMount`.

#### Returns

`void`

#### Inherited from

`Component.componentWillUnmount`

---

### ~~componentWillUpdate()?~~

&gt; `optional` **componentWillUpdate**(`nextProps`, `nextState`, `nextContext`): `void`

Defined in: node_modules/@types/react/index.d.ts:1519

Called immediately before rendering when new props or state is received. Not called for the initial render.

Note: You cannot call Component.setState here.

Note: the presence of NewLifecycle.getSnapshotBeforeUpdate getSnapshotBeforeUpdate
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Parameters

##### nextProps

`Readonly`\&lt;`P`\&gt;

##### nextState

`Readonly`\&lt;`S`\&gt;

##### nextContext

`any`

#### Returns

`void`

#### Deprecated

16.3, use getSnapshotBeforeUpdate instead; will stop working in React 17

#### See

- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update)
- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.componentWillUpdate`

---

### forceUpdate()

&gt; **forceUpdate**(`callback?`): `void`

Defined in: node_modules/@types/react/index.d.ts:1031

#### Parameters

##### callback?

() =&gt; `void`

#### Returns

`void`

#### Inherited from

`Component.forceUpdate`

---

### getSnapshotBeforeUpdate()?

&gt; `optional` **getSnapshotBeforeUpdate**(`prevProps`, `prevState`): `any`

Defined in: node_modules/@types/react/index.d.ts:1434

Runs before React applies the result of Component.render render to the document, and
returns an object to be given to [componentDidUpdate](/windows-xp/docs/zh/api/components/classes/ErrorBoundary.md#componentdidupdate). Useful for saving
things such as scroll position before Component.render render causes changes to it.

Note: the presence of this method prevents any of the deprecated
lifecycle events from running.

#### Parameters

##### prevProps

`Readonly`\&lt;`P`\&gt;

##### prevState

`Readonly`\&lt;`S`\&gt;

#### Returns

`any`

#### Inherited from

`Component.getSnapshotBeforeUpdate`

---

### handleReset()

&gt; **handleReset**(): `void`

Defined in: src/components/ErrorBoundary.tsx:127

#### Returns

`void`

---

### render()

&gt; **render**(): `ReactNode`

Defined in: src/components/ErrorBoundary.tsx:135

#### Returns

`ReactNode`

#### Overrides

`Component.render`

---

### setState()

&gt; **setState**\&lt;`K`\&gt;(`state`, `callback?`): `void`

Defined in: node_modules/@types/react/index.d.ts:1026

#### Type Parameters

##### K

`K` _extends_ keyof `ErrorBoundaryState`

#### Parameters

##### state

`ErrorBoundaryState` \| ((`prevState`, `props`) =&gt; `ErrorBoundaryState` \| `Pick`\&lt;`ErrorBoundaryState`, `K`\&gt; \| `null`) \| `Pick`\&lt;`ErrorBoundaryState`, `K`\&gt; \| `null`

##### callback?

() =&gt; `void`

#### Returns

`void`

#### Inherited from

`Component.setState`

---

### shouldComponentUpdate()?

&gt; `optional` **shouldComponentUpdate**(`nextProps`, `nextState`, `nextContext`): `boolean`

Defined in: node_modules/@types/react/index.d.ts:1388

Called to determine whether the change in props and state should trigger a re-render.

`Component` always returns true.
`PureComponent` implements a shallow comparison on props and state and returns true if any
props or states have changed.

If false is returned, Component.render, `componentWillUpdate`
and `componentDidUpdate` will not be called.

#### Parameters

##### nextProps

`Readonly`\&lt;`P`\&gt;

##### nextState

`Readonly`\&lt;`S`\&gt;

##### nextContext

`any`

#### Returns

`boolean`

#### Inherited from

`Component.shouldComponentUpdate`

---

### ~~UNSAFE_componentWillMount()?~~

&gt; `optional` **UNSAFE_componentWillMount**(): `void`

Defined in: node_modules/@types/react/index.d.ts:1471

Called immediately before mounting occurs, and before Component.render.
Avoid introducing any side-effects or subscriptions in this method.

This method will not stop working in React 17.

Note: the presence of NewLifecycle.getSnapshotBeforeUpdate getSnapshotBeforeUpdate
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Returns

`void`

#### Deprecated

16.3, use ComponentLifecycle.componentDidMount componentDidMount or the constructor instead

#### See

- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state)
- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.UNSAFE_componentWillMount`

---

### ~~UNSAFE_componentWillReceiveProps()?~~

&gt; `optional` **UNSAFE_componentWillReceiveProps**(`nextProps`, `nextContext`): `void`

Defined in: node_modules/@types/react/index.d.ts:1505

Called when the component may be receiving new props.
React may call this even if props have not changed, so be sure to compare new and existing
props if you only want to handle changes.

Calling Component.setState generally does not trigger this method.

This method will not stop working in React 17.

Note: the presence of NewLifecycle.getSnapshotBeforeUpdate getSnapshotBeforeUpdate
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Parameters

##### nextProps

`Readonly`\&lt;`P`\&gt;

##### nextContext

`any`

#### Returns

`void`

#### Deprecated

16.3, use static StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps instead

#### See

- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props)
- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.UNSAFE_componentWillReceiveProps`

---

### ~~UNSAFE_componentWillUpdate()?~~

&gt; `optional` **UNSAFE_componentWillUpdate**(`nextProps`, `nextState`, `nextContext`): `void`

Defined in: node_modules/@types/react/index.d.ts:1535

Called immediately before rendering when new props or state is received. Not called for the initial render.

Note: You cannot call Component.setState here.

This method will not stop working in React 17.

Note: the presence of NewLifecycle.getSnapshotBeforeUpdate getSnapshotBeforeUpdate
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Parameters

##### nextProps

`Readonly`\&lt;`P`\&gt;

##### nextState

`Readonly`\&lt;`S`\&gt;

##### nextContext

`any`

#### Returns

`void`

#### Deprecated

16.3, use getSnapshotBeforeUpdate instead

#### See

- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update)
- [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.UNSAFE_componentWillUpdate`

---

### getDerivedStateFromError()

&gt; `static` **getDerivedStateFromError**(`error`): `Partial`\&lt;`ErrorBoundaryState`\&gt;

Defined in: src/components/ErrorBoundary.tsx:85

#### Parameters

##### error

`Error`

#### Returns

`Partial`\&lt;`ErrorBoundaryState`\&gt;
