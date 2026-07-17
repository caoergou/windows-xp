import styled from 'styled-components';
import { resolveOSTheme } from '../themes/useOSTheme';

/**
 * Canonical Luna text input (#99 / #78), matching xp.css's
 * `input[type=text|password|email]` rules value-for-value:
 *
 *   border: 1px solid #7f9db9; background: #fff; border-radius: 0;
 *   padding: 3px 4px; height: 23px; box-sizing: border-box.
 *
 * xp.css removes the focus outline entirely (`outline: none`) — real XP
 * text boxes show no color change on focus, only the blinking caret.
 *
 * Previously XPInput, PasswordDialog and RunDialog each hand-rolled a
 * slightly different sunken input (different padding/height, and
 * PasswordDialog invented a blue focus outline with no XP precedent).
 */
export const XPTextInput = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 23px;
  padding: 3px 4px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
  border-radius: 0;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 12px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};

  &:focus {
    outline: none;
  }
`;
