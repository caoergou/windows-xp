import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../XPIcon';
import { xpScrollbarStyles } from '../../theme';
import { COLORS } from '../../themes/xp/tokens';
import { AppRegistryEntry } from '../../types';

const FlyoutContainer = styled.div`
  position: absolute;
  left: calc(100% - 2px);
  bottom: 1px;
  min-width: 180px;
  max-width: 260px;
  max-height: calc(100vh - ${COLORS.TASKBAR_HEIGHT + 2}px);
  background: #fff;
  border: 1px solid #003c74;
  box-shadow: 2px 2px 0 #808080;
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
  color: #000;

  &:hover {
    background: #316ac5;
    color: #fff;
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
