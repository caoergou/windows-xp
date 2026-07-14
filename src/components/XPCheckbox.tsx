import React from 'react';
import styled from 'styled-components';

/**
 * Canonical XP checkbox / radio (#99 micro-component consistency).
 *
 * Why this exists: xp.css ships a global `input[type=checkbox]{opacity:0;
 * position:fixed}` rule that hides the native control and repaints it via an
 * ADJACENT `input + label::before/::after` sibling. The app's real markup
 * rarely follows that exact structure (checkboxes live inside labels, next to
 * spans, etc.), so those hidden inputs simply vanished — the mute toggle, the
 * QQ "remember password" row and others had no visible box at all.
 *
 * These components draw the box/indicator themselves, value-for-value matched
 * to xp.css (13px sunken white field for checkboxes with the 7px checkmark
 * bitmap; 12px sunken circle for radios with the 4px dot), so they render
 * identically everywhere regardless of surrounding DOM.
 */

// xp.css icon/checkmark.svg (7×7 black) and radio border/dot bitmaps, inlined.
const CHECKMARK =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='7' height='7' viewBox='0 0 7 7' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V5H1V6H2V7H3V6H4V5H5V4H6V3H7V0Z' fill='black'/%3E%3C/svg%3E\")";

const CHECKMARK_DISABLED =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='7' height='7' viewBox='0 0 7 7' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V5H1V6H2V7H3V6H4V5H5V4H6V3H7V0Z' fill='%23808080'/%3E%3C/svg%3E\")";

const RADIO_BORDER =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M8 0H4V1H2V2H1V4H0V8H1V10H2V8H1V4H2V2H4V1H8V2H10V1H8V0Z' fill='%23808080'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M8 1H4V2H2V3V4H1V8H2V9H3V8H2V4H3V3H4V2H8V3H10V2H8V1Z' fill='black'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M9 3H10V4H9V3ZM10 8V4H11V8H10ZM8 10V9H9V8H10V9V10H8ZM4 10V11H8V10H4ZM4 10V9H2V10H4Z' fill='%23DFDFDF'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M11 2H10V4H11V8H10V10H8V11H4V10H2V11H4V12H8V11H10V10H11V8H12V4H11V2Z' fill='white'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M4 2H8V3H9V4H10V8H9V9H8V10H4V9H3V8H2V4H3V3H4V2Z' fill='white'/%3E%3C/svg%3E\")";

const RADIO_DOT =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M3 0H1V1H0V2V3H1V4H3V3H4V2V1H3V0Z' fill='black'/%3E%3C/svg%3E\")";

const Root = styled.label<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  line-height: 13px;
  color: ${({ $disabled }) => ($disabled ? '#808080' : 'inherit')};
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  user-select: none;
  white-space: nowrap;

  /* Reset xp.css's global hide-and-repaint rule for our own native input. */
  input {
    position: static;
    opacity: 0;
    margin: 0;
    width: 0;
    height: 0;
  }

  input:focus-visible + span {
    outline: 1px dotted #000;
    outline-offset: 1px;
  }
`;

const CheckBox = styled.span<{ $checked?: boolean; $disabled?: boolean }>`
  box-sizing: border-box;
  flex-shrink: 0;
  position: relative;
  width: 13px;
  height: 13px;
  background: ${({ $disabled }) => ($disabled ? '#ece9d8' : '#fff')};
  /* xp.css --border-field: sunken 2px double bevel. */
  box-shadow:
    inset -1px -1px #fff,
    inset 1px 1px #808080,
    inset -2px -2px #dfdfdf,
    inset 2px 2px #0a0a0a;

  &::after {
    content: '';
    display: ${({ $checked }) => ($checked ? 'block' : 'none')};
    position: absolute;
    top: 2px;
    left: 3px;
    width: 7px;
    height: 7px;
    background: ${({ $disabled }) => ($disabled ? CHECKMARK_DISABLED : CHECKMARK)} no-repeat center;
  }
`;

const RadioBox = styled.span<{ $checked?: boolean }>`
  box-sizing: border-box;
  flex-shrink: 0;
  position: relative;
  width: 12px;
  height: 12px;
  background: ${RADIO_BORDER} no-repeat center;

  &::after {
    content: '';
    display: ${({ $checked }) => ($checked ? 'block' : 'none')};
    position: absolute;
    top: 4px;
    left: 4px;
    width: 4px;
    height: 4px;
    background: ${RADIO_DOT} no-repeat center;
  }
`;

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: React.ReactNode;
  className?: string;
};

export const XPCheckbox: React.FC<BaseProps> = ({
  label,
  className,
  disabled,
  checked,
  ...rest
}) => (
  <Root className={className} $disabled={disabled}>
    <input type="checkbox" disabled={disabled} checked={checked} {...rest} />
    <CheckBox $checked={!!checked} $disabled={disabled} aria-hidden="true" />
    {label != null && <span>{label}</span>}
  </Root>
);

export const XPRadio: React.FC<BaseProps> = ({ label, className, disabled, checked, ...rest }) => (
  <Root className={className} $disabled={disabled}>
    <input type="radio" disabled={disabled} checked={checked} {...rest} />
    <RadioBox $checked={!!checked} aria-hidden="true" />
    {label != null && <span>{label}</span>}
  </Root>
);
