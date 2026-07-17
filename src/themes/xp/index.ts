import type { OSTheme } from '../contract';
import { COLORS, FONTS } from './tokens';
import { XP_ASSETS } from './assets';
import { XP_SOUNDS } from './sounds';
import { xpButtonStyles, xpScrollbarStyles, xpTitleBarStyles, xpTrackbarStyles } from './styles';
// `?inline` runs the sheet through the postcss pipeline (so the xp.css scope
// prefix, vite.xp-css-scope.ts, still applies) and hands it over as a string
// instead of mounting it — the theme carries its own skin (#213 B1).
import xpSkinCss from 'xp.css/dist/XP.css?inline';
import { XP_CHROME_CSS } from './chromeCss';

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
  sounds: XP_SOUNDS,
  css: `${xpSkinCss}\n${XP_CHROME_CSS}`,
  styles: {
    button: xpButtonStyles,
    scrollbar: xpScrollbarStyles,
    titleBar: xpTitleBarStyles,
    trackbar: xpTrackbarStyles,
  },
};

export { COLORS, FONTS } from './tokens';
export { XP_ASSETS } from './assets';
export { XP_SOUNDS } from './sounds';
export { xpButtonStyles, xpScrollbarStyles, xpTitleBarStyles, xpTrackbarStyles } from './styles';
