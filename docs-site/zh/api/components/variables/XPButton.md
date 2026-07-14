[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [components](/windows-xp/docs/zh/api/components/index.md) / XPButton

# Variable: XPButton

&gt; `const` **XPButton**: `IStyledComponentBase`\&lt;`"web"`, `Substitute`\&lt;`DetailedHTMLProps`\&lt;`ButtonHTMLAttributes`\&lt;`HTMLButtonElement`\&gt;, `HTMLButtonElement`\&gt;, \{ `$default?`: `boolean`; \}\&gt;\&gt; & `string`

Defined in: src/components/XPButton.tsx:16

Canonical Luna push button (#99 / #78), value-for-value identical to the
xp.css `button` rules so hand-rolled buttons and xp.css-styled native
buttons look the same everywhere:

border: 1px solid #003c74; radius 3px;
face: linear-gradient(180deg, #fff, #ecebe5 86%, #d8d0c4);
hover: orange inner glow; active: pressed gradient;
focus: 1px dotted outline inset.

Previously XPAlert, XPConfirm, PasswordDialog and XPInput each duplicated
a flat #ECE9D8 button that matched neither xp.css nor each other.
