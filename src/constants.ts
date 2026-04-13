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
  WIDTH: 260,
  HEIGHT: 340,
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

// Local storage keys
export const STORAGE_KEYS = {
  WINDOWS: 'xp_open_windows',
  LOGGED_IN: 'xp_logged_in',
  POWER_STATE: 'xp_power_state',
  IE_HISTORY: 'xp_ie_history',
  IE_FAVORITES: 'xp_ie_favorites',
};

// Time constants (in milliseconds)
export const TIME = {
  SCREENSAVER_TIMEOUT: 60000, // 1 minute
  FLASH_DURATION: 500,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
};

// Color constants (Windows XP theme)
export const COLORS = {
  WINDOW_TITLE_ACTIVE:
    'linear-gradient(to bottom,#0058ee 0%,#3593ff 4%,#288eff 6%,#127dff 8%,#036ffc 10%,#0262ee 14%,#0057e5 20%,#0054e3 24%,#0055eb 56%,#005bf5 66%,#026afe 76%,#0062ef 86%,#0052d6 92%,#0040ab 94%,#003092 100%)',
  WINDOW_TITLE_INACTIVE:
    'linear-gradient(to bottom, #7697e7 0%,#7e9ee3 3%,#94afe8 6%,#97b4e9 8%,#82a5e4 14%,#7c9fe2 17%,#7996de 25%,#7b99e1 56%,#82a9e9 81%,#80a5e7 89%,#7b96e1 94%,#7a93df 97%,#abbae3 100%)',
  DESKTOP_BACKGROUND: '#3A6EA5',
  TASKBAR_HEIGHT: 30,
  TITLE_BAR_HEIGHT: 25,
  MENU_ITEM_HEIGHT: 22,
};
