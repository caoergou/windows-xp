[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / TrayProvider

# Variable: TrayProvider

&gt; `const` **TrayProvider**: `React.FC`\&lt;\{ `children`: `React.ReactNode`; \}\&gt;

Defined in: src/context/TrayContext.tsx:210

TrayProvider — System tray icon registry + notification balloons (#118).

Tray icons: any component calls useTray() to register icons:
const { register, unregister, update } = useTray();
useEffect(() =&gt; {
register('my-app', { icon: 'folder', tooltip: 'My App', order: 30 });
return () =&gt; unregister('my-app');
}, [register, unregister]);

Notifications: `notify({ icon, title, body, timeout, onClick })` pops an XP
balloon above the taskbar (one at a time, queued).
