import type { OSTheme } from '../contract';
import { COLORS, FONTS } from './tokens';
import { XP_ASSETS } from './assets';
import { xpButtonStyles, xpScrollbarStyles, xpTitleBarStyles, xpTrackbarStyles } from './styles';

/**
 * The Windows XP (Luna) theme — the single {@link OSTheme} implementation
 * today (#135). Everything XP-specific (tokens, assets, styles) resolves through
 * this module, so a future theme is a sibling under `src/themes/` rather than a
 * change to the engine.
 */
export const xpTheme: OSTheme = {
  id: 'xp',
  name: 'Windows XP (Luna)',
  tokens: COLORS,
  fonts: FONTS,
  assets: XP_ASSETS,
  styles: {
    button: xpButtonStyles,
    scrollbar: xpScrollbarStyles,
    titleBar: xpTitleBarStyles,
    trackbar: xpTrackbarStyles,
  },
};

export { COLORS, FONTS } from './tokens';
export { XP_ASSETS } from './assets';
export { xpButtonStyles, xpScrollbarStyles, xpTitleBarStyles, xpTrackbarStyles } from './styles';
