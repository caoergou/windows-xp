[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [theme](/windows-xp/docs/zh/api/theme/index.md) / OSTheme

# Interface: OSTheme

Defined in: src/themes/contract.ts:44

A complete OS theme: the contract a new theme (Win7 / macOS / custom) fills.

## Properties

### assets

&gt; **assets**: [`ThemeAssets`](/windows-xp/docs/zh/api/theme/interfaces/ThemeAssets.md)

Defined in: src/themes/contract.ts:50

---

### chrome?

&gt; `optional` **chrome?**: `Partial`\&lt;[`ChromeSlots`](/windows-xp/docs/zh/api/theme/type-aliases/ChromeSlots.md)\&gt;

Defined in: src/themes/contract.ts:53

Optional chrome slot map — the deferred seam (see above).

---

### id

&gt; **id**: `string`

Defined in: src/themes/contract.ts:46

Stable id, e.g. `'xp'`.

---

### name

&gt; **name**: `string`

Defined in: src/themes/contract.ts:48

Human-facing name, e.g. `'Windows XP (Luna)'`.

---

### styles

&gt; **styles**: [`ThemeStyles`](/windows-xp/docs/zh/api/theme/interfaces/ThemeStyles.md)

Defined in: src/themes/contract.ts:51

---

### tokens

&gt; **tokens**: `object`

Defined in: src/themes/contract.ts:49

#### BLACK

&gt; **BLACK**: `string` = `'#000000'`

#### BORDER_GREY

&gt; **BORDER_GREY**: `string` = `'#919B9C'`

#### BORDER_GREY_HILIGHT

&gt; **BORDER_GREY_HILIGHT**: `string` = `'#D4D0C8'`

#### BUTTON_ACTIVE_GRADIENT

&gt; **BUTTON_ACTIVE_GRADIENT**: `string` = `'linear-gradient(180deg, #CDCAC3 0%, #E3E3DB 8%, #E5E5DE 94%, #F2F2F1 100%)'`

#### BUTTON_BORDER

&gt; **BUTTON_BORDER**: `string` = `'#003C74'`

#### BUTTON_FACE

&gt; **BUTTON_FACE**: `string` = `'#DFDFDF'`

#### BUTTON_FOCUS_SHADOW

&gt; **BUTTON_FOCUS_SHADOW**: `string` = `'inset -1px 1px #CEE7FF, inset 1px 2px #98B8EA, inset -2px 2px #BCD4F6, inset 1px -1px #89ADE4, inset 2px -2px #89ADE4'`

#### BUTTON_GRADIENT

&gt; **BUTTON_GRADIENT**: `string` = `'linear-gradient(180deg, #FFFFFF 0%, #ECEBE5 86%, #D8D0C4 100%)'`

#### BUTTON_HIGHLIGHT

&gt; **BUTTON_HIGHLIGHT**: `string` = `'#FFFFFF'`

#### BUTTON_HOVER_SHADOW

&gt; **BUTTON_HOVER_SHADOW**: `string` = `'inset -1px 1px #FFF0CF, inset 1px 2px #FDD889, inset -2px 2px #FBC761, inset 2px -2px #E5A01A'`

#### BUTTON_SHADOW

&gt; **BUTTON_SHADOW**: `string` = `'#808080'`

#### DESKTOP_BACKGROUND

&gt; **DESKTOP_BACKGROUND**: `string` = `'#004E98'`

#### DIALOG_BLUE

&gt; **DIALOG_BLUE**: `string` = `'#2267CB'`

#### DIVIDER_GREY

&gt; **DIVIDER_GREY**: `string` = `'#ACA899'`

#### INPUT_BORDER

&gt; **INPUT_BORDER**: `string` = `'#789DBC'`

#### MENU_HIGHLIGHT

&gt; **MENU_HIGHLIGHT**: `string` = `'#316AC5'`

#### MENU_ITEM_HEIGHT

&gt; **MENU_ITEM_HEIGHT**: `number` = `22`

#### PERF_GRAPH_GRID

&gt; **PERF_GRAPH_GRID**: `string` = `'#008000'`

#### PERF_GRAPH_LINE

&gt; **PERF_GRAPH_LINE**: `string` = `'#00FF00'`

#### SCROLLBAR_BG

&gt; **SCROLLBAR_BG**: `string` = `'linear-gradient(90deg, #C5D5FF 0%, #B5D3FF 86%, #B6CAF7 100%)'`

#### SCROLLBAR_SHADOW

&gt; **SCROLLBAR_SHADOW**: `string` = `'inset 1px 1px white, inset -1px -1px white, inset 2px 2px #B9CDFA, inset -2px -2px #B6C9F7'`

#### SURFACE

&gt; **SURFACE**: `string` = `'#ECE9D8'`

#### TASKBAR_HEIGHT

&gt; **TASKBAR_HEIGHT**: `number` = `30`

#### TITLE_BAR_GRADIENT

&gt; **TITLE_BAR_GRADIENT**: `string` = `'linear-gradient(180deg, #0997FF 0%, #0053EE 8%, #0050EE 40%, #0066FF 88%, #0066FF 93%, #005BFF 95%, #003DD7 96%, #003DD7 100%)'`

#### TITLE_BAR_HEIGHT

&gt; **TITLE_BAR_HEIGHT**: `number` = `25`

#### WINDOW_FRAME

&gt; **WINDOW_FRAME**: `string` = `'#0A0A0A'`

#### WINDOW_TITLE_ACTIVE

&gt; **WINDOW_TITLE_ACTIVE**: `string` = `'linear-gradient(to bottom,#0058ee 0%,#3593ff 4%,#288eff 6%,#127dff 8%,#036ffc 10%,#0262ee 14%,#0057e5 20%,#0054e3 24%,#0055eb 56%,#005bf5 66%,#026afe 76%,#0062ef 86%,#0052d6 92%,#0040ab 94%,#003092 100%)'`

#### WINDOW_TITLE_INACTIVE

&gt; **WINDOW_TITLE_INACTIVE**: `string` = `'linear-gradient(to bottom, #7697e7 0%,#7e9ee3 3%,#94afe8 6%,#97b4e9 8%,#82a5e4 14%,#7c9fe2 17%,#7996de 25%,#7b99e1 56%,#82a9e9 81%,#80a5e7 89%,#7b96e1 94%,#7a93df 97%,#abbae3 100%)'`
