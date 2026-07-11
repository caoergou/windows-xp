import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../../context/FileSystemContext';
import { useXPEventBus } from '../../context/EventBusContext';
import { useStorage } from '../../context/StorageContext';
import { useApp } from '../../hooks/useApp';
import XPIcon from '../../components/XPIcon';
import { getFileIconName } from '../../utils/fileIcon';
import ExplorerSidebar from '../../components/Explorer/ExplorerSidebar';
import ExplorerFolderTree from '../../components/Explorer/ExplorerFolderTree';
import ExplorerToolbar from '../../components/Explorer/ExplorerToolbar';
import AddressBar from '../../components/Explorer/AddressBar';
import ContextMenu from '../../components/ContextMenu';
import FileProperties from '../../components/FileProperties';
import { FileNode, MenuItem, isContainerNode, isFileContentNode } from '../../types';
import { getFileDisplayName } from '../../utils/fileDisplayName';
import {
  getSystemPathDisplay,
  getSystemPathTitle,
  resolveSystemPathDisplay,
} from '../../data/systemPaths';
import {
  Container, DetailsTable, DetailsHeadCell, DetailsRow, DetailsCell, DetailsNameCell, MainContent, FileArea, GroupHeader, IconsGrid, FileItem, IconWrapper, FileInfo, FileName, FileType, StatusBar, EmptyRecycleBinMessage,
} from './styled';
import { isOpticalDrive } from './helpers';
import type { ExplorerProps } from './types';

const Explorer: React.FC<ExplorerProps> = ({ initialPath = [], windowId }) => {
  const { t, i18n } = useTranslation();
  const {
    getFile,
    createFile,
    renameFile,
    deleteFile,
    cutFile,
    pasteFile,
    clipboard,
    emptyRecycleBin,
    restoreFromRecycleBin,
    moveFile,
    copyToClipboard,
    uploadTextFile,
  } = useFileSystem();
  const bus = useXPEventBus();
  const api = useApp(windowId);
  const storage = useStorage();

  // View mode (#120, EXP-02): 'icons' (the default grid) or 'details' (sortable
  // columns). Persisted per instance so it survives refresh.
  const viewStorageKey = storage.key('explorer_view');
  const [viewMode, setViewMode] = useState<'icons' | 'details'>(() =>
    storage.local.getItem(viewStorageKey) === 'details' ? 'details' : 'icons'
  );
  const [sort, setSort] = useState<{ key: 'name' | 'size' | 'type' | 'modified'; dir: 'asc' | 'desc' }>(
    { key: 'name', dir: 'asc' }
  );
  const changeView = (mode: 'icons' | 'details') => {
    setViewMode(mode);
    storage.local.setItem(viewStorageKey, mode);
  };
  const toggleSort = (key: 'name' | 'size' | 'type' | 'modified') =>
    setSort(prev => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  // Folders tree pane (#120, EXP): toggled by the toolbar Folders button,
  // persisted per instance. Replaces the blue task sidebar when on.
  const foldersStorageKey = storage.key('explorer_folders');
  const [showFolders, setShowFolders] = useState<boolean>(
    () => storage.local.getItem(foldersStorageKey) === '1'
  );
  const toggleFolders = () =>
    setShowFolders(prev => {
      const next = !prev;
      storage.local.setItem(foldersStorageKey, next ? '1' : '0');
      return next;
    });

  // Address-bar history (#120, EXP-08): an MRU of visited paths, persisted per
  // instance, surfaced in the address-bar dropdown.
  const addrHistoryKey = storage.key('explorer_address_history');
  const [addrHistory, setAddrHistory] = useState<string[][]>(() => {
    try {
      const raw = storage.local.getItem(addrHistoryKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as string[][]) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<string[][]>([initialPath]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    type: FileNode['type'];
    key: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [address, setAddress] = useState<string>(initialPath.join('\\'));
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetItem: { key: string; item: FileNode } | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetItem: null,
  });

  const currentPath = history[historyIndex];
  const currentFolder = getFile(currentPath);

  // Keep address bar in sync when navigating
  useEffect(() => {
    setAddress(getSystemPathDisplay(currentPath, t));
  }, [currentPath, t]);

  // Record the visited path into the MRU history (deduped, most-recent first).
  useEffect(() => {
    const marker = currentPath.join('\u0000');
    setAddrHistory(prev => {
      const next = [currentPath, ...prev.filter(p => p.join('\u0000') !== marker)].slice(0, 12);
      try {
        storage.local.setItem(addrHistoryKey, JSON.stringify(next));
      } catch {
        /* storage unavailable — history stays in-memory only */
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  useEffect(() => {
    api.window.setTitle(getSystemPathTitle(currentPath, t));
  }, [api.window, currentPath, t]);

  const handleAddressGo = () => {
    const parts = resolveSystemPathDisplay(address, t);
    const target = getFile(parts);
    if (target) {
      handleNavigateToPath(parts);
    }
  };

  const handleNavigate = async (name: string) => {
    const newPath = [...currentPath, name];
    const target = getFile(newPath);

    if (!target) {
      await api.dialog.alert({
        title: t('common.error'),
        message: t('explorer.errors.pathNotFound'),
        type: 'error',
      });
      return;
    }

    if (target.broken) {
      await api.dialog.alert({
        title: t('common.error'),
        message: t('explorer.errors.damaged'),
        type: 'error',
      });
      return;
    }

    if (target.locked) {
      let attempt = 0;
      const success = await api.dialog.password({
        title: t('explorer.password.title'),
        message: t('explorer.password.message'),
        hint: target.hint || '',
        correctPassword: target.password ?? '',
        onFail: () => {
          attempt += 1;
          bus.emit({ type: 'password:fail', path: newPath, name: target.name, attempt });
        },
      });
      if (!success) return;
    }

    if (target.type === 'folder' || target.type === 'root') {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newPath);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setSelectedItem(null);
    } else if (target.type === 'file' || target.type === 'app_shortcut') {
      // Load associations on demand to avoid a static Explorer <-> app registry cycle.
      const { resolveFileOpen } = await import('../../registry/apps');
      const resolved = resolveFileOpen(name, target);
      bus.emit({ type: 'file:open', path: [...currentPath, name], name: target.name, nodeType: target.type, app: (target as { app?: string }).app });
      if (resolved) {
        api.openWindow(
          resolved.appId,
          getFileDisplayName(name, target, t),
          resolved.component,
          resolved.icon,
          resolved.windowProps
        );
      }
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSelectedItem(null);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSelectedItem(null);
    }
  };

  const handleUp = () => {
    if (currentPath.length > 0) {
      const newPath = [...currentPath];
      newPath.pop();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newPath);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setSelectedItem(null);
    }
  };

  const handleNavigateToPath = (path: string[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSelectedItem(null);
  };

  if (!currentFolder) return <div>{t('explorer.errors.pathNotFound')}</div>;

  // Grouping Logic for "My Computer" (Root or Explicit 'My Computer' path)
  const isRoot =
    currentPath.length === 0 || (currentPath.length === 1 && currentPath[0] === '我的电脑');

  const renderContent = () => {
    if (!isContainerNode(currentFolder)) return null;

    const children = Object.entries(currentFolder.children);

    if (isRoot) {
      const drives: { key: string; item: FileNode }[] = [];
      const removableDrives: { key: string; item: FileNode }[] = [];
      const others: { key: string; item: FileNode }[] = [];

      children.forEach(([key, item]) => {
        if (
          item.type === 'drive' ||
          item.icon === 'drive' ||
          key.includes('Drive') ||
          key.includes('Disk')
        ) {
          if (isOpticalDrive(key)) {
            removableDrives.push({ key, item });
          } else {
            drives.push({ key, item });
          }
        } else {
          others.push({ key, item });
        }
      });

      // If we have drives, we assume this is the "My Computer" view-like structure
      if (drives.length > 0) {
        return (
          <>
            <GroupHeader>{t('explorer.groups.hardDisks')}</GroupHeader>
            <IconsGrid>{drives.map(({ key, item }) => renderFileItem(key, item))}</IconsGrid>

            {removableDrives.length > 0 && (
              <>
                <GroupHeader>{t('explorer.groups.removableStorage')}</GroupHeader>
                <IconsGrid>
                  {removableDrives.map(({ key, item }) => renderFileItem(key, item))}
                </IconsGrid>
              </>
            )}

            {others.length > 0 && (
              <>
                <GroupHeader>{t('explorer.groups.other')}</GroupHeader>
                <IconsGrid>{others.map(({ key, item }) => renderFileItem(key, item))}</IconsGrid>
              </>
            )}
          </>
        );
      }
    }

    // Standard Folder View
    if (viewMode === 'details') return renderDetailsView(children);
    return <IconsGrid>{children.map(([key, item]) => renderFileItem(key, item))}</IconsGrid>;
  };

  // Details view (#120, EXP-02): sortable Name / Size / Type / Date columns.
  const nodeSizeBytes = (item: FileNode): number | null =>
    isContainerNode(item) ? null : isFileContentNode(item) && item.content ? item.content.length : 0;
  const nodeTypeLabel = (item: FileNode): string => {
    if (item.type === 'folder') return t('explorer.types.folder');
    const dot = item.name.lastIndexOf('.');
    if (dot <= 0 || dot === item.name.length - 1) return t('explorer.fileTypes.noExtension');
    const ext = item.name.slice(dot + 1).toLowerCase();
    // Known extensions map to a friendly XP name; unknown ones fall back to
    // "EXT File" (e.g. "M3U File"), matching how XP labels unregistered types.
    return t(`explorer.fileTypes.${ext}`, {
      defaultValue: t('explorer.fileTypes.generic', { ext: ext.toUpperCase() }),
    });
  };
  const formatBytes = (bytes: number | null): string =>
    bytes === null ? '' : t('fileProperties.bytes', { count: bytes });
  const detailsDate = () => {
    const d = new Date('2003-10-25');
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(d);
  };

  const renderDetailsView = (children: [string, FileNode][]) => {
    const sorted = [...children].sort(([ka, a], [kb, b]) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'size') {
        return ((nodeSizeBytes(a) ?? -1) - (nodeSizeBytes(b) ?? -1)) * dir;
      }
      if (sort.key === 'type') {
        return nodeTypeLabel(a).localeCompare(nodeTypeLabel(b)) * dir;
      }
      // name (default) — modified is a constant date, so it falls back to name.
      return getFileDisplayName(ka, a, t).localeCompare(getFileDisplayName(kb, b, t)) * dir;
    });
    const arrow = (key: typeof sort.key) => (sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '');
    return (
      <DetailsTable role="table">
        <colgroup>
          <col style={{ width: '45%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead>
          <tr>
            <DetailsHeadCell onClick={() => toggleSort('name')}>
              {t('explorer.details.name')}
              {arrow('name')}
            </DetailsHeadCell>
            <DetailsHeadCell onClick={() => toggleSort('size')}>
              {t('explorer.details.size')}
              {arrow('size')}
            </DetailsHeadCell>
            <DetailsHeadCell onClick={() => toggleSort('type')}>
              {t('explorer.details.type')}
              {arrow('type')}
            </DetailsHeadCell>
            <DetailsHeadCell onClick={() => toggleSort('modified')}>
              {t('explorer.details.dateModified')}
              {arrow('modified')}
            </DetailsHeadCell>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([key, item]) => {
            const displayName = getFileDisplayName(key, item, t);
            const isSelected = selectedItem !== null && selectedItem.key === key;
            return (
              <DetailsRow
                key={key}
                data-testid={`file-row-${key}`}
                $selected={isSelected}
                onClick={() => setSelectedItem({ name: displayName, type: item.type, key })}
                onDoubleClick={() => handleNavigate(key)}
                onContextMenu={e => handleContextMenu(e, key, item)}
              >
                <DetailsNameCell>
                  <XPIcon name={getFileIconName(item.name, item.type, item.icon)} size={16} />
                  <span
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {displayName}
                  </span>
                </DetailsNameCell>
                <DetailsCell>{formatBytes(nodeSizeBytes(item))}</DetailsCell>
                <DetailsCell>{nodeTypeLabel(item)}</DetailsCell>
                <DetailsCell>{detailsDate()}</DetailsCell>
              </DetailsRow>
            );
          })}
        </tbody>
      </DetailsTable>
    );
  };

  const handleContextMenu = (e: React.MouseEvent, key: string, item: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItem({ name: getFileDisplayName(key, item, t), type: item?.type, key });
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetItem: item ? { key, item } : null,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, targetItem: null });
  };

  const handleCreateFile = (type: 'file' | 'folder' = 'file') => {
    const fileName =
      type === 'folder' ? t('desktop.newFolderName') : t('desktop.newTextDocumentName');
    createFile(currentPath, fileName, type);
    closeContextMenu();
  };

  const handleDelete = (override?: { key: string; item: FileNode }) => {
    const targetItem = override ?? contextMenu.targetItem;
    if (targetItem) {
      const displayName = getFileDisplayName(targetItem.key, targetItem.item, t);
      api.dialog
        .confirm({
          title: t('common.deleteConfirmTitle'),
          message: t('common.deleteConfirmSingle', { name: displayName }),
          type: 'warning',
        })
        .then(confirmed => {
          if (confirmed) {
            deleteFile(currentPath, targetItem.key);
            closeContextMenu();
          }
        });
    }
  };

  const handleRename = (override?: { key: string; item: FileNode }) => {
    const targetItem = override ?? contextMenu.targetItem;
    if (targetItem) {
      api.dialog
        .prompt({
          title: t('common.renameTitle'),
          message: t('common.renamePrompt'),
          defaultValue: targetItem.item.name,
        })
        .then(newName => {
          if (newName && newName.trim() !== '') {
            renameFile(currentPath, targetItem.key, newName.trim());
            closeContextMenu();
          }
        });
    }
  };

  const handleCopy = () => {
    if (contextMenu.targetItem) {
      copyToClipboard(currentPath, contextMenu.targetItem.key);
      closeContextMenu();
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.json,.js,.ts,.jsx,.tsx,.css,.html,.xml,.csv';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = event => {
          const content = event.target?.result as string;
          uploadTextFile(currentPath, file.name, content);
          closeContextMenu();
        };
        reader.readAsText(file);
      }
    };
    input.click();
    closeContextMenu();
  };

  const handleCut = () => {
    if (contextMenu.targetItem) {
      cutFile(currentPath, contextMenu.targetItem.key);
      closeContextMenu();
    }
  };

  const handlePaste = () => {
    const success = pasteFile(currentPath);
    if (success) {
      closeContextMenu();
    }
  };

  const handleProperties = () => {
    if (contextMenu.targetItem) {
      const displayName = getFileDisplayName(
        contextMenu.targetItem.key,
        contextMenu.targetItem.item,
        t
      );
      const componentProps = {
        fileItem: contextMenu.targetItem.item,
        parentPath: currentPath,
      };
      api.openWindow(
        'FileProperties',
        t('common.propertiesTitle', { name: displayName }),
        <FileProperties {...componentProps} />,
        'properties',
        { componentProps } // 显式传递 componentProps 用于持久化
      );
      closeContextMenu();
    }
  };

  const isInRecycleBin = currentPath.length === 1 && currentPath[0] === '回收站';

  const handleEmptyRecycleBin = () => {
    api.dialog
      .confirm({
        title: t('explorer.recycleBin.emptyTitle'),
        message: t('explorer.recycleBin.emptyConfirm'),
        type: 'warning',
      })
      .then(confirmed => {
        if (confirmed) {
          emptyRecycleBin();
          closeContextMenu();
        }
      });
  };

  const handleRestoreFromRecycleBin = () => {
    if (contextMenu.targetItem) {
      restoreFromRecycleBin(contextMenu.targetItem.key);
      closeContextMenu();
    }
  };

  const recycleBinMenuItems: MenuItem[] = [
    {
      label: t('explorer.recycleBin.restore'),
      action: handleRestoreFromRecycleBin,
      disabled: !contextMenu.targetItem,
    },
    { type: 'separator' },
    { label: t('explorer.recycleBin.empty'), action: handleEmptyRecycleBin },
    { type: 'separator' },
    {
      label: t('contextMenu.properties'),
      action: handleProperties,
      disabled: !contextMenu.targetItem,
    },
  ];

  const menuItems: MenuItem[] = isInRecycleBin
    ? recycleBinMenuItems
    : [
        { label: t('contextMenu.newFolder'), action: () => handleCreateFile('folder') },
        { label: t('contextMenu.newTextDocument'), action: () => handleCreateFile('file') },
        { type: 'separator' },
        { label: t('explorer.upload'), action: handleUpload },
        { type: 'separator' },
        { label: t('contextMenu.copy'), action: handleCopy, disabled: !contextMenu.targetItem },
        { label: t('contextMenu.cut'), action: handleCut, disabled: !contextMenu.targetItem },
        { label: t('contextMenu.paste'), action: handlePaste, disabled: !clipboard },
        { type: 'separator' },
        { label: t('contextMenu.rename'), action: handleRename, disabled: !contextMenu.targetItem },
        { label: t('contextMenu.delete'), action: handleDelete, disabled: !contextMenu.targetItem },
        { type: 'separator' },
        {
          label: t('contextMenu.properties'),
          action: handleProperties,
          disabled: !contextMenu.targetItem,
        },
      ];

  const handleDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnFolder = (e: React.DragEvent, targetKey: string, targetItem: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    if (targetItem.type !== 'folder') return;
    const srcKey = e.dataTransfer.getData('text/plain');
    if (!srcKey || srcKey === targetKey) return;
    moveFile(currentPath, srcKey, [...currentPath, targetKey]);
  };

  const renderFileItem = (key: string, item: FileNode) => {
    const displayName = getFileDisplayName(key, item, t);
    const isSelected = selectedItem !== null && selectedItem.key === key;

    return (
      <FileItem
        key={key}
        data-testid={`file-item-${key}`}
        onDoubleClick={() => handleNavigate(key)}
        onClick={() => setSelectedItem({ name: displayName, type: item.type, key })}
        onContextMenu={e => handleContextMenu(e, key, item)}
        $selected={isSelected}
        draggable
        onDragStart={e => handleDragStart(e, key)}
        onDragOver={e => {
          if (item.type === 'folder') {
            e.preventDefault();
            setDragOver(key);
          }
        }}
        onDragLeave={() => setDragOver(null)}
        onDrop={e => handleDropOnFolder(e, key, item)}
        style={
          dragOver === key && item.type === 'folder'
            ? { background: '#C1D2EE', border: '1px dashed #316AC5' }
            : undefined
        }
      >
        <IconWrapper>
          <XPIcon name={getFileIconName(item.name, item.type, item.icon)} size={32} />
        </IconWrapper>
        <FileInfo>
          <FileName $isDrive={isRoot && (item.type === 'drive' || item.icon === 'drive')}>
            {displayName}
            {item.locked && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                style={{ marginLeft: '5px', flexShrink: 0 }}
              >
                <rect x="1" y="4" width="8" height="5" rx="1" fill="#666" />
                <path
                  d="M2.5 4V2.5a2.5 2.5 0 0 1 5 0V4"
                  stroke="#666"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            )}
          </FileName>
          {isRoot && (item.type === 'drive' || item.icon === 'drive') && (
            <FileType $selected={isSelected}>
              {t(isOpticalDrive(key) ? 'explorer.types.opticalDrive' : 'explorer.types.localDisk')}
            </FileType>
          )}
        </FileInfo>
      </FileItem>
    );
  };

  const childCount = isContainerNode(currentFolder)
    ? Object.keys(currentFolder.children).length
    : 0;

  // Child keys in the same order the list shows them (insertion order for the
  // icon grid; the active sort for Details) — used for arrow-key selection.
  const orderedKeys = (): string[] => {
    if (!isContainerNode(currentFolder)) return [];
    const entries = Object.entries(currentFolder.children);
    if (viewMode !== 'details') return entries.map(([k]) => k);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...entries]
      .sort(([ka, a], [kb, b]) => {
        if (sort.key === 'size') return ((nodeSizeBytes(a) ?? -1) - (nodeSizeBytes(b) ?? -1)) * dir;
        if (sort.key === 'type') return nodeTypeLabel(a).localeCompare(nodeTypeLabel(b)) * dir;
        return getFileDisplayName(ka, a, t).localeCompare(getFileDisplayName(kb, b, t)) * dir;
      })
      .map(([k]) => k);
  };

  // Explorer keyboard operations (#87 EXP-03/04 + #120): Backspace = up one
  // level, F5 refresh, F2 rename / Delete on the selected item, Enter opens the
  // selection, and arrows/Home/End move the selection. Ignored while typing in
  // the address bar.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    const folder = isContainerNode(currentFolder) ? currentFolder : null;
    const selKey = selectedItem?.key;
    const selNode = selKey && folder ? folder.children[selKey] : undefined;

    const selectByKey = (key: string) => {
      const node = folder?.children[key];
      if (!node) return;
      setSelectedItem({ name: getFileDisplayName(key, node, t), type: node.type, key });
    };

    if (e.key === 'Backspace') {
      if (currentPath.length > 0) {
        e.preventDefault();
        handleUp();
      }
    } else if (e.key === 'F5') {
      e.preventDefault();
      setRefreshKey(k => k + 1);
    } else if (e.key === 'F2') {
      if (selKey && selNode) {
        e.preventDefault();
        handleRename({ key: selKey, item: selNode });
      }
    } else if (e.key === 'Delete') {
      if (selKey && selNode) {
        e.preventDefault();
        handleDelete({ key: selKey, item: selNode });
      }
    } else if (e.key === 'Enter') {
      if (selKey && selNode) {
        e.preventDefault();
        handleNavigate(selKey);
      }
    } else if (
      e.key === 'ArrowDown' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowLeft' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      if (!folder) return;
      const keys = orderedKeys();
      if (keys.length === 0) return;
      e.preventDefault();
      const cur = selKey ? keys.indexOf(selKey) : -1;
      let idx: number;
      if (e.key === 'Home') idx = 0;
      else if (e.key === 'End') idx = keys.length - 1;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') idx = cur <= 0 ? 0 : cur - 1;
      else idx = cur < 0 ? 0 : Math.min(cur + 1, keys.length - 1);
      selectByKey(keys[idx]);
    }
  };

  return (
    <Container
      ref={containerRef}
      tabIndex={0}
      style={{ outline: 'none' }}
      onKeyDown={handleKeyDown}
      onMouseDown={e => {
        const t = e.target as HTMLElement;
        if (!t.closest('input,textarea,button,[contenteditable]')) {
          containerRef.current?.focus();
        }
      }}
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedItem(null);
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetItem: null });
      }}
    >
      <ExplorerToolbar
        onBack={handleBack}
        onForward={handleForward}
        onUp={handleUp}
        onRefresh={() => setRefreshKey(k => k + 1)}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < history.length - 1}
        canGoUp={currentPath.length > 0}
        view={viewMode}
        onViewChange={changeView}
        foldersOpen={showFolders}
        onToggleFolders={toggleFolders}
      />
      <AddressBar
        address={address}
        onAddressChange={setAddress}
        onGo={handleAddressGo}
        history={addrHistory.map(p => ({ label: getSystemPathDisplay(p, t), path: p }))}
        onSelectHistory={handleNavigateToPath}
      />
      <MainContent>
        {showFolders ? (
          <ExplorerFolderTree
            root={getFile([])}
            currentPath={currentPath}
            onNavigate={handleNavigateToPath}
            onClose={toggleFolders}
          />
        ) : (
          <ExplorerSidebar
            currentPath={currentPath}
            currentItem={selectedItem}
            onNavigate={handleNavigateToPath}
          />
        )}
        <FileArea key={refreshKey} $flush={viewMode === 'details'}>
          {isInRecycleBin && childCount === 0 ? (
            <EmptyRecycleBinMessage>
              <XPIcon name="recycle_bin" size={48} />
              <span>{t('explorer.recycleBin.emptyMessage')}</span>
            </EmptyRecycleBinMessage>
          ) : (
            renderContent()
          )}
        </FileArea>
      </MainContent>
      <StatusBar>
        {t('explorer.objectCount', { count: childCount })}
      </StatusBar>
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
        menuItems={menuItems}
      />
    </Container>
  );
};

export default Explorer;
