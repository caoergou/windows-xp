import React from 'react';
import styled, { type DefaultTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { resolveOSTheme } from '../../themes/useOSTheme';
import type { ButtonStateImages } from '../../themes/contract';

const controlImages = (theme: DefaultTheme, key: 'minimize' | 'maximize' | 'restore' | 'close') =>
  resolveOSTheme(theme).assets.windowControls?.[key];

const controlAttrs =
  (key: 'minimize' | 'maximize' | 'restore' | 'close') => (props: { theme: DefaultTheme }) => {
    const images: ButtonStateImages | undefined = controlImages(props.theme, key);
    if (!images) return {};
    return { $normal: images.normal, $hover: images.hover, $active: images.active };
  };

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

export const MinimizeBtn = styled(ImageWindowControl).attrs(controlAttrs('minimize'))``;

export const MaximizeBtn = styled(ImageWindowControl).attrs(controlAttrs('maximize'))``;

export const RestoreBtn = styled(ImageWindowControl).attrs(controlAttrs('restore'))``;

export const CloseBtn = styled(ImageWindowControl).attrs(controlAttrs('close'))`
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
