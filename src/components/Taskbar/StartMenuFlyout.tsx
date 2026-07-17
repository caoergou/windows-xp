import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../XPIcon';
import { xpScrollbarStyles } from '../../theme';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { AppRegistryEntry } from '../../types';

const FlyoutContainer = styled.div`
  position: absolute;
  left: calc(100% - 2px);
  bottom: 1px;
  min-width: 180px;
  max-width: 260px;
  max-height: calc(100vh - ${({ theme }) => resolveOSTheme(theme).tokens.TASKBAR_HEIGHT + 2}px);
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  box-shadow: 2px 2px 0 ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  z-index: 20001;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  ${xpScrollbarStyles}
`;

const FlyoutItem = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};

  &:hover {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.MENU_HIGHLIGHT};
    color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  }

  .flyout-icon {
    margin-right: 6px;
    flex-shrink: 0;
  }

  .flyout-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

interface StartMenuFlyoutProps {
  apps: AppRegistryEntry[];
  onLaunch: (appId: string) => void;
}

const StartMenuFlyout: React.FC<StartMenuFlyoutProps> = ({ apps, onLaunch }) => {
  const { t } = useTranslation();

  return (
    <FlyoutContainer data-testid="start-menu-flyout">
      {apps.map(app => (
        <FlyoutItem
          key={app.id}
          data-testid={`flyout-app-${app.id}`}
          onClick={() => onLaunch(app.id)}
        >
          <XPIcon name={app.icon || 'app_window'} size={20} className="flyout-icon" />
          <span className="flyout-label">{app.nameKey ? t(app.nameKey, app.name) : app.name}</span>
        </FlyoutItem>
      ))}
    </FlyoutContainer>
  );
};

export default StartMenuFlyout;
