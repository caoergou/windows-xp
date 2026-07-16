/**
 * Windows XP (Luna) design tokens — the colour/gradient/dimension values that
 * give the XP theme its look (#135).
 *
 * This is the XP implementation of a theme's token set. It lives under
 * `src/themes/xp/` (the theme layer) rather than the engine so a future theme
 * can supply its own values without the engine ever importing colours. Sourced
 * from `xp.css/themes/XP/_variables.scss` and component styles.
 *
 * Re-exported from `src/constants.ts` as `COLORS` for backward compatibility —
 * existing `import { COLORS } from '.../constants'` call sites are unchanged.
 */
export const COLORS = {
  WINDOW_TITLE_ACTIVE:
    'linear-gradient(to bottom,#0058ee 0%,#3593ff 4%,#288eff 6%,#127dff 8%,#036ffc 10%,#0262ee 14%,#0057e5 20%,#0054e3 24%,#0055eb 56%,#005bf5 66%,#026afe 76%,#0062ef 86%,#0052d6 92%,#0040ab 94%,#003092 100%)',
  WINDOW_TITLE_INACTIVE:
    'linear-gradient(to bottom, #7697e7 0%,#7e9ee3 3%,#94afe8 6%,#97b4e9 8%,#82a5e4 14%,#7c9fe2 17%,#7996de 25%,#7b99e1 56%,#82a9e9 81%,#80a5e7 89%,#7b96e1 94%,#7a93df 97%,#abbae3 100%)',
  DESKTOP_BACKGROUND: '#004E98',
  TASKBAR_HEIGHT: 30,
  TITLE_BAR_HEIGHT: 25,
  MENU_ITEM_HEIGHT: 22,

  // XP Turn Off Computer panel, sampled from an 800x600 XP reference capture.
  SHUTDOWN_PANEL_DARK: '#003399',
  SHUTDOWN_PANEL_BODY: '#5A7DDE',
  SHUTDOWN_PANEL_EDGE: '#3C64B6',
  SHUTDOWN_STANDBY_TOP: '#FEC363',
  SHUTDOWN_STANDBY_BOTTOM: '#FDCA30',
  SHUTDOWN_STANDBY_BORDER: '#C07F03',
  SHUTDOWN_OVERLAY: 'rgba(0, 0, 0, 0.28)',

  // XP.css surface / chrome
  SURFACE: '#ECE9D8',
  BUTTON_HIGHLIGHT: '#FFFFFF',
  BUTTON_FACE: '#DFDFDF',
  BUTTON_SHADOW: '#808080',
  BUTTON_BORDER: '#003C74',
  WINDOW_FRAME: '#0A0A0A',
  DIALOG_BLUE: '#2267CB',
  INPUT_BORDER: '#789DBC',
  MENU_HIGHLIGHT: '#316AC5',

  // Neutral greys used by list controls, dividers and text (Luna 3D chrome).
  BLACK: '#000000',
  BORDER_GREY: '#919B9C', // control/list dark border
  DIVIDER_GREY: '#ACA899', // list column / menu separator grey

  // Task Manager "oscilloscope" graphs — green line + grid on a black panel,
  // the iconic taskmgr.exe Performance look. These are XP-skin colours and so
  // live here in the theme layer (not inline in the component).
  PERF_GRAPH_LINE: '#00FF00',
  PERF_GRAPH_GRID: '#008000',

  // XP.css button gradients
  BUTTON_GRADIENT: 'linear-gradient(180deg, #FFFFFF 0%, #ECEBE5 86%, #D8D0C4 100%)',
  BUTTON_ACTIVE_GRADIENT:
    'linear-gradient(180deg, #CDCAC3 0%, #E3E3DB 8%, #E5E5DE 94%, #F2F2F1 100%)',
  BUTTON_HOVER_SHADOW:
    'inset -1px 1px #FFF0CF, inset 1px 2px #FDD889, inset -2px 2px #FBC761, inset 2px -2px #E5A01A',
  BUTTON_FOCUS_SHADOW:
    'inset -1px 1px #CEE7FF, inset 1px 2px #98B8EA, inset -2px 2px #BCD4F6, inset 1px -1px #89ADE4, inset 2px -2px #89ADE4',

  // XP.css title-bar (from xp.css window.scss)
  TITLE_BAR_GRADIENT:
    'linear-gradient(180deg, #0997FF 0%, #0053EE 8%, #0050EE 40%, #0066FF 88%, #0066FF 93%, #005BFF 95%, #003DD7 96%, #003DD7 100%)',

  // XP.css scrollbar
  SCROLLBAR_BG: 'linear-gradient(90deg, #C5D5FF 0%, #B5D3FF 86%, #B6CAF7 100%)',
  SCROLLBAR_SHADOW:
    'inset 1px 1px white, inset -1px -1px white, inset 2px 2px #B9CDFA, inset -2px -2px #B6C9F7',

  // XP dialog / group-box greys (status dialogs, group boxes, tabs, list separators).
  // BORDER_GREY / DIVIDER_GREY already exist above; only the hilight is new.
  BORDER_GREY_HILIGHT: '#D4D0C8',

  // ── #213 batch 2: high-frequency chrome values ────────────────────────────
  /** System colour Window / white chrome foregrounds (K.1 `window.bg`). */
  WHITE: '#FFFFFF',
  /** Text-field border, xp.css `--border-field` (STY-16). */
  FIELD_BORDER: '#7F9DB9',
  /** System colour InfoWindow — tooltip/balloon background (K.1 `tooltip.bg`). */
  TOOLTIP_BG: '#FFFFE1',
  /** Disabled button border, xp.css `button:disabled`. */
  BUTTON_BORDER_DISABLED: '#C9C2B8',
  /** Explorer / IE6 toolbar strip gradient (AGENTS.md §2 chrome). */
  TOOLBAR_GRADIENT: 'linear-gradient(to right, #EDEDE5 0%, #EDE8CD 100%)',

  // ── #213 batch 3: Luna window / shell chrome ──────────────────────────────
  // Values are the exact strings the shipped components rendered with (#35
  // audit lineage); single-line forms of the multi-line originals compute to
  // identical pixels.

  // Window frame (WindowChrome.tsx).
  WINDOW_FRAME_SHADOW_ACTIVE:
    'inset -1px -1px #00138C, inset 1px 1px #0831D9, inset -2px -2px #001EA0, inset 2px 2px #166AEE, inset -3px -3px #003BDA, inset 3px 3px #0855DD',
  WINDOW_FRAME_SHADOW_INACTIVE:
    'inset -1px -1px #4F648F, inset 1px 1px #7A96DF, inset -2px -2px #5A74B9, inset 2px 2px #9AAFE5',
  WINDOW_BORDER_ACTIVE: '#0831D9',
  WINDOW_BORDER_ACTIVE_DARK: '#001EA0',
  WINDOW_BORDER_INACTIVE: '#6D86C7',
  WINDOW_BORDER_INACTIVE_DARK: '#536DA8',
  /** Blue glow the title bar fades in from its left/right edges. */
  TITLE_BAR_GLOW: '#1638E6',
  /** Compact one-line title-bar imitation (Minesweeper mini header). */
  TITLE_BAR_GRADIENT_COMPACT: 'linear-gradient(to right, #0997FF, #0053EE)',

  // Taskbar / system tray / Start button.
  TASKBAR_GRADIENT:
    'linear-gradient(to bottom, #1F2F86 0%, #3165C4 3%, #3682E5 6%, #4490E6 10%, #3883E5 12%, #2B71E0 15%, #2663DA 18%, #235BD6 20%, #2258D5 23%, #2157D6 38%, #245DDB 54%, #2562DF 86%, #245FDC 89%, #2158D4 92%, #1D4EC0 95%, #1941A5 98%)',
  TASKBAR_BORDER: '#1D4EC0',
  TRAY_GRADIENT:
    'linear-gradient(to bottom, #0C59B9 1%, #139EE9 6%, #18B5F2 10%, #139BEB 14%, #1290E8 19%, #0D8DEA 63%, #0D9FF1 81%, #0F9EED 88%, #119BE9 91%, #1392E2 94%, #137ED7 97%, #095BC9 100%)',
  TRAY_BORDER: '#1042AF',
  TRAY_HILIGHT: '#18BBFF',
  TASK_BUTTON: '#3C81F3',
  TASK_BUTTON_ACTIVE: '#1E52B7',
  TASK_BUTTON_HOVER: '#53A3FF',
  TASK_BUTTON_ACTIVE_HOVER: '#3576F3',
  TASK_BUTTON_FLASH: '#FF8C00',
  /** Localized Start button (flag + gradient) fallback colours. */
  START_GREEN: '#2DA814',
  START_GRADIENT: 'linear-gradient(to bottom, #70DA55 0%, #38B820 14%, #14920F 55%, #0D7110 100%)',
  START_GRADIENT_HOVER:
    'linear-gradient(to bottom, #87EC6C 0%, #45C52C 14%, #19A214 55%, #0F7C13 100%)',
  START_GRADIENT_ACTIVE: 'linear-gradient(to bottom, #0D7110 0%, #14920F 55%, #38B820 100%)',

  // Start menu.
  STARTMENU_HEADER_GRADIENT:
    'linear-gradient(to bottom, #1868CE 0%, #0E60CB 12%, #0E60CB 20%, #1164CF 32%, #1667CF 33%, #1B6CD3 47%, #1E70D9 54%, #2476DC 60%, #297AE0 65%, #3482E3 77%, #3786E5 79%, #428EE9 90%, #4791EB 100%)',
  STARTMENU_FOOTER_GRADIENT:
    'linear-gradient(to bottom, #4282D6 0%, #3B85E0 3%, #418AE3 5%, #418AE3 17%, #3C87E2 21%, #3786E4 26%, #3482E3 29%, #2E7EE1 39%, #2374DF 49%, #2072DB 57%, #196EDB 62%, #176BD8 72%, #1468D5 75%, #1165D2 83%, #0F61CB 88%)',
  STARTMENU_BLUE: '#4282D6',
  STARTMENU_HEADER_SHADOW: '#0E60CB',
  STARTMENU_TINT: '#99CCFF',
  STARTMENU_RIGHT_BG: '#CBE3FF',
  STARTMENU_RIGHT_BORDER: '#385DE7',
  STARTMENU_RIGHT_TEXT: '#00136B',
  STARTMENU_FOOTER_HOVER: '#2F71CD',
  STARTMENU_DIVIDER_ORANGE: '#DA884A',

  // Login screen (Welcome).
  /** Deep XP blue shared by the login backdrop, balloon titles, CP accents. */
  XP_DEEP_BLUE: '#003399',
  LOGIN_PANEL_BLUE: '#5A7EDC',
  LOGIN_DIVIDER_GOLD: '#F5C684',
  LOGIN_ORANGE: '#FF6600',
  LOGIN_GOLD: '#FFD700',
  LOGIN_GO_GRADIENT: 'linear-gradient(180deg, #37A856 0%, #2E9A4C 50%, #268F42 100%)',
  LOGIN_GO_GRADIENT_HOVER: 'linear-gradient(180deg, #268F42 0%, #2E9A4C 50%, #37A856 100%)',
  LOGIN_GO_BORDER: '#1F7A38',

  // Explorer / IE chrome.
  SIDEBAR_GRADIENT: 'linear-gradient(to bottom, #748AFF 0%, #4057D3 100%)',
  SIDEBAR_LINK: '#1C68FF',
  SIDEBAR_LINK_HOVER: '#2B72FF',
  SIDEBAR_HEADER_TEXT: '#0C327D',
  SIDEBAR_TITLE_BLUE: '#15428B',
  TASKPANE_GRADIENT: 'linear-gradient(to bottom, #FFFFFF 0%, #F2F1EA 45%, #E7E5D8 100%)',
  TASKPANE_GRADIENT_BLUE: 'linear-gradient(to bottom, #FFFFFF 0%, #EEF4FB 45%, #DCE9F8 100%)',
  TASKPANE_BORDER: '#D5D2C6',
  EXPLORER_ROW_TINT: '#E6EFFC',
  TREE_ROW_TINT: '#E8F0FB',
  /** Pale-beige hover used by the folder-tree toggle and balloon close box. */
  HOVER_BEIGE: '#E5E5C5',
  EXPLORER_HEADER_DIVIDER: '#C6D3F7',
  /** Blue page-header band shared by IE chrome pages and Help and Support. */
  HEADER_GRADIENT_BLUE: 'linear-gradient(to right, #6BA3E5, #3F78BD)',
  LINK_BLUE: '#0066CC',
  ERROR_RED: '#FF0000',
  ERROR_TINT: '#FFDDDD',
  IE_BUTTON_GRADIENT: 'linear-gradient(to bottom, #F0F0F0, #DCD9C9)',

  // Photo viewer chrome.
  PHOTO_BG: '#EEF3FA',
  PHOTO_TOOLBAR_GRADIENT: 'linear-gradient(to bottom, #F9FCFD 0%, #DDECFD 100%)',
  PHOTO_BORDER: '#A0B2C8',

  // Panels / misc chrome.
  PANEL_TINT_BLUE: '#E8F4FF',
  PANEL_TINT_BORDER: '#C0DEFF',
  MENU_HIGHLIGHT_BORDER: '#103A7A',
  PROGRESS_FILL_GRADIENT:
    'linear-gradient(180deg, #ACEDAD 0, #7BE47D 14%, #4CDA50 28%, #2ED330 42%, #42D845 57%, #76E275 71%, #8FE791 85%, #FFFFFF)',
  PROGRESS_BORDER: '#686868',
  BSOD_BLUE: '#0033A0',
  /** Dark canvas-workspace blue behind Paint's paper (classic mspaint look). */
  WORKSPACE_BLUE: '#0A2463',
  DROP_HIGHLIGHT: '#C1D2EE',
  STATUS_GROOVE_HILIGHT: '#F5F2E4',

  // Unverified neutral greys (FIDELITY §K.1 待核查). Tokenized value-for-value
  // from the pre-#213 inline stock so the ratchet drops with zero pixel drift;
  // verifying/remapping each against a real XP reference is follow-up work.
  // Do NOT reach for these in new code without checking §K.1 first.
  /** Error text red used by the shared password dialog (待核查 vs real XP). */
  ALERT_RED: '#D32F2F',
  GREY_2D: '#2D2D2D',
  GREY_33: '#333333',
  GREY_40: '#404040',
  GREY_55: '#555555',
  GREY_64: '#646464',
  GREY_66: '#666666',
  GREY_77: '#777777',
  GREY_88: '#888888',
  GREY_99: '#999999',
  GREY_A0: '#A0A0A0',
  GREY_B0: '#B0B0B0',
  GREY_C0: '#C0C0C0',
  GREY_CC: '#CCCCCC',
  GREY_D0: '#D0D0D0',
  GREY_DD: '#DDDDDD',
  GREY_DE: '#DEDEDE',
  GREY_E0: '#E0E0E0',
  GREY_E5: '#E5E5E5',
  GREY_EE: '#EEEEEE',
  GREY_F0: '#F0F0F0',
  GREY_F5: '#F5F5F5',
  GREY_F8: '#F8F8F8',
};

/** The shape of the XP token set — the contract a theme's `tokens` must satisfy. */
export type ThemeTokens = typeof COLORS;

/**
 * Windows XP font stacks (STY-02/STY-03) — the single outlet for every
 * font-family the XP chrome uses. Values are the exact stacks the components
 * already rendered with (zero visual diff); FIDELITY §K.1 `font.ui` /
 * `font.titlebar` are the authority. Culture-app content fonts (QQ's SimSun
 * classic UI, era-web Georgia, StickyNote's Comic Sans …) are app identity,
 * not OS chrome, and deliberately stay local to those apps.
 */
export const FONTS = {
  /** Standard UI stack: Tahoma for Latin, 宋体 first for CJK (YaHei is Vista+). */
  UI: "'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif",
  /** Title-bar stack: Trebuchet MS bold (xp.css / #35), same CJK fallbacks. */
  TITLEBAR: "'Trebuchet MS', 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif",
  /** Pre-Luna dialog stack kept by era apps rendered "as installed software". */
  CLASSIC: "'Tahoma', 'MS Sans Serif', sans-serif",
  /** Generic monospace surfaces (about screens, media timers, code). */
  MONO: "'Courier New', monospace",
  /** Notepad's classic editor font. */
  EDITOR: "'Lucida Console', monospace",
  /** Command Prompt / BSOD raster-console stack. */
  CONSOLE: "'Perfect DOS VGA 437 Win', 'Lucida Console', 'Courier New', monospace",
  /** XP boot screen ("Franklin Gothic Medium" progress text). */
  BOOT: "'Franklin Gothic Medium', 'Trebuchet MS', 'Tahoma', sans-serif",
};

/** The shape of the XP font set — the contract a theme's `fonts` must satisfy. */
export type ThemeFonts = typeof FONTS;
