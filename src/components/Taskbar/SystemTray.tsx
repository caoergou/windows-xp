import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useTray } from '../../context/TrayContext';
import SystemClock from '../SystemClock';
import LanguageSwitcher from '../LanguageSwitcher';
import XPIcon from '../XPIcon';

const SystemTrayContainer = styled.div`
  background: #0b96d5;
  height: 30px;
  min-width: 120px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  border-left: 1px solid #083e6e;
  box-shadow: inset 1px 1px 1px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
`;

const TrayIconWrapper = styled.div<{ $clickable?: boolean }>`
  margin-right: 8px;
  display: flex;
  align-items: center;
  cursor: ${props => (props.$clickable ? 'pointer' : 'default')};
`;

interface TrayItem {
  id: string;
  icon: string;
  tooltip?: string;
  onClick?: () => void;
}

interface SystemTrayProps {
  trayItems?: TrayItem[];
}

const SystemTray: React.FC<SystemTrayProps> = () => {
  const { t } = useTranslation();
  const { items: trayItems } = useTray();

  return (
    <SystemTrayContainer>
      {trayItems.map(item => (
        <TrayIconWrapper
          key={item.id}
          $clickable={!!item.onClick}
          title={item.tooltip || ''}
          onClick={item.onClick ? (e) => { e.stopPropagation(); item.onClick?.(); } : undefined}
        >
          <XPIcon name={item.icon} size={16} color="white" />
        </TrayIconWrapper>
      ))}
      <TrayIconWrapper title={t('tray.volume')}>
        <XPIcon name="sound" size={16} color="white" />
      </TrayIconWrapper>
      <TrayIconWrapper title={t('tray.networkConnected')}>
        <XPIcon name="network" size={16} color="white" />
      </TrayIconWrapper>
      <LanguageSwitcher />
      <SystemClock />
    </SystemTrayContainer>
  );
};

export default SystemTray;
