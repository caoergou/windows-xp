[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [theme](/windows-xp/docs/zh/api/theme/index.md) / ChromeSlots

# Type Alias: ChromeSlots

&gt; **ChromeSlots** = `Record`\&lt;`string`, `React.ComponentType`\&lt;`Record`\&lt;`string`, `unknown`\&gt;\&gt;\&gt;

Defined in: src/themes/contract.ts:41

Chrome component slots — the SHAPE a theme's window/taskbar/menu chrome fills
(#135 seam 4). Declared as the documented seam; XP wires its chrome directly
today, so populating this map is deferred until a second theme exists (a real
new theme is an explicit non-goal of #135).
