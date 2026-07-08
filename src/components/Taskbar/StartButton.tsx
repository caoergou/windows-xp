import React from 'react';
import styled from 'styled-components';
import startButtonImg from '../../assets/windowsIcons/start.png';

const StartButtonContainer = styled.button`
  height: 30px;
  width: 100px;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  img {
    height: 100%;
    width: auto;
    display: block;
  }

  &:hover {
    filter: brightness(1.05);
  }

  &:active,
  &.active {
    filter: brightness(0.85);
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
    title={label}
    aria-label={label}
  >
    <img src={startButtonImg} alt={label} />
  </StartButtonContainer>
);

export default StartButton;
