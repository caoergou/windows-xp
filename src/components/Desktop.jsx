import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../context/FileSystemContext';
import { useWindowManager } from '../context/WindowManagerContext';
import Taskbar from './Taskbar';
import Window from './Window';
import ContextMenu from './ContextMenu';
import Explorer from '../apps/Explorer';
import InternetExplorer from '../apps/InternetExplorer';
import Notepad from '../apps/Notepad';
import PhotoViewer from '../apps/PhotoViewer';
import XPIcon from './XPIcon';
import StickyNote from './StickyNote';
import AntivirusPopup from './AntivirusPopup';
import { useModal } from '../context/ModalContext';
import desktopBg from '../assets/images/desktop_bg.jpg';

const DesktopContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #3A6EA5;
  background-image: url(${props => props.$bgUrl});
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
`;

const IconGrid = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: calc(100% - 30px);
  padding: 10px;
  gap: 10px;
  align-content: flex-start;
`;

const DesktopIcon = styled.div`
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border: 1px solid transparent;
  color: white;
  text-shadow: 1px 1px 2px black;

  &:hover {
    background-color: rgba(0, 51, 153, 0.3);
    border: 1px solid rgba(0, 51, 153, 0.5);
  }

  .icon-wrapper {
    margin-bottom: 5px;
    filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.7));
  }

  span {
    font-size: 12px;
    text-align: center;
  }
`;

const Desktop = () => {
  const { t } = useTranslation();
  const { fs } = useFileSystem();
  const { windows, openWindow, focusWindow } = useWindowManager();
  const { showModal } = useModal();

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleIconDoubleClick = (key, item) => {
    if (item.type === 'folder' || item.type === 'root') {
      openWindow(key, item.name, <Explorer initialPath={[key]} />, item.icon || 'folder', { width: 800, height: 550 });
    } else if (item.type === 'app_shortcut') {
      if (item.app === 'InternetExplorer') {
        openWindow(key, item.name, <InternetExplorer url={item.url || 'about:blank'} />, item.icon, { isMaximized: true });
      } else if (item.app === 'Notepad') {
        openWindow(key, item.name, <Notepad content={item.content || ''} />, 'file', { width: 600, height: 400 });
      } else if (item.app === 'DummyApp') {
        showModal(item.name, 'Windows 无法打开此文件。请确认程序已正确安装。', 'error');
      }
    } else if (item.type === 'file') {
      if (item.app === 'Notepad') {
        openWindow(key, item.name, <Notepad content={item.content} readOnly={item.readOnly} />, 'file');
      } else if (item.app === 'InternetExplorer') {
        if (item.isHtmlContent) {
          openWindow(key, item.name, <InternetExplorer html={item.content} />, 'html', { isMaximized: true });
        } else {
          openWindow(key, item.name, <InternetExplorer url={item.content} />, 'html', { isMaximized: true });
        }
      } else if (item.app === 'PhotoViewer') {
        openWindow(key, item.name, <PhotoViewer src={item.content} />, 'image', { width: 600, height: 500 });
      }
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  // Translate desktop icon names
  const translateIconName = (key, name) => {
    const nameMap = {
      'My Computer': 'desktop.myComputer',
      'My Documents': 'desktop.myDocuments',
      'Recycle Bin': 'desktop.recycleBin',
      'Internet Explorer': 'desktop.internetExplorer'
    };
    return nameMap[key] ? t(nameMap[key]) : name;
  };

  const desktopMenuItems = [
    { label: t('contextMenu.refresh'), icon: 'refresh', action: handleRefresh },
    { type: 'separator' },
    { label: t('contextMenu.paste'), icon: 'paste', action: () => {} },
    { type: 'separator' },
    { label: t('contextMenu.new'), icon: 'new_folder', action: () => {} },
    { type: 'separator' },
    { label: t('contextMenu.properties'), icon: 'properties', action: () => {} }
  ];

  const desktopItems = fs.root.children;

  return (
    <DesktopContainer $bgUrl={desktopBg} onContextMenu={handleContextMenu}>
      <IconGrid key={refreshKey} style={{ opacity: isRefreshing ? 0 : 1 }}>
        {Object.entries(desktopItems).map(([key, item]) => {
          const iconName = (key === 'Recycle Bin' && item.children && Object.keys(item.children).length > 0)
            ? 'recycle_bin_full'
            : item.icon;
          return (
            <DesktopIcon key={key} data-testid={`desktop-icon-${key}`} onDoubleClick={() => handleIconDoubleClick(key, item)}>
              <div className="icon-wrapper">
                <XPIcon name={iconName} size={32} />
              </div>
              <span>{translateIconName(key, item.name)}</span>
            </DesktopIcon>
          );
        })}
      </IconGrid>

      {windows.map(win => (
        <Window key={win.id} windowState={win} />
      ))}

      <Taskbar />

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
        menuItems={desktopMenuItems}
      />

      <StickyNote />
      <AntivirusPopup />
    </DesktopContainer>
  );
};

export default Desktop;
