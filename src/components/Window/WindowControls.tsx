import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { XP_ASSETS } from '../../themes/xp/assets';

const { minimize, maximize, restore, close } = XP_ASSETS.windowControls;

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
  gap: 2px;
`;

export const BaseButton = styled.button`
  width: 21px;
  height: 21px;
  min-width: 21px;
  min-height: 21px;
  max-width: 21px;
  max-height: 21px;
  box-sizing: border-box;
  border: 0;
  margin-right: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: none;
  cursor: default;
  position: relative;
  flex-shrink: 0;
  overflow: visible;
  background-color: transparent;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 21px 21px;
`;

const ImageWindowControl = styled(BaseButton)<{
  $normal?: string;
  $hover?: string;
  $active?: string;
}>`
  background-image: url(${({ $normal }) => $normal ?? 'none'});

  &:hover {
    background-image: url(${({ $hover, $normal }) => $hover ?? $normal ?? 'none'});
  }

  &:active {
    background-image: url(${({ $active, $normal }) => $active ?? $normal ?? 'none'});
  }
`;

export const MinimizeBtn = styled(ImageWindowControl).attrs({
  $normal: minimize.normal,
  $hover: minimize.hover,
  $active: minimize.active,
})``;

export const MaximizeBtn = styled(ImageWindowControl).attrs({
  $normal: maximize.normal,
  $hover: maximize.hover,
  $active: maximize.active,
})``;

export const RestoreBtn = styled(ImageWindowControl).attrs({
  $normal: restore.normal,
  $hover: restore.hover,
  $active: restore.active,
})``;

export const CloseBtn = styled(ImageWindowControl).attrs({
  $normal: close.normal,
  $hover: close.hover,
  $active: close.active,
})`
  margin-right: 0;
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
