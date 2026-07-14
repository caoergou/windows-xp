[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [components](/windows-xp/docs/zh/api/components/index.md) / XPStatusBar

# Variable: XPStatusBar

&gt; `const` **XPStatusBar**: `IStyledComponentBase`\&lt;`"web"`, `FastOmit`\&lt;`DetailedHTMLProps`\&lt;`HTMLAttributes`\&lt;`HTMLDivElement`\&gt;, `HTMLDivElement`\&gt;, `never`\&gt;\&gt; & `string`

Defined in: src/components/XPStatusBar.tsx:14

XP status bar (#78): a row of sunken fields, value-for-value from xp.css's
`.status-bar` / `.status-bar-field`.

```tsx
<XPStatusBar>
  <XPStatusBarField>Ready</XPStatusBarField>
  <XPStatusBarField>CPU: 3%</XPStatusBarField>
</XPStatusBar>
```
