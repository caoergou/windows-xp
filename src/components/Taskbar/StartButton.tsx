import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const StartButtonContainer = styled.button`
  height: 30px;
  width: 100px;
  background: linear-gradient(to bottom, #3e864e 0%, #57a965 10%, #3e864e 100%);
  border: none;
  border-radius: 0;
  color: white;
  font-style: italic;
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  padding-left: 10px;
  cursor: pointer;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);

  &:hover {
    filter: brightness(1.1);
  }

  &:active,
  &.active {
    filter: brightness(0.9);
    box-shadow: inset 2px 2px 2px rgba(0, 0, 0, 0.5);
  }

  .start-icon {
    margin-right: 4px;
    filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
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
  >
    <XPIcon name="windows" size={20} className="start-icon" color="white" />
    {label}
  </StartButtonContainer>
);

export default StartButton;
