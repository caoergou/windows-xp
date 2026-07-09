import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../context/FileSystemContext';
import { useWindowManager } from '../context/WindowManagerContext';
import Taskbar from './Taskbar';
import Window from './Window';
import ContextMenu from './ContextMenu';
import XPIcon from './XPIcon';
import FileProperties from './FileProperties';
import { resolveFileOpen } from '../registry/apps';
import AntivirusPopup from './AntivirusPopup';
import { useModal } from '../context/ModalContext';
import StickyNote from './StickyNote';
import desktopBg from '../assets/images/desktop_bg.jpg';
import { FileItem, FileNode, MenuItem, RootNode, isContainerNode } from '../types';

const DesktopContainer = styled.div<{ $bgUrl: string }>`
  width: 100%;
  height: 100%;
  background-color: #3A6EA5;
  background-image: url(${props => props.$bgUrl});
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
`;

const SelectionBox = styled.div<{ $left: number; $top: number; $width: number; $height: number }>`
  position: absolute;
  left: ${props => props.$left}px;
  top: ${props => props.$top}px;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
  border: 1px dotted #fff;
  background-color: rgba(49, 106, 197, 0.3);
  pointer-events: none;
  z-index: 1000;
  box-sizing: border-box;
`;

const IconGrid = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: calc(100% - 30px);
  padding: 10px;
  gap: 0px;
  align-content: flex-start;
`;

const DesktopIcon = styled.div<{ $selected?: boolean }>`
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 4px 2px;
  margin: 2px;
  border: 1px solid transparent;
  color: white;
  position: relative;
  box-sizing: border-box;

  ${props => props.$selected && `
    border: 1px dotted #fff;
  `}

  &:hover {
    ${props => !props.$selected && `
      background-color: rgba(49, 106, 197, 0.3);
      border: 1px dotted rgba(255, 255, 255, 0.5);
    `}
  }

  .icon-wrapper {
    position: relative;
    margin-bottom: 4px;
    filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.7));
  }

  span {
    font-size: 11px;
    font-family: Tahoma, SimSun, Microsoft YaHei, sans-serif;
    text-align: center;
    width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    line-height: 1.2;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    padding: 1px 2px;
    background-color: transparent;

    ${props => props.$selected && `
      background-color: #316AC5;
      text-shadow: none;
    `}
  }
`;

// Windows XP-style shortcut overlay: a small white badge in the bottom-left
// corner of the icon holding a black arrow that points up and to the right.
const ShortcutArrow: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    aria-hidden="true"
    style={{
      position: 'absolute',
      bottom: -2,
      left: -2,
      pointerEvents: 'none',
      zIndex: 2,
      filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.4))',
    }}
  >
    <rect
      x="1"
      y="1"
      width="22"
      height="22"
      rx="2.5"
      fill="#ffffff"
      stroke="#9a9a9a"
      strokeWidth="1.25"
    />
    <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z" fill="#1a1a1a" />
  </svg>
);

// System icons that are not shortcuts (no shortcut arrow in XP)
const SYSTEM_ICONS = new Set(['我的电脑', '我的文档', '回收站', '网上邻居']);

const Desktop: React.FC = () => {
  const { t } = useTranslation();
  const { fs, moveFile, deleteFile, renameFile } = useFileSystem();
  const rootChildren = (fs.root as RootNode).children;
  const { windows, openWindow } = useWindowManager();
  const { showModal, showConfirm, showInput } = useModal();

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; iconKey: string | null }>({ visible: false, x: 0, y: 0, iconKey: null });
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pasteDisabled, setPasteDisabled] = useState(true);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Box selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const iconRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleIconSelection = (key: string, e: React.MouseEvent) => {
    if (e.ctrlKey) {
      // Ctrl+Click: toggle single selection
      const newSelected = new Set(selectedIcons);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      setSelectedIcons(newSelected);
    } else {
      // Normal click: select only this one
      setSelectedIcons(new Set([key]));
    }
  };

  // Box selection handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button

    // Only start a rubber-band selection when the press begins directly on the
    // empty desktop background (the container itself or the icon grid). Any
    // other target — most importantly a window title bar or resize handle,
    // whose mousedown bubbles up here without stopping propagation — must be
    // ignored, otherwise a selection rectangle would appear while dragging or
    // resizing a window.
    const target = e.target as HTMLElement;
    const isBackground =
      target === containerRef.current || target.classList.contains('desktop-icon-grid');
    if (!isBackground) return;

    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsSelecting(true);
    setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (!e.ctrlKey) {
      setSelectedIcons(new Set());
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Update selection
    const newSelected = new Set(e.ctrlKey ? selectedIcons : []);

    // Calculate selection bounds
    const left = Math.min(selectionStart.x, e.clientX - rect.left);
    const right = Math.max(selectionStart.x, e.clientX - rect.left);
    const top = Math.min(selectionStart.y, e.clientY - rect.top);
    const bottom = Math.max(selectionStart.y, e.clientY - rect.top);

    // Check each icon
    iconRefs.current.forEach((iconEl, key) => {
      if (!iconEl) return;

      const iconRect = iconEl.getBoundingClientRect();
      const containerRect = rect;

      const iconLeft = iconRect.left - containerRect.left;
      const iconRight = iconRect.right - containerRect.left;
      const iconTop = iconRect.top - containerRect.top;
      const iconBottom = iconRect.bottom - containerRect.top;

      // Check for intersection
      const intersects = !(iconRight < left || iconLeft > right ||
                           iconBottom < top || iconTop > bottom);

      if (intersects) {
        if (e.ctrlKey && selectedIcons.has(key)) {
          newSelected.delete(key);
        } else {
          newSelected.add(key);
        }
      } else if (e.ctrlKey && selectedIcons.has(key)) {
        newSelected.add(key);
      }
    });

    setSelectedIcons(newSelected);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

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

    const targetItem = rootChildren[targetKey];
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
    if (!selectedIcons.has(key)) {
      setSelectedIcons(new Set([key]));
    }
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, iconKey: key });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, iconKey: null });
  };

  const handleIconDelete = (key: string) => {
    const keysToDelete = selectedIcons.size > 0 && selectedIcons.has(key)
      ? Array.from(selectedIcons)
      : [key];

    const itemsToDelete = keysToDelete.map(k => rootChildren[k]).filter(Boolean);

    if (itemsToDelete.length === 0) {
      closeContextMenu();
      return;
    }

    const message = itemsToDelete.length === 1
      ? `确定要把 "${itemsToDelete[0].name}" 移到回收站吗？`
      : `确定要把选中的 ${itemsToDelete.length} 个项目移到回收站吗？`;

    showConfirm('确认删除', message, 'warning').then(confirmed => {
      if (confirmed) {
        keysToDelete.forEach(k => deleteFile([], k));
        setSelectedIcons(new Set());
      }
    });
    closeContextMenu();
  };

  const handleIconRename = (key: string) => {
    const item = rootChildren[key];
    if (!item) return;
    showInput('重命名', '请输入新名称：', item.name).then(newName => {
      if (newName && newName.trim() !== '') {
        renameFile([], key, newName.trim());
      }
    });
    closeContextMenu();
  };

  const handleIconProperties = (key: string) => {
    const item = rootChildren[key];
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

  const desktopMenuItems: MenuItem[] = [
    { label: t('contextMenu.refresh'), action: handleRefresh },
    { type: 'separator' },
    { label: t('contextMenu.paste'), action: () => undefined, disabled: pasteDisabled },
    { type: 'separator' },
    { label: t('contextMenu.new'), action: () => undefined, disabled: true },
    { type: 'separator' },
    { label: t('contextMenu.properties'), action: () => undefined, disabled: true }
  ];

  const getIconMenuItems = (key: string): MenuItem[] => {
    const item = rootChildren[key];
    if (!item) return desktopMenuItems;
    const isSystem = SYSTEM_ICONS.has(key);
    const items: MenuItem[] = [
      { label: '打开', action: () => { handleIconDoubleClick(key, item); closeContextMenu(); } },
      { type: 'separator' },
    ];
    if (!isSystem) {
      items.push(
        { label: '剪切', action: () => undefined },
        { label: '复制', action: () => undefined },
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

  const desktopItems = rootChildren;

  const activeMenuItems = contextMenu.iconKey
    ? getIconMenuItems(contextMenu.iconKey)
    : desktopMenuItems;

  return (
    <DesktopContainer
      ref={containerRef}
      $bgUrl={desktopBg}
      onContextMenu={handleContextMenu}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.desktop-icon-selectable') &&
            !target.closest('[data-testid^="desktop-icon-"]')) {
          setSelectedIcons(new Set());
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <IconGrid key={refreshKey} className="desktop-icon-grid" style={{ opacity: isRefreshing ? 0 : 1 }}>
        {Object.entries(desktopItems || {}).map(([key, item]: [string, FileNode]) => {
          const iconName = (key === '回收站' && isContainerNode(item) && item.children && Object.keys(item.children).length > 0)
            ? 'recycle_bin_full'
            : item.icon;
          const isShortcut = !SYSTEM_ICONS.has(key);
          return (
            <DesktopIcon
              key={key}
              ref={(el) => {
                if (el) {
                  iconRefs.current.set(key, el);
                } else {
                  iconRefs.current.delete(key);
                }
              }}
              $selected={selectedIcons.has(key)}
              data-testid={`desktop-icon-${key}`}
              className="desktop-icon-selectable"
              data-icon-key={key}
              title={item.name}
              onClick={(e) => { e.stopPropagation(); toggleIconSelection(key, e); }}
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
                border: '1px dashed #316AC5'
              } : undefined}
            >
              <div className="icon-wrapper">
                <XPIcon name={iconName || 'app_window'} size={32} />
                {isShortcut && <ShortcutArrow />}
              </div>
              <span>{translateIconName(key, item.name)}</span>
            </DesktopIcon>
          );
        })}
      </IconGrid>

      {/* Selection Box */}
      {isSelecting && (
        <SelectionBox
          $left={Math.min(selectionStart.x, selectionEnd.x)}
          $top={Math.min(selectionStart.y, selectionEnd.y)}
          $width={Math.abs(selectionEnd.x - selectionStart.x)}
          $height={Math.abs(selectionEnd.y - selectionStart.y)}
        />
      )}

      {windows.map(win => (
        <Window key={win.id} windowState={win} />
      ))}

      <StickyNote />

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
