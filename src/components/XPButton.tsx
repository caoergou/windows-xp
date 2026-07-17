import styled from 'styled-components';
import { COLORS, FONTS } from '../constants';

/**
 * Canonical Luna push button (#99 / #78), value-for-value identical to the
 * xp.css `button` rules so hand-rolled buttons and xp.css-styled native
 * buttons look the same everywhere:
 *
 *   border: 1px solid #003c74; radius 3px;
 *   face:   linear-gradient(180deg, #fff, #ecebe5 86%, #d8d0c4);
 *   hover:  orange inner glow; active: pressed gradient;
 *   focus:  1px dotted outline inset.
 *
 * Previously XPAlert, XPConfirm, PasswordDialog and XPInput each duplicated
 * a flat #ECE9D8 button that matched neither xp.css nor each other.
 */
export const XPButton = styled.button<{ $default?: boolean }>`
  box-sizing: border-box;
  min-width: 75px;
  min-height: 23px;
  padding: 0 12px;
  /* DLG-03 (#124): the dialog default button carries a heavier border so
     Enter's target reads at a glance (XP behavior + keyboard a11y). */
  border: ${props => (props.$default ? '2px' : '1px')} solid ${COLORS.BUTTON_BORDER};
  border-radius: 3px;
  background: ${COLORS.BUTTON_GRADIENT};
  box-shadow: none;
  font-family: ${FONTS.UI};
  font-size: 11px;
  color: ${COLORS.BLACK};
  cursor: pointer;

  &:hover:not(:disabled) {
    box-shadow: ${COLORS.BUTTON_HOVER_SHADOW};
  }

  &:active:not(:disabled) {
    box-shadow: none;
    background: ${COLORS.BUTTON_ACTIVE_GRADIENT};
  }

  &:focus-visible {
    outline: 1px dotted ${COLORS.BLACK};
    outline-offset: -4px;
  }

  &:disabled {
    color: ${COLORS.DIVIDER_GREY};
    border-color: ${COLORS.BUTTON_BORDER_DISABLED};
    cursor: default;
  }
`;
