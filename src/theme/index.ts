import { css } from 'styled-components';
import { COLORS } from '../constants';

/**
 * Windows XP themed button styles extracted from xp.css.
 * Apply to styled-components that render native <button> elements.
 */
export const xpButtonStyles = css`
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
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

  &::-webkit-scrollbar-button:horizontal:start:increment,
  &::-webkit-scrollbar-button:horizontal:end:decrement,
  &::-webkit-scrollbar-button:vertical:start:increment,
  &::-webkit-scrollbar-button:vertical:end:decrement {
    display: none;
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

/**
 * Windows XP trackbar (slider) styles extracted from xp.css.
 * Apply to a native `<input type="range">` styled-component: a 2px sunken
 * groove with the pointed 11×21 Luna indicator thumb, replacing the flat
 * square/round thumbs that read as generic browser sliders.
 */
const TRACKBAR_THUMB =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='11' height='21' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M0 0v16h2v2h2v2h1v-1H3v-2H1V1h9V0z' fill='%23fff'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M1 1v15h1v1h1v1h1v1h2v-1h1v-1h1v-1h1V1z' fill='%23C0C7C8'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M9 1h1v15H8v2H6v2H5v-1h2v-2h2z' fill='%2387888F'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M10 0h1v16H9v2H7v2H5v1h1v-2h2v-2h2z' fill='%23000'/%3E%3C/svg%3E\")";

const trackGroove = css`
  width: 100%;
  height: 2px;
  box-sizing: border-box;
  background: #000;
  border-right: 1px solid grey;
  border-bottom: 1px solid grey;
  box-shadow:
    1px 0 0 white, 1px 1px 0 white, 0 1px 0 white,
    -1px 0 0 darkgrey, -1px -1px 0 darkgrey, 0 -1px 0 darkgrey,
    -1px 1px 0 white, 1px -1px darkgrey;
`;

export const xpTrackbarStyles = css`
  -webkit-appearance: none;
  appearance: none;
  height: 21px;
  background: transparent;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &::-webkit-slider-runnable-track {
    ${trackGroove}
  }
  &::-moz-range-track {
    ${trackGroove}
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 21px;
    width: 11px;
    background: ${TRACKBAR_THUMB} no-repeat !important;
    transform: translateY(-9px);
  }
  &::-moz-range-thumb {
    height: 21px;
    width: 11px;
    border: 0;
    border-radius: 0;
    background: ${TRACKBAR_THUMB} no-repeat;
  }
`;
