// Desktop shell — icons, box-selection, context menus, window host (#163/A split).
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../../context/FileSystemContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { useWindowManager } from '../../context/WindowManagerContext';
import { useUserSession } from '../../context/UserSessionContext';
import Taskbar from '../Taskbar';
import Window from '../Window';
import ContextMenu from '../ContextMenu';
import XPIcon from '../XPIcon';
import FileProperties from '../FileProperties';
import DesktopProperties from '../DesktopProperties';
import { resolveFileOpen } from '../../registry/apps';
import StartupNotifier from '../StartupNotifier';
import { useModal } from '../../context/ModalContext';
import { FileNode, MenuItem, RootNode, isContainerNode, isExternalLinkNode } from '../../types';
import { openExternalUrl } from '../../utils/externalLink';
import { getFileIconName } from '../../utils/fileIcon';
import { getFileDisplayName } from '../../utils/fileDisplayName';
import { DesktopContainer, SelectionBox, IconGrid, DesktopIcon } from './styled';
import { BOX_SELECT_IGNORE, SYSTEM_ICON_KEYS, getEnglishTestId } from './constants';

const Desktop: React.FC = () => {
  const { t } = useTranslation();
  const { wallpaper, resolveWallpaperSrc } = useUserSession();
  const desktopBg = resolveWallpaperSrc(wallpaper);
  const { fs, moveFile, deleteFile, renameFile, createFile, copyToClipboard, cutFile, pasteFile, clipboard } = useFileSystem();
  const rootChildren = (fs.root as RootNode).children;
  const { windows, openWindow } = useWindowManager();
  const bus = useXPEventBus();
  const { showModal, showConfirm, showInput } = useModal();

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; iconKey: string | null }>({ visible: false, x: 0, y: 0, iconKey: null });
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Box selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const iconRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);
  const selectionStartRef = useRef({ x: 0, y: 0 });
  const selectionEndRef = useRef({ x: 0, y: 0 });
  const baseSelectedRef = useRef<Set<string>>(new Set());
  const ctrlKeyRef = useRef(false);
  const suppressClickClearRef = useRef(false);

  const updateSelectionFromBox = useCallback((start: { x: number; y: number }, end: { x: number; y: number }, ctrlKey: boolean) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newSelected = new Set(ctrlKey ? baseSelectedRef.current : []);
    const left = Math.min(start.x, end.x);
    const right = Math.max(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const bottom = Math.max(start.y, end.y);

    iconRefs.current.forEach((iconEl, key) => {
      if (!iconEl) return;

      const iconRect = iconEl.getBoundingClientRect();
      const iconLeft = iconRect.left - rect.left;
      const iconRight = iconRect.right - rect.left;
      const iconTop = iconRect.top - rect.top;
      const iconBottom = iconRect.bottom - rect.top;

      const intersects = !(iconRight < left || iconLeft > right ||
                           iconBottom < top || iconTop > bottom);

      if (intersects) {
        if (ctrlKey && baseSelectedRef.current.has(key)) {
          newSelected.delete(key);
        } else {
          newSelected.add(key);
        }
      } else if (ctrlKey && baseSelectedRef.current.has(key)) {
        newSelected.add(key);
      }
    });

    setSelectedIcons(newSelected);
  }, []);

  useEffect(() => {
    return () => {
      isSelectingRef.current = false;
    };
  }, []);

  const toggleIconSelection = (key: string, e: React.MouseEvent) => {
    if (e.ctrlKey) {
      const newSelected = new Set(selectedIcons);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      setSelectedIcons(newSelected);
    } else {
      setSelectedIcons(new Set([key]));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(BOX_SELECT_IGNORE)) {
      return;
    }

    if (e.button !== 0) return;

    e.preventDefault();
    containerRef.current?.focus(); // desktop owns keyboard input (#87)
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isSelectingRef.current = true;
    selectionStartRef.current = start;
    selectionEndRef.current = start;
    ctrlKeyRef.current = e.ctrlKey;
    baseSelectedRef.current = e.ctrlKey ? new Set(selectedIcons) : new Set();
    setIsSelecting(true);
    setSelectionStart(start);
    setSelectionEnd(start);

    if (!e.ctrlKey) {
      setSelectedIcons(new Set());
    }

    const onMouseMove = (ev: MouseEvent) => {
      if (!isSelectingRef.current) return;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const current = {
        x: ev.clientX - containerRect.left,
        y: ev.clientY - containerRect.top,
      };
      selectionEndRef.current = current;
      setSelectionEnd(current);
      updateSelectionFromBox(selectionStartRef.current, current, ctrlKeyRef.current);
    };

    const onMouseUp = () => {
      if (!isSelectingRef.current) return;

      const startPos = selectionStartRef.current;
      const endPos = selectionEndRef.current;
      const dragged = Math.abs(endPos.x - startPos.x) > 4 || Math.abs(endPos.y - startPos.y) > 4;

      if (dragged) {
        updateSelectionFromBox(startPos, endPos, ctrlKeyRef.current);
        suppressClickClearRef.current = true;
      }

      isSelectingRef.current = false;
      setIsSelecting(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleIconDoubleClick = (key: string, item: FileNode) => {
    // External-link shortcut: leave the fiction instead of opening a window (#136).
    if (isExternalLinkNode(item)) {
      const newTab = item.newTab ?? true;
      openExternalUrl(item.href, newTab);
      bus.emit({ type: 'link:external', url: item.href, newTab, source: key });
      return;
    }
    const resolved = resolveFileOpen(key, item);
    bus.emit({ type: 'file:open', path: [key], name: item.name, nodeType: item.type, app: (item as { app?: string }).app });
    const displayName = getFileDisplayName(key, item, t);
    if (!resolved) {
      showModal(
        t('errors.fileNotFound'),
        t('errors.fileNotFoundMessage', { name: displayName }),
        'error'
      );
      return;
    }
    openWindow(resolved.appId, displayName, resolved.component, resolved.icon, {
      ...resolved.windowProps,
      sourcePath: [key],
    });
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

  const getOperableKeys = (keys: string[]) => keys.filter(k => !SYSTEM_ICON_KEYS.has(k));

  const resolveMenuKeys = (iconKey: string | null): string[] => {
    if (iconKey) {
      if (selectedIcons.has(iconKey) && selectedIcons.size > 1) {
        return Array.from(selectedIcons);
      }
      return [iconKey];
    }
    if (selectedIcons.size > 0) {
      return Array.from(selectedIcons);
    }
    return [];
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-xp-context-boundary="true"]')) return;
    e.preventDefault();
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
      ? getOperableKeys(Array.from(selectedIcons))
      : SYSTEM_ICON_KEYS.has(key) ? [] : [key];

    const itemsToDelete = keysToDelete
      .map(k => ({ key: k, item: rootChildren[k] }))
      .filter(({ item }) => Boolean(item));

    if (itemsToDelete.length === 0) {
      closeContextMenu();
      return;
    }

    const message = itemsToDelete.length === 1
      ? t('common.deleteConfirmSingle', { name: getFileDisplayName(itemsToDelete[0].key, itemsToDelete[0].item, t) })
      : t('common.deleteConfirmMultiple', { count: itemsToDelete.length });

    showConfirm(t('common.deleteConfirmTitle'), message, 'warning').then(confirmed => {
      if (confirmed) {
        keysToDelete.forEach(k => deleteFile([], k));
        setSelectedIcons(new Set());
      }
    });
    closeContextMenu();
  };

  const handleIconCopy = (keys: string[]) => {
    const operable = getOperableKeys(keys);
    if (operable.length === 0) return;
    copyToClipboard([], operable.length === 1 ? operable[0] : operable);
    closeContextMenu();
  };

  const handleIconCut = (keys: string[]) => {
    const operable = getOperableKeys(keys);
    if (operable.length === 0) return;
    cutFile([], operable.length === 1 ? operable[0] : operable);
    closeContextMenu();
  };

  const handlePaste = () => {
    pasteFile([]);
    closeContextMenu();
  };

  const handleOpenSelection = (keys: string[]) => {
    keys.forEach(k => {
      const item = rootChildren[k];
      if (item) handleIconDoubleClick(k, item);
    });
    closeContextMenu();
  };

  const handleIconRename = (key: string) => {
    const item = rootChildren[key];
    if (!item) return;
    showInput(t('common.renameTitle'), t('common.renamePrompt'), item.name).then(newName => {
      if (newName && newName.trim() !== '') {
        renameFile([], key, newName.trim());
      }
    });
    closeContextMenu();
  };

  const handleIconProperties = (key: string) => {
    const item = rootChildren[key];
    if (!item) return;
    const displayName = getFileDisplayName(key, item, t);
    openWindow(
      `properties-${key}`,
      t('common.propertiesTitle', { name: displayName }),
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

  const generateUniqueName = (baseName: string) => {
    const siblings = (fs.root as RootNode).children;
    if (!siblings[baseName]) return baseName;

    const dotIndex = baseName.lastIndexOf('.');
    const namePart = dotIndex > 0 ? baseName.slice(0, dotIndex) : baseName;
    const extPart = dotIndex > 0 ? baseName.slice(dotIndex) : '';

    let counter = 2;
    while (counter < 100) {
      const candidate = `${namePart} (${counter})${extPart}`;
      if (!siblings[candidate]) return candidate;
      counter += 1;
    }
    return baseName;
  };

  const handleNewFolder = () => {
    const name = generateUniqueName(t('desktop.newFolderName', 'New Folder'));
    createFile([], name, 'folder', { icon: 'folder' });
    closeContextMenu();
  };

  const handleNewTextDocument = () => {
    const name = generateUniqueName(t('desktop.newTextDocumentName', 'New Text Document.txt'));
    createFile([], name, 'file', { app: 'Notepad', icon: 'txt' });
    closeContextMenu();
  };

  const handleDesktopProperties = () => {
    openWindow(
      'DesktopProperties',
      t('desktop.propertiesTitle', 'Display Properties'),
      <DesktopProperties />,
      'properties',
      { width: 380, height: 320, resizable: false }
    );
    closeContextMenu();
  };

  const desktopMenuItems: MenuItem[] = [
    { label: t('contextMenu.refresh'), action: handleRefresh },
    { type: 'separator' },
    { label: t('contextMenu.paste'), action: handlePaste, disabled: !clipboard },
    { type: 'separator' },
    {
      label: t('contextMenu.new'),
      submenu: [
        { label: t('contextMenu.newFolder'), action: handleNewFolder, icon: 'folder' },
        { label: t('contextMenu.newTextDocument'), action: handleNewTextDocument, icon: 'txt' },
      ],
    },
    { type: 'separator' },
    { label: t('contextMenu.properties'), action: handleDesktopProperties }
  ];

  const buildIconMenuItems = (keys: string[]): MenuItem[] => {
    if (keys.length === 0) return desktopMenuItems;

    const operable = getOperableKeys(keys);
    const isMulti = keys.length > 1;
    const primaryKey = keys[0];
    const primaryItem = rootChildren[primaryKey];
    if (!primaryItem) return desktopMenuItems;

    const isSystem = !isMulti && primaryItem.type === 'folder' && SYSTEM_ICON_KEYS.has(primaryKey);

    const items: MenuItem[] = [
      {
        label: t('contextMenu.open'),
        action: () => {
          if (isMulti) {
            handleOpenSelection(keys);
          } else {
            handleIconDoubleClick(primaryKey, primaryItem);
            closeContextMenu();
          }
        },
      },
      { type: 'separator' },
    ];

    if (!isSystem || operable.length > 0) {
      items.push(
        { label: t('contextMenu.cut'), action: () => handleIconCut(keys), disabled: operable.length === 0 },
        { label: t('contextMenu.copy'), action: () => handleIconCopy(keys), disabled: operable.length === 0 },
        { type: 'separator' },
        { label: t('contextMenu.delete'), action: () => handleIconDelete(primaryKey), disabled: operable.length === 0 },
      );
      if (!isMulti && !isSystem) {
        items.push({ label: t('contextMenu.rename'), action: () => handleIconRename(primaryKey) });
      }
    }

    items.push(
      { type: 'separator' },
      {
        label: t('contextMenu.properties'),
        action: () => handleIconProperties(primaryKey),
        disabled: isMulti,
      },
    );

    return items;
  };

  const desktopItems = rootChildren;

  const activeMenuItems = buildIconMenuItems(resolveMenuKeys(contextMenu.iconKey));

  // Desktop keyboard operations (#87 DSK-03/04/05): F2 rename, Delete → recycle,
  // Enter open, Ctrl+A select all, arrow keys move the selection. Only when the
  // desktop has focus — never while typing or when a window/dialog is focused.
  // Latest values are read through a ref so the window listener stays mounted
  // once (no per-render re-subscribe, no stale closures).
  const keyOpsRef = useRef({
    rootChildren,
    selectedIcons,
    contextMenuVisible: contextMenu.visible,
    handleIconDelete,
    handleIconRename,
    handleOpenSelection,
  });
  keyOpsRef.current = {
    rootChildren,
    selectedIcons,
    contextMenuVisible: contextMenu.visible,
    handleIconDelete,
    handleIconRename,
    handleOpenSelection,
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null;
      if (ae) {
        const tag = ae.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae.isContentEditable) return;
        if (ae.closest('[data-xp-context-boundary]')) return; // a window/dialog is focused
      }
      const ops = keyOpsRef.current;
      if (ops.contextMenuVisible) return;

      const keys = Object.keys(ops.rootChildren);
      if (keys.length === 0) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setSelectedIcons(new Set(keys));
        return;
      }

      const selectedArr = Array.from(ops.selectedIcons);

      if (e.key === 'Delete') {
        if (selectedArr.length === 0) return;
        e.preventDefault();
        ops.handleIconDelete(selectedArr[0]);
      } else if (e.key === 'F2') {
        if (selectedArr.length !== 1) return;
        e.preventDefault();
        ops.handleIconRename(selectedArr[0]);
      } else if (e.key === 'Enter') {
        if (selectedArr.length === 0) return;
        e.preventDefault();
        ops.handleOpenSelection(selectedArr);
      } else if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault();
        const cur = selectedArr.length ? keys.indexOf(selectedArr[selectedArr.length - 1]) : -1;
        const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
        let next: number;
        if (cur < 0) next = 0;
        else if (forward) next = Math.min(keys.length - 1, cur + 1);
        else next = Math.max(0, cur - 1);
        setSelectedIcons(new Set([keys[next]]));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <DesktopContainer
      ref={containerRef}
      data-testid="desktop"
      tabIndex={-1}
      style={{ outline: 'none' }}
      $bgUrl={desktopBg}
      onContextMenu={handleContextMenu}
      onClick={(e) => {
        if (suppressClickClearRef.current) {
          suppressClickClearRef.current = false;
          return;
        }
        const target = e.target as HTMLElement;
        if (!target.closest('.desktop-icon-selectable') &&
            !target.closest('[data-testid^="desktop-icon-"]')) {
          setSelectedIcons(new Set());
        }
      }}
      onMouseDown={handleMouseDown}
    >
      <IconGrid key={refreshKey} style={{ opacity: isRefreshing ? 0 : 1 }}>
        {Object.entries(desktopItems || {}).map(([key, item]: [string, FileNode]) => {
          const iconName = (key === '回收站' && isContainerNode(item) && item.children && Object.keys(item.children).length > 0)
            ? 'recycle_bin_full'
            : getFileIconName(item.name, item.type, item.icon);
          const displayName = getFileDisplayName(key, item, t);
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
              data-english-testid={`desktop-icon-${getEnglishTestId(key, item)}`}
              className="desktop-icon-selectable"
              data-icon-key={key}
              title={displayName}
              onClick={(e) => {
                e.stopPropagation();
                // Focus the desktop so keyboard ops (F2/Del/Enter…) target it,
                // even right after interacting with a window (#87).
                containerRef.current?.focus();
                if (suppressClickClearRef.current) {
                  suppressClickClearRef.current = false;
                  return;
                }
                toggleIconSelection(key, e);
              }}
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
              </div>
              <span className="icon-label">{displayName}</span>
            </DesktopIcon>
          );
        })}
      </IconGrid>

      {isSelecting && (
        <SelectionBox
          data-testid="desktop-selection-box"
          $left={Math.min(selectionStart.x, selectionEnd.x)}
          $top={Math.min(selectionStart.y, selectionEnd.y)}
          $width={Math.abs(selectionEnd.x - selectionStart.x)}
          $height={Math.abs(selectionEnd.y - selectionStart.y)}
        />
      )}

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

      <StartupNotifier />
    </DesktopContainer>
  );
};

export default Desktop;
