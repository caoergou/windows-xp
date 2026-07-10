import React from 'react';
import styled from 'styled-components';
import startButtonSprite from '../../assets/images/taskbar/startButton__spriteSheet.png';

const StartButtonContainer = styled.button<{ $isActive?: boolean }>`
  height: 30px;
  width: 99px;
  border: none;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  background-color: transparent;
  background-image: url(${startButtonSprite});
  background-repeat: no-repeat;
  background-size: 99px 90px;
  background-position: 0 0;

  &:hover {
    background-position: 0 -30px;
  }

  &:active,
  &.active {
    background-position: 0 -60px;
  }

  &:focus {
    outline: none;
  }
`;

interface StartButtonProps {
  label: string;
  isActive: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const StartButton: React.FC<StartButtonProps> = ({ label, isActive, buttonRef, onClick }) => (
  <StartButtonContainer
    ref={buttonRef}
    data-testid="start-button"
    onClick={onClick}
    className={isActive ? 'active' : ''}
    $isActive={isActive}
    title={label}
    aria-label={label}
  />
);

export default StartButton;
