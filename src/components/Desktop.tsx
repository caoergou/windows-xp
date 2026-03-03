import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../context/FileSystemContext';
import { useWindowManager } from '../context/WindowManagerContext';
import Taskbar from './Taskbar';
import Window from './Window';
import ContextMenu from './ContextMenu';
import XPIcon from './XPIcon';
import FileProperties from './FileProperties';
import { resolveFileOpen } from '../registry/apps.jsx';
import AntivirusPopup from './AntivirusPopup';
import { useModal } from '../context/ModalContext';
import desktopBg from '../assets/images/desktop_bg.jpg';
import { FileItem } from '../types';

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
  gap: 5px;
  align-content: flex-start;
`;

const DesktopIcon = styled.div<{ $selected?: boolean }>`
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border: 1px solid transparent;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);

  ${props => props.$selected && `
    background-color: rgba(0, 51, 153, 0.5);
    border: 1px dotted rgba(255,255,255,0.6);
  `}

  &:hover {
    background-color: rgba(0, 51, 153, 0.3);
    border: 1px solid rgba(0, 51, 153, 0.5);
  }

  .icon-wrapper {
    position: relative;
    margin-bottom: 5px;
    filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.7));
  }

  span {
    font-size: 12px;
    text-align: center;
    width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    line-height: 1.3;
  }
`;

const ShortcutArrow = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 12px;
  height: 12px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// System icons that are not shortcuts (no shortcut arrow in XP)
const SYSTEM_ICONS = new Set(['我的电脑', '我的文档', '回收站', '网上邻居']);

const Desktop: React.FC = () => {
  const { t } = useTranslation();
  const { fs, moveFile, deleteFile, renameFile } = useFileSystem();
  const { windows, openWindow, focusWindow } = useWindowManager();
  const { showModal, showConfirm, showInput } = useModal();

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; iconKey: string | null }>({ visible: false, x: 0, y: 0, iconKey: null });
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pasteDisabled, setPasteDisabled] = useState(true);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleIconDoubleClick = (key: string, item: FileItem) => {
    const resolved = resolveFileOpen(key, item);
    if (!resolved) {
      showModal(item.name, `找不到文件 "${item.name}"。\n请确认文件名是否正确，然后再试一次。`, 'error');
      return;
    }
    openWindow(resolved.appId, item.name, resolved.component, resolved.icon, resolved.windowProps);
  };

  const handleDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnFolder = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    const targetItem = fs.root.children[targetKey];
    if (!targetItem || targetItem.type !== 'folder') return;

    const srcKey = e.dataTransfer.getData('text/plain');
    if (!srcKey || srcKey === targetKey) return;

    moveFile([], srcKey, [targetKey]);
  };

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const clipboardText = await navigator.clipboard.readText();
      setPasteDisabled(clipboardText.trim() === '');
    } catch (err) {
      setPasteDisabled(true);
    }
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, iconKey: null });
  };

  const handleIconContextMenu = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIcon(key);
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, iconKey: key });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, iconKey: null });
  };

  const handleIconDelete = (key: string) => {
    const item = fs.root.children[key];
    showConfirm('确认删除', `确定要把 "${item?.name}" 移到回收站吗？`, 'warning').then(confirmed => {
      if (confirmed) {
        deleteFile([], key);
      }
    });
    closeContextMenu();
  };

  const handleIconRename = (key: string) => {
    const item = fs.root.children[key];
    if (!item) return;
    showInput('重命名', '请输入新名称：', item.name).then(newName => {
      if (newName && newName.trim() !== '') {
        renameFile([], key, newName.trim());
      }
    });
    closeContextMenu();
  };

  const handleIconProperties = (key: string) => {
    const item = fs.root.children[key];
    if (!item) return;
    openWindow(
      `properties-${key}`,
      `${item.name} 属性`,
      <FileProperties fileItem={item} parentPath={[]} />,
      'properties'
    );
    closeContextMenu();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  // Translate desktop icon names
  const translateIconName = (key: string, name: string) => {
    const nameMap: Record<string, string> = {
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

  const getIconMenuItems = (key: string) => {
    const item = fs.root.children[key];
    if (!item) return desktopMenuItems;
    const isSystem = SYSTEM_ICONS.has(key);
    const items = [
      { label: '打开', action: () => { handleIconDoubleClick(key, item); closeContextMenu(); } },
      { type: 'separator' },
    ];
    if (!isSystem) {
      items.push(
        { label: '剪切', action: () => {} },
        { label: '复制', action: () => {} },
        { type: 'separator' },
        { label: '删除', action: () => handleIconDelete(key) },
        { label: '重命名', action: () => handleIconRename(key) },
      );
    }
    items.push(
      { type: 'separator' },
      { label: '属性', action: () => handleIconProperties(key) }
    );
    return items;
  };

  const desktopItems = fs.root.children;

  const activeMenuItems = contextMenu.iconKey
    ? getIconMenuItems(contextMenu.iconKey)
    : desktopMenuItems;

  return (
    <DesktopContainer $bgUrl={desktopBg} onContextMenu={handleContextMenu} onClick={() => setSelectedIcon(null)}>
      <IconGrid key={refreshKey} style={{ opacity: isRefreshing ? 0 : 1 }}>
        {Object.entries(desktopItems).map(([key, item]) => {
          const iconName = (key === '回收站' && item.children && Object.keys(item.children).length > 0)
            ? 'recycle_bin_full'
            : item.icon;
          const isShortcut = !SYSTEM_ICONS.has(key);
          return (
            <DesktopIcon
              key={key}
              $selected={selectedIcon === key}
              data-testid={`desktop-icon-${key}`}
              onClick={(e) => { e.stopPropagation(); setSelectedIcon(key); }}
              onDoubleClick={() => handleIconDoubleClick(key, item)}
              onContextMenu={(e) => handleIconContextMenu(e, key)}
              draggable
              onDragStart={(e) => handleDragStart(e, key)}
              onDragOver={(e) => {
                if (item.type === 'folder') {
                  e.preventDefault();
                  setDragOver(key);
                }
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDropOnFolder(e, key)}
              style={dragOver === key && item.type === 'folder' ? {
                background: 'rgba(193, 210, 238, 0.5)',
                border: '1px dashed #316AC5',
                borderRadius: '4px'
              } : undefined}
            >
              <div className="icon-wrapper">
                <XPIcon name={iconName} size={32} />
                {/* 快捷方式箭头已移除 */}
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
        menuItems={activeMenuItems}
      />

      <AntivirusPopup />
    </DesktopContainer>
  );
};

export default Desktop;
