import styled from 'styled-components';
import { COLORS, FONTS } from '../constants';

/**
 * Shared Windows XP menu-bar primitives (#99 / #78).
 *
 * Before this existed, Notepad, Minesweeper and Solitaire each hand-rolled a
 * menu bar with different backgrounds (`#f0f0f0` gradient / `#ece9d8` /
 * `#d4d0c8`) and highlight colors (`#316AC5` / `#0a246a` / `#0a2463`), so the
 * same UI element looked different in every window. These are the single
 * source of truth, matching real XP Luna: the bar shares the window surface
 * color, and the open/hover highlight is the system Highlight color.
 *
 * Values sourced from FIDELITY.md §K.1 (surface `#ECE9D8`, highlight
 * `#316AC5`). Menu bars carry no hard bottom divider in XP.
 */

export const XPMenuBar = styled.div`
  display: flex;
  align-items: center;
  height: 20px;
  padding: 0 2px;
  background: ${COLORS.SURFACE};
  font-family: ${FONTS.UI};
  font-size: 11px;
  color: ${COLORS.BLACK};
  flex-shrink: 0;
  user-select: none;
`;

/** A top-level menu bar entry (File, Edit, Game, Help…). */
export const XPMenuBarItem = styled.button<{ $active?: boolean }>`
  height: 18px;
  padding: 0 7px;
  border: 0;
  font: inherit;
  line-height: 18px;
  cursor: default;
  color: ${p => (p.$active ? COLORS.WHITE : COLORS.BLACK)};
  background: ${p => (p.$active ? '#316AC5' : 'transparent')};

  &:hover {
    color: ${COLORS.WHITE};
    background: #316ac5;
  }
`;

/** Positioning wrapper so a dropdown anchors under its bar item. */
export const XPMenuSlot = styled.div`
  position: relative;
`;

export const XPMenuDropdown = styled.div`
  position: absolute;
  top: 20px;
  left: 0;
  z-index: 9999;
  min-width: 154px;
  padding: 2px;
  background: ${COLORS.WHITE};
  border: 1px solid ${COLORS.BUTTON_SHADOW};
  box-shadow: 2px 2px 1px rgba(0, 0, 0, 0.35);
  font-family: ${FONTS.UI};
  font-size: 11px;
`;

export const XPMenuDropdownItem = styled.button<{ $disabled?: boolean }>`
  display: grid;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  width: 100%;
  height: 20px;
  padding: 0 6px 0 0;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: default;
  color: ${p => (p.$disabled ? COLORS.DIVIDER_GREY : COLORS.BLACK)};
  background: transparent;

  &:hover {
    color: ${p => (p.$disabled ? COLORS.DIVIDER_GREY : COLORS.WHITE)};
    background: ${p => (p.$disabled ? 'transparent' : '#316ac5')};
  }
`;

export const XPMenuSeparator = styled.div`
  height: 1px;
  margin: 2px 1px;
  background: ${COLORS.DIVIDER_GREY};
  border-bottom: 1px solid ${COLORS.WHITE};
`;

/** Left-column marker cell (holds a checkmark or stays empty for alignment). */
export const XPMenuMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
`;
