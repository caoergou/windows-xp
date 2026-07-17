import React from 'react';
import styled from 'styled-components';
import { usePowerTransition } from '../context/PowerTransitionContext';
import { resolveOSTheme } from '../themes/useOSTheme';

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2147483646;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  font: 18px ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  text-align: center;
  white-space: pre-wrap;
`;

export const PowerTransitionOverlay: React.FC = () => {
  const { active, text } = usePowerTransition();
  return active ? <Overlay role="status">{text}</Overlay> : null;
};
