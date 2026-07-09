import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useTray } from '../../context/TrayContext';
import { useWindowManager } from '../../context/WindowManagerContext';
import SystemClock from '../SystemClock';
import LanguageSwitcher from '../LanguageSwitcher';
import VolumePopup from '../VolumePopup';
import XPIcon from '../XPIcon';
import NetworkConnections from '../../apps/NetworkConnections';

const SystemTrayContainer = styled.div`
  height: 30px;
  min-width: 120px;
  padding: 0 6px;
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
  height: 22px;
  min-width: 22px;
  margin: 0 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => (props.$clickable ? 'pointer' : 'default')};
  border: 1px solid transparent;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    background: rgba(0, 0, 0, 0.1);
    box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.3);
  }
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
  const { openWindow } = useWindowManager();
  const [volumeOpen, setVolumeOpen] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);

  const openNetworkConnections = useCallback(() => {
    openWindow(
      'NetworkConnections',
      t('apps.networkConnections'),
      <NetworkConnections />,
      'network',
      { width: 400, height: 300 }
    );
  }, [openWindow, t]);

  const handleToggleVolume = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setVolumeOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (!volumeOpen) return undefined;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setVolumeOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [volumeOpen]);

  return (
    <SystemTrayContainer ref={trayRef}>
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
      <TrayIconWrapper
        $clickable
        title={t('tray.volume')}
        onClick={handleToggleVolume}
      >
        <XPIcon name="sound" size={16} color="white" />
        {volumeOpen && <VolumePopup onClose={() => setVolumeOpen(false)} />}
      </TrayIconWrapper>
      <TrayIconWrapper
        $clickable
        title={t('tray.networkConnected')}
        onClick={openNetworkConnections}
      >
        <XPIcon name="network" size={16} color="white" />
      </TrayIconWrapper>
      <LanguageSwitcher />
      <SystemClock />
    </SystemTrayContainer>
  );
};

export default SystemTray;
