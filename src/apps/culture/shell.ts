import styled from 'styled-components';
import { FONTS } from '../../constants';

// Shared shell for the zh culture apps (#163/B). The six culture apps each
// repeated the same Wrap boilerplate — full-size flex column, the Tahoma/SimSun
// UI font stack, no text selection, clipped overflow — differing only in their
// brand background/colour. This centralizes the common structure; each app
// composes `styled(CultureAppShell)` and sets just its own colours.

/** The Windows XP UI font stack used across the culture apps (STY-03 token). */
export const UI_FONT_STACK = FONTS.UI;

/**
 * Base window shell: fills its window, stacks children vertically, applies the
 * UI font, disables selection and clips overflow. Compose with `styled()` to
 * add the per-app background/colour.
 */
export const CultureAppShell = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: ${UI_FONT_STACK};
  font-size: 12px;
  user-select: none;
  overflow: hidden;
`;
