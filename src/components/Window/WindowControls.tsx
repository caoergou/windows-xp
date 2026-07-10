import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import windowControlsSprite from '../../assets/images/window/window-controls-sprite.png';

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
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url(${windowControlsSprite});
    background-repeat: no-repeat;
    background-size: 90px 22px;
    pointer-events: none;
  }

  &:hover {
    filter: brightness(120%);
  }

  &:active {
    filter: brightness(90%);
  }
`;

const BlueWindowControl = styled(BaseButton)`
  box-shadow: inset 0 -1px 2px 1px #4646ff;
  background-image: radial-gradient(
    circle at 90% 90%,
    #0054e9 0%,
    #2263d5 55%,
    #4479e4 70%,
    #a3bbec 90%,
    white 100%
  );
`;

export const MinimizeBtn = styled(BlueWindowControl)`
  &::after {
    background-position: 0 0;
  }
`;

export const MaximizeBtn = styled(BlueWindowControl)`
  &::after {
    background-position: -22px 0;
  }
`;

export const RestoreBtn = styled(BlueWindowControl)`
  &::after {
    background-position: -45px 0;
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
  margin-right: 0;

  &::after {
    background-position: -67px 0;
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
