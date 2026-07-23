import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../../../context/FileSystemContext';
import { useXPEventBus } from '../../../context/EventBusContext';
import { useStorage } from '../../../context/StorageContext';
import { useApp } from '../../../hooks/useApp';
import { useMultiSelect } from '../../../hooks/useMultiSelect';
import { useExplorerPreferences } from './useExplorerPreferences';
import { useExplorerTouch } from './useExplorerTouch';
import FileProperties, { FILE_PROPERTIES_WINDOW_PROPS } from '../../../components/FileProperties';
import { FileNode, MenuItem, isContainerNode } from '../../../types';
import { getFileDisplayName } from '../../../utils/fileDisplayName';
import { openExternalUrl } from '../../../utils/externalLink';
import {
  getSystemPathDisplay,
  getSystemPathTitle,
  resolveSystemPathDisplay,
} from '../../../data/systemPaths';
import { makeDetailsHelpers } from '../helpers';
import { makeExplorerKeyDown } from '../keyboard';
import type { ExplorerProps, ExplorerViewMode } from '../types';
import { useOptionalOSPackage } from '../../../os/OSPackageContext';
import { useAppRegistry } from '../../../context/AppRegistryContext';

export function useExplorer({ initialPath = [], windowId }: ExplorerProps) {
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
    copyFile,
    copyToClipboard,
    uploadTextFile,
  } = useFileSystem();
  const bus = useXPEventBus();
  const api = useApp(windowId);
  const storage = useStorage();
  const os = useOptionalOSPackage();
  const { registry } = useAppRegistry();

  // Persisted UI preferences (view mode, sort, Folders pane, show-hidden,
  // address-bar MRU) live in their own storage-backed hook (#163/A).
  const {
    viewStorageKey,
    viewByPath,
    setViewByPath,
    sort,
    toggleSort,
    showFolders,
    toggleFolders,
    showHidden,
    toggleShowHidden,
    addrHistoryKey,
    addrHistory,
    setAddrHistory,
  } = useExplorerPreferences();

  // The children of the current folder that should be visible given the
  // show-hidden setting. Every listing/count/nav path routes through this so a
  // hidden node is uniformly absent (not just visually gone).
  const visibleEntries = (entries: [string, FileNode][]): [string, FileNode][] =>
    showHidden ? entries : entries.filter(([, item]) => !item.hidden);

  const [history, setHistory] = useState<string[][]>([initialPath]);
  const [historyIndex, setHistoryIndex] = useState(0);
  // Multi-selection (#211) shared with the desktop via one model. A legacy-shaped
  // `selectedItem` is derived from the active key below for the sidebar/details
  // pane and the keyboard handlers that only care about the focused item.
  const selection = useMultiSelect();
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

  // The view for this folder: its saved choice, else a content-based default —
  // Thumbnails for a picture folder, Tiles otherwise (#211).
  const pathKey = currentPath.join('\u0000');
  const isPictureFolder = (): boolean => {
    if (currentPath.some(seg => seg === '我的图片' || /pictures?/i.test(seg))) return true;
    if (!currentFolder || !isContainerNode(currentFolder)) return false;
    const kids = Object.values(currentFolder.children);
    const images = kids.filter(n => n.type === 'file' && /\.(jpe?g|png|gif|bmp)$/i.test(n.name));
    return kids.length > 0 && images.length >= Math.ceil(kids.length / 2);
  };
  const viewMode: ExplorerViewMode =
    viewByPath[pathKey] ?? (isPictureFolder() ? 'thumbnails' : 'tiles');
  const changeView = (mode: ExplorerViewMode) => {
    setViewByPath(prev => {
      const next = { ...prev, [pathKey]: mode };
      try {
        storage.local.setItem(viewStorageKey, JSON.stringify(next));
      } catch {
        /* storage unavailable — view choice stays in-memory only */
      }
      return next;
    });
  };

  // Legacy-shaped "active item" derived from the selection model — feeds the
  // sidebar/details pane and the keyboard handlers that act on the focused item.
  const activeNode =
    selection.active && currentFolder && isContainerNode(currentFolder)
      ? currentFolder.children[selection.active]
      : undefined;
  const selectedItem =
    selection.active && activeNode
      ? {
          name: getFileDisplayName(selection.active, activeNode, t),
          type: activeNode.type,
          key: selection.active,
        }
      : null;

  // Keys currently selected that still exist in the folder — the working set for
  // batch copy/cut/delete/drag.
  const selectionKeys = (): string[] => {
    const folder = currentFolder && isContainerNode(currentFolder) ? currentFolder : null;
    if (!folder) return [];
    return [...selection.selected].filter(k => folder.children[k]);
  };

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
    } else {
      void api.dialog.alert({
        title: t('common.error'),
        message: t('explorer.errors.pathNotFound'),
        type: 'error',
      });
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
      selection.clear();
    } else if (target.type === 'external_link') {
      // External-link shortcut: leave the fiction instead of opening a window (#136).
      const newTab = target.newTab ?? true;
      openExternalUrl(target.href, newTab);
      bus.emit({
        type: 'link:external',
        url: target.href,
        newTab,
        source: [...currentPath, name].join('/'),
      });
    } else if (target.type === 'file' || target.type === 'app_shortcut') {
      // Load associations on demand to avoid a static Explorer <-> app registry cycle.
      const { resolveFileOpen } = await import('../../../registry/apps');
      const sourcePath = [...currentPath, name];
      const resolved = resolveFileOpen(name, target, os?.appRoles, registry, sourcePath);
      bus.emit({
        type: 'file:open',
        path: sourcePath,
        name: target.name,
        nodeType: target.type,
        app: (target as { app?: string }).app,
      });
      if (resolved) {
        api.openWindow(
          resolved.appId,
          getFileDisplayName(name, target, t),
          resolved.component,
          resolved.icon,
          { ...resolved.windowProps, sourcePath }
        );
      }
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      selection.clear();
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      selection.clear();
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
      selection.clear();
    }
  };

  const handleNavigateToPath = (path: string[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    selection.clear();
  };

  // Touch gestures (#125) live in their own hook (#163/A). Declared before the
  // early return below so the hooks run on every render.
  const { isSyntheticAfterTouch, fileTouchGestures, handleFileAreaTouchStart } = useExplorerTouch({
    currentFolder,
    selection,
    onOpen: handleNavigate,
    setContextMenu,
  });

  // Grouping Logic for "My Computer" (Root or Explicit 'My Computer' path)
  const isRoot =
    currentPath.length === 0 || (currentPath.length === 1 && currentPath[0] === '我的电脑');

  // Details view (#120, EXP-02): sortable Name / Size / Type / Date column
  // formatters, bound to the active locale (#163/A).
  const { nodeSizeBytes, nodeTypeLabel, formatBytes, detailsDate, nodeMtime } = makeDetailsHelpers(
    t,
    i18n.language
  );

  const openItemMenuAt = (x: number, y: number, key: string, item: FileNode) => {
    // Right-clicking an already-selected item keeps the whole multi-selection
    // (so batch delete/cut work); right-clicking elsewhere selects just it.
    if (!selection.isSelected(key)) selection.selectOnly(key);
    setContextMenu({
      visible: true,
      x,
      y,
      targetItem: item ? { key, item } : null,
    });
  };

  const handleContextMenu = (e: React.MouseEvent, key: string, item: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSyntheticAfterTouch()) return;
    openItemMenuAt(e.clientX, e.clientY, key, item);
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSyntheticAfterTouch()) return;
    selection.clear();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetItem: null });
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

  // Batch delete over the current multi-selection (#211). Falls back to the
  // single-item path if nothing is selected but a menu target exists. Confirms
  // with a per-count message and recycles each node (one file:delete apiece).
  const handleDeleteSelection = (override?: { key: string; item: FileNode }) => {
    const folder = currentFolder && isContainerNode(currentFolder) ? currentFolder : null;
    if (!folder) return;
    let keys = selectionKeys();
    if (keys.length === 0) {
      const single = override ?? contextMenu.targetItem;
      if (!single) return;
      keys = [single.key];
    }
    // Protected/system files resist deletion in-fiction (#219).
    const guarded = keys.find(k => folder.children[k]?.protected);
    if (guarded) {
      api.dialog.alert({
        title: t('explorer.protected.title'),
        message: t('explorer.protected.deleteMessage', {
          name: getFileDisplayName(guarded, folder.children[guarded], t),
        }),
        type: 'error',
      });
      return;
    }
    const message =
      keys.length === 1
        ? t('common.deleteConfirmSingle', {
            name: getFileDisplayName(keys[0], folder.children[keys[0]], t),
          })
        : t('common.deleteConfirmMultiple', { count: keys.length });
    api.dialog
      .confirm({ title: t('common.deleteConfirmTitle'), message, type: 'warning' })
      .then(confirmed => {
        if (confirmed) {
          keys.forEach(k => deleteFile(currentPath, k));
          selection.clear();
          closeContextMenu();
        }
      });
  };

  const handleRename = (override?: { key: string; item: FileNode }) => {
    const targetItem = override ?? contextMenu.targetItem;
    if (targetItem) {
      if (targetItem.item.protected) {
        api.dialog.alert({
          title: t('explorer.protected.title'),
          message: t('explorer.protected.renameMessage', {
            name: getFileDisplayName(targetItem.key, targetItem.item, t),
          }),
          type: 'error',
        });
        return;
      }
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
    const keys = selectionKeys();
    if (keys.length === 0) return;
    copyToClipboard(currentPath, keys.length === 1 ? keys[0] : keys);
    closeContextMenu();
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
    const keys = selectionKeys();
    if (keys.length === 0) return;
    const folder = currentFolder && isContainerNode(currentFolder) ? currentFolder : null;
    if (folder && keys.some(key => folder.children[key]?.protected)) return;
    cutFile(currentPath, keys.length === 1 ? keys[0] : keys);
    closeContextMenu();
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
        React.createElement(FileProperties, componentProps),
        'properties',
        {
          ...FILE_PROPERTIES_WINDOW_PROPS,
          componentProps,
        }
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

  const selectedFolder = currentFolder && isContainerNode(currentFolder) ? currentFolder : null;
  const selectionContainsProtected = Boolean(
    selectedFolder && selectionKeys().some(key => selectedFolder.children[key]?.protected)
  );
  const selectionContainsProtectedContainer = Boolean(
    selectedFolder &&
    selectionKeys().some(key => {
      const item = selectedFolder.children[key];
      return item?.protected && isContainerNode(item);
    })
  );

  const menuItems: MenuItem[] = isInRecycleBin
    ? recycleBinMenuItems
    : [
        {
          label: t('contextMenu.new'),
          submenu: [
            {
              label: t('contextMenu.newFolder'),
              action: () => handleCreateFile('folder'),
              icon: 'folder',
            },
            {
              label: t('contextMenu.newTextDocument'),
              action: () => handleCreateFile('file'),
              icon: 'txt',
            },
          ],
        },
        { type: 'separator' },
        { label: t('explorer.upload'), action: handleUpload },
        { type: 'separator' },
        // Copy/Cut/Delete act on the whole selection; Rename/Properties are
        // single-item ops, disabled while several are selected (#211).
        { label: t('contextMenu.copy'), action: handleCopy, disabled: selection.size === 0 },
        {
          label: t('contextMenu.cut'),
          action: handleCut,
          disabled: selection.size === 0 || selectionContainsProtected,
        },
        { label: t('contextMenu.paste'), action: handlePaste, disabled: !clipboard },
        { type: 'separator' },
        {
          label: t('contextMenu.rename'),
          action: handleRename,
          disabled: selection.size !== 1 || selectionContainsProtectedContainer,
        },
        {
          label: t('contextMenu.delete'),
          action: handleDeleteSelection,
          disabled: selection.size === 0 || selectionContainsProtectedContainer,
        },
        { type: 'separator' },
        {
          label: showHidden ? `✓ ${t('explorer.showHiddenFiles')}` : t('explorer.showHiddenFiles'),
          action: () => {
            toggleShowHidden();
            closeContextMenu();
          },
        },
        {
          label: t('contextMenu.properties'),
          action: handleProperties,
          disabled: selection.size !== 1,
        },
      ];

  const handleDragStart = (e: React.DragEvent, key: string) => {
    // Dragging one of a multi-selection drags them all (#211); dragging an
    // unselected item drags just it (and selects it, matching XP).
    const keys = selection.isSelected(key) ? selectionKeys() : [key];
    if (!selection.isSelected(key)) selection.selectOnly(key);
    e.dataTransfer.setData('text/plain', JSON.stringify(keys));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDropOnFolder = (e: React.DragEvent, targetKey: string, targetItem: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    if (targetItem.type !== 'folder') return;
    let srcKeys: string[];
    try {
      srcKeys = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      srcKeys = [];
    }
    srcKeys
      .filter(k => k && k !== targetKey)
      .forEach(k => {
        const transfer = e.ctrlKey || e.dataTransfer.dropEffect === 'copy' ? copyFile : moveFile;
        transfer(currentPath, k, [...currentPath, targetKey]);
      });
  };

  const childCount =
    currentFolder && isContainerNode(currentFolder)
      ? visibleEntries(Object.entries(currentFolder.children)).length
      : 0;

  // Child keys in the same order the list shows them (insertion order for the
  // icon grid; the active sort for Details) — used for arrow-key selection.
  const orderedKeys = (): string[] => {
    if (!currentFolder || !isContainerNode(currentFolder)) return [];
    const entries = visibleEntries(Object.entries(currentFolder.children));
    if (viewMode !== 'details') return entries.map(([k]) => k);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...entries]
      .sort(([ka, a], [kb, b]) => {
        if (sort.key === 'size') return ((nodeSizeBytes(a) ?? -1) - (nodeSizeBytes(b) ?? -1)) * dir;
        if (sort.key === 'type') return nodeTypeLabel(a).localeCompare(nodeTypeLabel(b)) * dir;
        if (sort.key === 'modified') return nodeMtime(a).localeCompare(nodeMtime(b)) * dir;
        return getFileDisplayName(ka, a, t).localeCompare(getFileDisplayName(kb, b, t)) * dir;
      })
      .map(([k]) => k);
  };

  // Explorer keyboard operations (#87 EXP-03/04 + #120): Backspace = up one
  // level, F5 refresh, F2 rename / Delete on the selected item, Enter opens the
  // selection, and arrows/Home/End move the selection. Ignored while typing in
  // the address bar.
  const handleKeyDown = makeExplorerKeyDown({
    currentFolder,
    currentPath,
    selection,
    orderedKeys,
    setRefreshKey,
    handleUp,
    handleRename,
    handleDeleteSelection,
    handleNavigate,
  });

  return {
    t,
    getFile,
    viewMode,
    changeView,
    sort,
    toggleSort,
    showFolders,
    toggleFolders,
    showHidden,
    visibleEntries,
    addrHistory,
    history,
    historyIndex,
    selectedItem,
    selection,
    orderedKeys,
    refreshKey,
    setRefreshKey,
    containerRef,
    isSyntheticAfterTouch,
    address,
    setAddress,
    dragOver,
    setDragOver,
    contextMenu,
    setContextMenu,
    currentPath,
    currentFolder,
    handleAddressGo,
    handleNavigate,
    handleBack,
    handleForward,
    handleUp,
    handleNavigateToPath,
    fileTouchGestures,
    handleFileAreaTouchStart,
    isRoot,
    nodeSizeBytes,
    nodeTypeLabel,
    formatBytes,
    detailsDate,
    handleContextMenu,
    handleBackgroundContextMenu,
    closeContextMenu,
    menuItems,
    handleDragStart,
    handleDropOnFolder,
    childCount,
    isInRecycleBin,
    handleKeyDown,
  };
}
