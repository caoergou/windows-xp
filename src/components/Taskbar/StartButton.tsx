import React from 'react';
import styled from 'styled-components';
import startButtonSprite from '../../assets/images/taskbar/startButton__spriteSheet.png';
import windowsLogo from '../../assets/windowsIcons/windows.png';

const StartButtonContainer = styled.button<{ $isActive?: boolean; $localized?: boolean }>`
  height: 30px;
  width: ${props => (props.$localized ? '84px' : '99px')};
  border: none;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  background-color: ${props => (props.$localized ? '#2da814' : 'transparent')};
  background-image: ${props =>
    props.$localized
      ? 'linear-gradient(to bottom, #70da55 0%, #38b820 14%, #14920f 55%, #0d7110 100%)'
      : `url(${startButtonSprite})`};
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
  color: #fff;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 13px;
  font-weight: bold;
  font-style: italic;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.75);

  &:hover {
    background-position: ${props => (props.$localized ? '0 0' : '0 -30px')};
    background-image: ${props =>
      props.$localized
        ? 'linear-gradient(to bottom, #87ec6c 0%, #45c52c 14%, #19a214 55%, #0f7c13 100%)'
        : `url(${startButtonSprite})`};
  }

  &&:active,
  &&.active {
    background-position: ${props => (props.$localized ? '0 0' : '0 -60px')};
    background-image: ${props =>
      props.$localized
        ? 'linear-gradient(to bottom, #0d7110 0%, #14920f 55%, #38b820 100%)'
        : `url(${startButtonSprite})`};
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

  return (
    <StartButtonContainer
      ref={buttonRef}
      data-testid="start-button"
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
