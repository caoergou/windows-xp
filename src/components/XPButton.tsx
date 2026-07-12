import styled from 'styled-components';

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
  border: ${props => (props.$default ? '2px' : '1px')} solid #003c74;
  border-radius: 3px;
  background: linear-gradient(180deg, #fff, #ecebe5 86%, #d8d0c4);
  box-shadow: none;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  color: #000;
  cursor: pointer;

  &:hover:not(:disabled) {
    box-shadow:
      inset -1px 1px #fff0cf,
      inset 1px 2px #fdd889,
      inset -2px 2px #fbc761,
      inset 2px -2px #e5a01a;
  }

  &:active:not(:disabled) {
    box-shadow: none;
    background: linear-gradient(180deg, #cdcac3, #e3e3db 8%, #e5e5de 94%, #f2f2f1);
  }

  &:focus-visible {
    outline: 1px dotted #000;
    outline-offset: -4px;
  }

  &:disabled {
    color: #aca899;
    border-color: #c9c2b8;
    cursor: default;
  }
`;
