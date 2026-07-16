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
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
};

// Color constants (Windows XP theme). The values now live in the theme layer
// (`src/themes/xp/tokens.ts`, #135) so the engine never owns XP colours; this
// re-export keeps every `import { COLORS } from '.../constants'` call site working.
export { COLORS } from './themes/xp/tokens';
export type { ThemeTokens } from './themes/xp/tokens';
