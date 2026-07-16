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
