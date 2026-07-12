/**
 * XP styled-components helpers. The implementations now live in the theme layer
 * (`src/themes/xp/styles.ts`, #135); this module re-exports them so existing
 * consumers and the public `./theme` subpath are unchanged.
 */
export {
  xpButtonStyles,
  xpScrollbarStyles,
  xpTitleBarStyles,
  xpTrackbarStyles,
} from '../themes/xp/styles';
