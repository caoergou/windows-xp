/**
 * Windows XP design tokens and styled-components helpers (public `./theme`
 * subpath), plus the #135 theme contract and its XP implementation.
 */

export { xpButtonStyles, xpScrollbarStyles, xpTitleBarStyles } from '../theme';
export { COLORS, WINDOW_DEFAULTS, DESKTOP_DEFAULTS, TIME } from '../constants';

// #135 — the theme abstraction (the contract new themes fill) and the XP theme.
export { xpTheme } from '../themes/xp';
// #213 B1 — read the active OS theme from context (runtime theme seam).
export { useOSTheme } from '../themes/useOSTheme';
export type {
  OSTheme,
  ThemeTokens,
  ThemeAssets,
  ThemeStyles,
  ChromeSlots,
  StyleFragment,
  WindowControlAssets,
  StartButtonAssets,
  ButtonStateImages,
} from '../themes/contract';
