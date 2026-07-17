import styled from 'styled-components';
import { resolveOSTheme } from '../themes/useOSTheme';

/**
 * Canonical XP combobox (#99 micro-component consistency).
 *
 * Native `<select>` elements rendered the host OS dropdown (flat control, OS
 * arrow) — nothing like the XP Luna combobox. This matches xp.css's `select`
 * rules: a white sunken field (field border, same `#7f9db9` as XPTextInput)
 * with the beige raised drop-button + black arrow bitmap docked on the right.
 *
 * Drop-in for `<select>`: `<XPSelect value=… onChange=…><option/></XPSelect>`.
 */
const ARROW =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='16' height='17' viewBox='0 0 16 17' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M15 0H0V1V16H1V1H15V0Z' fill='%23DFDFDF'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M2 1H1V15H2V2H14V1H2Z' fill='white'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M16 17H15H0V16H15V0H16V17Z' fill='black'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M15 1H14V15H1V16H14H15V1Z' fill='%23808080'/%3E%3Crect x='2' y='2' width='12' height='13' fill='%23C0C0C0'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M11 6H4V7H5V8H6V9H7V10H8V9H9V8H10V7H11V6Z' fill='black'/%3E%3C/svg%3E\")";

export const XPSelect = styled.select`
  box-sizing: border-box;
  height: 21px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
  background-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  background-image: ${ARROW};
  background-position: top 1px right 1px;
  background-repeat: no-repeat;
  padding: 2px 20px 2px 4px;
  border-radius: 0;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:disabled {
    color: ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
    background-color: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
    cursor: default;
  }

  option {
    font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
    font-size: 11px;
    color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
    background-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  }
`;
