import React from 'react';
import styled from 'styled-components';
import { resolveOSTheme, useOSTheme } from '../../themes/useOSTheme';

const StartButtonContainer = styled.button<{ $isActive?: boolean; $localized?: boolean }>`
  height: 30px;
  width: ${props => (props.$localized ? '84px' : '99px')};
  border: none;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  background-color: ${props =>
    props.$localized ? resolveOSTheme(props.theme).tokens.START_GREEN : 'transparent'};
  background-image: ${props =>
    props.$localized
      ? resolveOSTheme(props.theme).tokens.START_GRADIENT
      : `url(${resolveOSTheme(props.theme).assets.startButton.sprite})`};
  background-repeat: no-repeat;
  background-size: 99px 90px;
  background-position: 0 0;
  border-radius: ${props => (props.$localized ? '0 12px 12px 0' : '0')};
  box-shadow: ${props =>
    props.$localized
      ? 'inset 0 1px 0 rgba(255,255,255,0.65), inset -1px -1px 0 rgba(0,0,0,0.25)'
      : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 13px;
  font-weight: bold;
  font-style: italic;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.75);

  &:hover {
    background-position: ${props => (props.$localized ? '0 0' : '0 -30px')};
    background-image: ${props =>
      props.$localized
        ? resolveOSTheme(props.theme).tokens.START_GRADIENT_HOVER
        : `url(${resolveOSTheme(props.theme).assets.startButton.sprite})`};
  }

  &&:active,
  &&.active {
    background-position: ${props => (props.$localized ? '0 0' : '0 -60px')};
    background-image: ${props =>
      props.$localized
        ? resolveOSTheme(props.theme).tokens.START_GRADIENT_ACTIVE
        : `url(${resolveOSTheme(props.theme).assets.startButton.sprite})`};
  }

  &:focus {
    outline: none;
  }
`;

const StartLogo = styled.img`
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.35));
`;

const StartText = styled.span`
  line-height: 30px;
`;

interface StartButtonProps {
  label: string;
  isActive: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const StartButton: React.FC<StartButtonProps> = ({ label, isActive, buttonRef, onClick }) => {
  const localized = label !== 'Start';
  const windowsLogo = useOSTheme().assets.startButton.logo;

  return (
    <StartButtonContainer
      ref={buttonRef}
      data-testid="start-button"
      data-xp-anchor="start-button"
      onClick={onClick}
      className={isActive ? 'active' : ''}
      $isActive={isActive}
      $localized={localized}
      title={label}
      aria-label={label}
    >
      {localized && (
        <>
          <StartLogo src={windowsLogo} alt="" draggable={false} />
          <StartText>{label}</StartText>
        </>
      )}
    </StartButtonContainer>
  );
};

export default StartButton;
