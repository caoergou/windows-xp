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

// STY-03: the single outlet for XP font stacks (defined in the theme layer).
export { FONTS } from '../themes/xp/tokens';
export type { ThemeFonts } from '../themes/xp/tokens';
