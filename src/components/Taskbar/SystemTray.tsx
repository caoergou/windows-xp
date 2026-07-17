import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useTray } from '../../context/TrayContext';
import { useWindowManagerActions } from '../../context/WindowManagerContext';
import SystemClock from '../SystemClock';
import VolumePopup from '../VolumePopup';
import XPIcon from '../XPIcon';
import ContextMenu from '../ContextMenu';
import NetworkConnections from '../../apps/NetworkConnections';
import VolumeControl from '../../apps/VolumeControl';
import type { MenuItem } from '../../types';
import { resolveOSTheme } from '../../themes/useOSTheme';

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
  background: ${({ theme }) => resolveOSTheme(theme).tokens.TRAY_GRADIENT};
  border-left: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.TRAY_BORDER};
  box-shadow: inset 1px 0 1px ${({ theme }) => resolveOSTheme(theme).tokens.TRAY_HILIGHT};
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
  contextMenuItems?: MenuItem[];
}

interface SystemTrayProps {
  trayItems?: TrayItem[];
}

const SystemTray: React.FC<SystemTrayProps> = () => {
  const { t } = useTranslation();
  const { items: trayItems } = useTray();
  const { openWindow } = useWindowManagerActions();
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [trayMenu, setTrayMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(
    null
  );
  const trayRef = useRef<HTMLDivElement>(null);

  const handleTrayContextMenu = useCallback((e: React.MouseEvent, items?: MenuItem[]) => {
    if (!items || items.length === 0) return;
    e.preventDefault();
    e.stopPropagation();
    setTrayMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const openNetworkConnections = useCallback(() => {
    openWindow(
      'NetworkConnections',
      t('apps.networkConnections'),
      <NetworkConnections />,
      'network',
      { width: 388, height: 452, resizable: false }
    );
  }, [openWindow, t]);

  const handleToggleVolume = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setVolumeOpen(prev => !prev);
  }, []);

  // Double-clicking the speaker opens the full sndvol32 (VolumeControl), matching
  // real XP. Without this the registered VolumeControl app is unreachable (#223).
  const openVolumeControl = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setVolumeOpen(false);
      openWindow('VolumeControl', t('apps.volumeControl'), <VolumeControl />, 'volume', {
        width: 320,
        height: 300,
        resizable: false,
        singleton: true,
      });
    },
    [openWindow, t]
  );

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
          data-tray-id={item.id}
          $clickable={!!item.onClick || !!item.contextMenuItems?.length}
          title={item.tooltip || ''}
          onClick={
            item.onClick
              ? e => {
                  e.stopPropagation();
                  item.onClick?.();
                }
              : undefined
          }
          onContextMenu={e => handleTrayContextMenu(e, item.contextMenuItems)}
        >
          <XPIcon name={item.icon} size={16} color="white" />
        </TrayIconWrapper>
      ))}
      {trayMenu && (
        <ContextMenu
          visible
          x={trayMenu.x}
          y={trayMenu.y}
          menuItems={trayMenu.items}
          onClose={() => setTrayMenu(null)}
        />
      )}
      <TrayIconWrapper
        data-tray-id="volume"
        $clickable
        title={t('tray.volume')}
        onClick={handleToggleVolume}
        onDoubleClick={openVolumeControl}
      >
        <XPIcon name="sound" size={16} color="white" />
        {volumeOpen && <VolumePopup onClose={() => setVolumeOpen(false)} />}
      </TrayIconWrapper>
      <TrayIconWrapper
        data-tray-id="network"
        $clickable
        title={t('tray.networkConnected')}
        onClick={openNetworkConnections}
      >
        <XPIcon name="network" size={16} color="white" />
      </TrayIconWrapper>
      <SystemClock />
    </SystemTrayContainer>
  );
};

export default SystemTray;
