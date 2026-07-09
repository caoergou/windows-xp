import { css } from 'styled-components';
import { COLORS } from '../constants';

/**
 * Windows XP themed button styles extracted from xp.css.
 * Apply to styled-components that render native <button> elements.
 */
export const xpButtonStyles = css`
  font-family: Tahoma, "Microsoft YaHei", sans-serif;
  font-size: 11px;
  box-sizing: border-box;
  border: 1px solid ${COLORS.BUTTON_BORDER};
  background: ${COLORS.BUTTON_GRADIENT};
  border-radius: 3px;
  box-shadow: none;
  cursor: pointer;

  &:not(:disabled) {
    &:active,
    &.active {
      box-shadow: none;
      background: ${COLORS.BUTTON_ACTIVE_GRADIENT};
    }

    &:hover {
      box-shadow: ${COLORS.BUTTON_HOVER_SHADOW};
    }
  }

  &:focus,
  &.focused {
    box-shadow: ${COLORS.BUTTON_FOCUS_SHADOW};
  }
`;

/**
 * Windows XP themed scrollbar styles extracted from xp.css.
 * Apply to a scrollable styled-component container.
 */
export const xpScrollbarStyles = css`
  &::-webkit-scrollbar {
    width: 16px;
  }

  &::-webkit-scrollbar:horizontal {
    height: 17px;
  }

  &::-webkit-scrollbar-track {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='2' height='2' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M1 0H0v1h1v1h1V1H1V0z' fill='silver'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M2 0H1v1H0v1h1V1h1V0z' fill='%23fff'/%3E%3C/svg%3E");
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${COLORS.BUTTON_FACE};
    box-shadow:
      inset -1px -1px ${COLORS.WINDOW_FRAME},
      inset 1px 1px ${COLORS.BUTTON_HIGHLIGHT},
      inset -2px -2px ${COLORS.BUTTON_SHADOW},
      inset 2px 2px ${COLORS.BUTTON_FACE};
  }

  &::-webkit-scrollbar-button:horizontal:end:increment,
  &::-webkit-scrollbar-button:horizontal:start:decrement,
  &::-webkit-scrollbar-button:vertical:end:increment,
  &::-webkit-scrollbar-button:vertical:start:decrement {
    display: block;
  }

  &::-webkit-scrollbar-corner {
    background-color: ${COLORS.SURFACE};
  }
`;

/**
 * Windows XP title-bar gradient (active window).
 */
export const xpTitleBarStyles = css`
  background: ${COLORS.TITLE_BAR_GRADIENT};
  color: #fff;
  text-shadow: 1px 1px #0F1089;
`;
