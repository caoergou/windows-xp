import React from 'react';
import styled from 'styled-components';
import { FONTS } from '../constants';

/**
 * XP group box (#78): the grooved-border `<fieldset>` with an inset legend,
 * value-for-value from xp.css's `fieldset`/`legend`.
 */
const Fieldset = styled.fieldset`
  border: 2px solid transparent;
  border-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='5' height='5' fill='gray' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M0 0h5v5H0V2h2v1h1V2H0' fill='%23fff'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M0 0h4v4H0V1h1v2h2V1H0'/%3E%3C/svg%3E")
    2;
  padding: 10px;
  padding-block-start: 8px;
  margin: 0;
  font-family: ${FONTS.UI};
  font-size: 11px;
  color: #000;

  legend {
    background: #ece9d8;
    padding: 0 3px;
  }
`;

export interface XPGroupBoxProps {
  label?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const XPGroupBox: React.FC<XPGroupBoxProps> = ({ label, children, className }) => (
  <Fieldset className={className}>
    {label != null && <legend>{label}</legend>}
    {children}
  </Fieldset>
);
