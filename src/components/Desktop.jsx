import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../context/FileSystemContext';
import { useWindowManager } from '../context/WindowManagerContext';
import Taskbar from './Taskbar';
import Window from './Window';
import ContextMenu from './ContextMenu';
import XPIcon from './XPIcon';
import { resolveFileOpen } from '../registry/apps.jsx';
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

const DragOverlay = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.8;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  text-shadow: 1px 1px 2px black;
`;

const Desktop = () => {
  const { t } = useTranslation();
  const { fs, moveFile } = useFileSystem();
  const { windows, openWindow, focusWindow } = useWindowManager();
  const { showModal } = useModal();

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pasteDisabled, setPasteDisabled] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const handleIconDoubleClick = (key, item) => {
    const resolved = resolveFileOpen(key, item);
    if (!resolved) {
      showModal(item.name, `找不到文件 "${item.name}"。\n请确认文件名是否正确，然后再试一次。`, 'error');
      return;
    }
    openWindow(resolved.appId, item.name, resolved.component, resolved.icon, resolved.windowProps);
  };

  const handleDragStart = (e, key, item) => {
    setDraggedItem({ key, item });
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDrag = (e) => {
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = (e, targetKey) => {
    // 如果拖拽到了另一个文件夹上
    if (targetKey && targetKey !== draggedItem?.key) {
      const targetItem = fs.root.children[targetKey];
      if (targetItem && targetItem.type === 'folder') {
        // 将文件移动到目标文件夹
        moveFile([], draggedItem.key, [targetKey]);
      }
    }
    setDraggedItem(null);
  };

  const handleContextMenu = async (e) => {
    e.preventDefault();
    try {
      const clipboardText = await navigator.clipboard.readText();
      setPasteDisabled(clipboardText.trim() === '');
    } catch (err) {
      setPasteDisabled(true);
    }
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
      '我的电脑': 'desktop.myComputer',
      '我的文档': 'desktop.myDocuments',
      '回收站': 'desktop.recycleBin',
      'Internet Explorer': 'desktop.internetExplorer'
    };
    return nameMap[key] ? t(nameMap[key]) : name;
  };

  const desktopMenuItems = [
    { label: t('contextMenu.refresh'), action: handleRefresh },
    { type: 'separator' },
    { label: t('contextMenu.paste'), action: () => {}, disabled: pasteDisabled },
    { type: 'separator' },
    { label: t('contextMenu.new'), action: () => {} },
    { type: 'separator' },
    { label: t('contextMenu.properties'), action: () => {} }
  ];

  const desktopItems = fs.root.children;

  return (
    <DesktopContainer $bgUrl={desktopBg} onContextMenu={handleContextMenu}>
      <IconGrid key={refreshKey} style={{ opacity: isRefreshing ? 0 : 1 }}>
        {Object.entries(desktopItems).map(([key, item]) => {
          const iconName = (key === '回收站' && item.children && Object.keys(item.children).length > 0)
            ? 'recycle_bin_full'
            : item.icon;
          return (
            <DesktopIcon
              key={key}
              data-testid={`desktop-icon-${key}`}
              onDoubleClick={() => handleIconDoubleClick(key, item)}
              draggable
              onDragStart={(e) => handleDragStart(e, key, item)}
              onDrag={(e) => handleDrag(e)}
              onDragEnd={(e) => handleDragEnd(e, null)}
              onDragOver={(e) => e.preventDefault()} // 允许放置
              onDrop={(e) => handleDragEnd(e, key)}
            >
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

      <AntivirusPopup />
    </DesktopContainer>
  );
};

export default Desktop;
