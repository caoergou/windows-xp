[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / StartupNotification

# Interface: StartupNotification

Defined in: src/data/culture/types.ts:59

Tray balloon notification that pops up automatically after boot (#118).

Replaces the previously hardcoded zh-only check in AntivirusPopup: content is supplied
by the culture package, and only culture packages configured with startupNotification
will show a balloon after login.

## Properties

### app?

&gt; `optional` **app?**: `string`

Defined in: src/data/culture/types.ts:80

App ID (APP_REGISTRY key) to open when clicking the tray icon / balloon

---

### body?

&gt; `optional` **body?**: `string`

Defined in: src/data/culture/types.ts:69

Body text given directly

---

### bodyKey?

&gt; `optional` **bodyKey?**: `string`

Defined in: src/data/culture/types.ts:67

i18n key for the body; takes precedence over body

---

### delay?

&gt; `optional` **delay?**: `number`

Defined in: src/data/culture/types.ts:71

Delay in milliseconds before popping up after login; defaults to 3000

---

### icon?

&gt; `optional` **icon?**: `string`

Defined in: src/data/culture/types.ts:61

XPIcon key

---

### timeout?

&gt; `optional` **timeout?**: `number`

Defined in: src/data/culture/types.ts:73

Balloon display duration in milliseconds; 0 means persistent

---

### title?

&gt; `optional` **title?**: `string`

Defined in: src/data/culture/types.ts:65

Title text given directly

---

### titleKey?

&gt; `optional` **titleKey?**: `string`

Defined in: src/data/culture/types.ts:63

i18n key for the title; takes precedence over title

---

### trayIcon?

&gt; `optional` **trayIcon?**: `string`

Defined in: src/data/culture/types.ts:78

Resident tray icon (XPIcon key). When set, the icon stays in the tray; the balloon tail points to it,
and clicking the icon or balloon opens [app](/windows-xp/docs/zh/api/index/interfaces/StartupNotification.md#app). Leaving it empty makes the balloon pop from the notification area (right side).
