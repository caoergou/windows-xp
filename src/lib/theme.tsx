/**
 * Windows XP design tokens and styled-components helpers (public `./theme`
 * subpath), plus the #135 theme contract and its XP implementation.
 */

export { xpButtonStyles, xpScrollbarStyles, xpTitleBarStyles } from '../theme';
export { WINDOW_DEFAULTS, DESKTOP_DEFAULTS, TIME } from '../constants';
// COLORS comes straight from the theme layer — the back-compat re-export
// through src/constants.ts was removed once the B1 codemod finished (#213).
export { COLORS } from '../themes/xp/tokens';

// #135 — the theme abstraction (the contract new themes fill) and the XP theme.
export { xpTheme } from '../themes/xp';
// #213 B1 — read the active OS theme from context (runtime theme seam), and
// mount a theme's skin sheet (`OSTheme.css`) from your own entry when rendering
// without AppProviders.
export { useOSTheme } from '../themes/useOSTheme';
export { mountThemeCss } from '../themes/mountThemeCss';
export type {
  OSTheme,
  ThemeTokens,
  ThemeAssets,
  ThemeStyles,
  StyleFragment,
  WindowControlAssets,
  StartButtonAssets,
  ButtonStateImages,
} from '../themes/contract';
export type { ChromeSlots } from '../os/contract';
