[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [registry](/windows-xp/docs/zh/api/registry/index.md) / APP_REGISTRY

# Variable: APP_REGISTRY

&gt; `const` **APP_REGISTRY**: `Record`\&lt;`string`, [`AppRegistryEntry`](/windows-xp/docs/zh/api/index/interfaces/AppRegistryEntry.md)\&gt;

Defined in: src/registry/apps.tsx:126

APP_REGISTRY - the single registry for all openable apps.

Field description for each record:
id - unique app identifier (same as the registry key)
name - display name
icon - default window icon (XPIcon key or data: URL)
window - default window configuration
.width / .height - initial size
.singleton - when true, only one instance is allowed globally; reopening focuses the existing window
lifecycle - lifecycle callbacks, receiving (windowId)
.onOpen(id) - after the window is created
.onClose(id) - before the window is closed
.onFocus(id) - when the window gains focus
associations - file associations (used automatically when node.app in filesystem.json matches)
.appField - matches the node.app field value
.getProps(item) - converts a filesystem node into component props
restore(props) - reconstructs JSX from saved componentProps (used during localStorage restore)
