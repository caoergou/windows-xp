[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [components](/windows-xp/docs/zh/api/components/index.md) / XPTextInput

# Variable: XPTextInput

&gt; `const` **XPTextInput**: `IStyledComponentBase`\&lt;`"web"`, `FastOmit`\&lt;`DetailedHTMLProps`\&lt;`InputHTMLAttributes`\&lt;`HTMLInputElement`\&gt;, `HTMLInputElement`\&gt;, `never`\&gt;\&gt; & `string`

Defined in: src/components/XPTextInput.tsx:17

Canonical Luna text input (#99 / #78), matching xp.css's
`input[type=text|password|email]` rules value-for-value:

border: 1px solid #7f9db9; background: #fff; border-radius: 0;
padding: 3px 4px; height: 23px; box-sizing: border-box.

xp.css removes the focus outline entirely (`outline: none`) — real XP
text boxes show no color change on focus, only the blinking caret.

Previously XPInput, PasswordDialog and RunDialog each hand-rolled a
slightly different sunken input (different padding/height, and
PasswordDialog invented a blue focus outline with no XP precedent).
