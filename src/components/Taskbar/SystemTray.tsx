import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useTray } from '../../context/TrayContext';
import SystemClock from '../SystemClock';
import LanguageSwitcher from '../LanguageSwitcher';
import XPIcon from '../XPIcon';

const SystemTrayContainer = styled.div`
  height: 30px;
  min-width: 120px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  white-space: nowrap;
  background: linear-gradient(
    to bottom,
    #0c59b9 1%,
    #139ee9 6%,
    #18b5f2 10%,
    #139beb 14%,
    #1290e8 19%,
    #0d8dea 63%,
    #0d9ff1 81%,
    #0f9eed 88%,
    #119be9 91%,
    #1392e2 94%,
    #137ed7 97%,
    #095bc9 100%
  );
  border-left: 1px solid #1042af;
  box-shadow: inset 1px 0 1px #18bbff;
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
