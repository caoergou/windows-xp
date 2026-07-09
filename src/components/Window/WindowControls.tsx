import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

export const TitleControls = styled.div<{ $isFocus?: boolean }>`
  opacity: ${({ $isFocus }) => ($isFocus ? 1 : 0.6)};
  height: 22px;
  min-height: 22px;
  max-height: 22px;
  display: flex;
  align-items: center;
  margin-top: -1px;
  margin-right: 0;
  z-index: 1;
  flex-shrink: 0;
  gap: 0;
`;

export const BaseButton = styled.button`
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  max-width: 22px;
  max-height: 22px;
  box-sizing: border-box;
  border: 1px solid #fff;
  border-radius: 3px;
  margin-right: 1px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: none;
  cursor: default;
  position: relative;
  flex-shrink: 0;

  &:hover {
    filter: brightness(120%);
  }

  &:active {
    filter: brightness(90%);
  }
`;

export const MinimizeBtn = styled(BaseButton)`
  box-shadow: inset 0 -1px 2px 1px #4646ff;
  background-image: radial-gradient(
    circle at 90% 90%,
    #0054e9 0%,
    #2263d5 55%,
    #4479e4 70%,
    #a3bbec 90%,
    white 100%
  );
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 13px;
    height: 3px;
    width: 8px;
    background-color: white;
    pointer-events: none;
  }
`;

export const MaximizeBtn = styled(BaseButton)`
  box-shadow: inset 0 -1px 2px 1px #4646ff;
  background-image: radial-gradient(
    circle at 90% 90%,
    #0054e9 0%,
    #2263d5 55%,
    #4479e4 70%,
    #a3bbec 90%,
    white 100%
  );
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    display: block;
    left: 4px;
    top: 4px;
    box-shadow:
      inset 0 3px white,
      inset 0 0 0 1px white;
    height: 12px;
    width: 12px;
    pointer-events: none;
  }
`;

export const RestoreBtn = styled(BaseButton)`
  box-shadow: inset 0 -1px 2px 1px #4646ff;
  background-image: radial-gradient(
    circle at 90% 90%,
    #0054e9 0%,
    #2263d5 55%,
    #4479e4 70%,
    #a3bbec 90%,
    white 100%
  );
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    display: block;
    left: 7px;
    top: 4px;
    box-shadow:
      inset 0 2px white,
      inset 0 0 0 1px white;
    height: 8px;
    width: 8px;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    display: block;
    left: 4px;
    top: 7px;
    box-shadow:
      inset 0 2px white,
      inset 0 0 0 1px white,
      1px -1px #136dff;
    height: 8px;
    width: 8px;
    background-color: #136dff;
    pointer-events: none;
  }
`;

export const CloseBtn = styled(BaseButton)`
  box-shadow: inset 0 -1px 2px 1px #da4600;
  background-image: radial-gradient(
    circle at 90% 90%,
    #cc4600 0%,
    #dc6527 55%,
    #cd7546 70%,
    #ffccb2 90%,
    white 100%
  );
  overflow: hidden;
  margin-right: 0;

  &::before {
    content: '';
    position: absolute;
    left: 9px;
    top: 2px;
    transform: rotate(45deg);
    height: 16px;
    width: 2px;
    background-color: white;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    left: 9px;
    top: 2px;
    transform: rotate(-45deg);
    height: 16px;
    width: 2px;
    background-color: white;
    pointer-events: none;
  }
`;

interface WindowControlsProps {
  isFocused: boolean;
  isResizable: boolean;
  isMaximized: boolean;
  onMinimize: (e: React.MouseEvent) => void;
  onMaximize: (e: React.MouseEvent) => void;
  onClose: (e: React.MouseEvent) => void;
}

const WindowControls: React.FC<WindowControlsProps> = ({
  isFocused,
  isResizable,
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <TitleControls $isFocus={isFocused}>
      <MinimizeBtn onClick={onMinimize} aria-label={t('window.minimize')} />
      {isResizable &&
        (isMaximized ? (
          <RestoreBtn onClick={onMaximize} aria-label={t('window.restore')} />
        ) : (
          <MaximizeBtn onClick={onMaximize} aria-label={t('window.maximize')} />
        ))}
      <CloseBtn onClick={onClose} aria-label={t('window.close')} />
    </TitleControls>
  );
};

export default WindowControls;
