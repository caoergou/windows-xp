// Window defaults
export const WINDOW_DEFAULTS = {
  WIDTH: 800,
  HEIGHT: 600,
  MIN_WIDTH: 300,
  MIN_HEIGHT: 200,
  INITIAL_Z_INDEX: 10000,
  Z_INDEX_INCREMENT: 1,
};

// Desktop defaults
export const DESKTOP_DEFAULTS = {
  ICON_SIZE: 70,
  ICON_WIDTH: 70,
  ICON_HEIGHT: 80,
  TEXT_MAX_WIDTH: 80,
};

// Calculator defaults
export const CALCULATOR_DEFAULTS = {
  WIDTH: 208,
  HEIGHT: 196,
};

// Internet Explorer defaults
export const IE_DEFAULTS = {
  WIDTH: 800,
  HEIGHT: 600,
  HISTORY_LIMIT: 100,
};

// File system defaults
export const FS_DEFAULTS = {
  RECYCLE_BIN_PATH: '回收站',
  DESKTOP_PATH: 'Desktop',
  MY_COMPUTER_PATH: 'My Computer',
};

// Time constants (in milliseconds)
export const TIME = {
  SCREENSAVER_TIMEOUT: 60000, // 1 minute
  FLASH_DURATION: 500,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
};

// Color constants (Windows XP theme)
// Sourced from xp.css/themes/XP/_variables.scss and component styles.
export const COLORS = {
  WINDOW_TITLE_ACTIVE:
    'linear-gradient(to bottom,#0058ee 0%,#3593ff 4%,#288eff 6%,#127dff 8%,#036ffc 10%,#0262ee 14%,#0057e5 20%,#0054e3 24%,#0055eb 56%,#005bf5 66%,#026afe 76%,#0062ef 86%,#0052d6 92%,#0040ab 94%,#003092 100%)',
  WINDOW_TITLE_INACTIVE:
    'linear-gradient(to bottom, #7697e7 0%,#7e9ee3 3%,#94afe8 6%,#97b4e9 8%,#82a5e4 14%,#7c9fe2 17%,#7996de 25%,#7b99e1 56%,#82a9e9 81%,#80a5e7 89%,#7b96e1 94%,#7a93df 97%,#abbae3 100%)',
  DESKTOP_BACKGROUND: '#004E98',
  TASKBAR_HEIGHT: 30,
  TITLE_BAR_HEIGHT: 25,
  MENU_ITEM_HEIGHT: 22,

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

  // XP.css button gradients
  BUTTON_GRADIENT: 'linear-gradient(180deg, #FFFFFF 0%, #ECEBE5 86%, #D8D0C4 100%)',
  BUTTON_ACTIVE_GRADIENT: 'linear-gradient(180deg, #CDCAC3 0%, #E3E3DB 8%, #E5E5DE 94%, #F2F2F1 100%)',
  BUTTON_HOVER_SHADOW: 'inset -1px 1px #FFF0CF, inset 1px 2px #FDD889, inset -2px 2px #FBC761, inset 2px -2px #E5A01A',
  BUTTON_FOCUS_SHADOW: 'inset -1px 1px #CEE7FF, inset 1px 2px #98B8EA, inset -2px 2px #BCD4F6, inset 1px -1px #89ADE4, inset 2px -2px #89ADE4',

  // XP.css title-bar (from xp.css window.scss)
  TITLE_BAR_GRADIENT: 'linear-gradient(180deg, #0997FF 0%, #0053EE 8%, #0050EE 40%, #0066FF 88%, #0066FF 93%, #005BFF 95%, #003DD7 96%, #003DD7 100%)',

  // XP.css scrollbar
  SCROLLBAR_BG: 'linear-gradient(90deg, #C5D5FF 0%, #B5D3FF 86%, #B6CAF7 100%)',
  SCROLLBAR_SHADOW: 'inset 1px 1px white, inset -1px -1px white, inset 2px 2px #B9CDFA, inset -2px -2px #B6C9F7',
};
