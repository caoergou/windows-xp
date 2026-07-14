[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [components](/windows-xp/docs/zh/api/components/index.md) / XPMenuBar

# Variable: XPMenuBar

&gt; `const` **XPMenuBar**: `IStyledComponentBase`\&lt;`"web"`, `FastOmit`\&lt;`DetailedHTMLProps`\&lt;`HTMLAttributes`\&lt;`HTMLDivElement`\&gt;, `HTMLDivElement`\&gt;, `never`\&gt;\&gt; & `string`

Defined in: src/components/XPMenuBar.tsx:17

Shared Windows XP menu-bar primitives (#99 / #78).

Before this existed, Notepad, Minesweeper and Solitaire each hand-rolled a
menu bar with different backgrounds (`#f0f0f0` gradient / `#ece9d8` /
`#d4d0c8`) and highlight colors (`#316AC5` / `#0a246a` / `#0a2463`), so the
same UI element looked different in every window. These are the single
source of truth, matching real XP Luna: the bar shares the window surface
color, and the open/hover highlight is the system Highlight color.

Values sourced from FIDELITY.md §K.1 (surface `#ECE9D8`, highlight
`#316AC5`). Menu bars carry no hard bottom divider in XP.
