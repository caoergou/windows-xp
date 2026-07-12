/**
 * Theme layer (#135). The engine stays theme-agnostic; everything that gives
 * the desktop its look — tokens, assets, style fragments — lives here behind the
 * {@link OSTheme} contract. `xpTheme` is the only implementation today.
 */
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
} from './contract';

export { xpTheme, COLORS, XP_ASSETS } from './xp';
export { xpButtonStyles, xpScrollbarStyles, xpTitleBarStyles, xpTrackbarStyles } from './xp/styles';
