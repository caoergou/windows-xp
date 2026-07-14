// Explorer persisted UI preferences (#163/A) — the storage-backed toggles that
// live independently of the current folder: per-folder view mode, sort order,
// the Folders tree pane, show-hidden-files, and the address-bar MRU history.
// Extracted verbatim from useExplorer as a self-contained concern that only
// needs the storage handle and the event bus. No behavior change.
import { useState } from 'react';
import { useStorage } from '../../../context/StorageContext';
import { useXPEventBus } from '../../../context/EventBusContext';
import type { ExplorerViewMode } from '../types';

type SortState = { key: 'name' | 'size' | 'type' | 'modified'; dir: 'asc' | 'desc' };

export function useExplorerPreferences() {
  const storage = useStorage();
  const bus = useXPEventBus();

  // View mode (#120 EXP-02 / #211): one of the five XP views. Persisted PER
  // FOLDER (a JSON path→mode map) so each folder remembers how it was last
  // shown. A folder with no saved choice defaults by content — picture folders
  // open in Thumbnails, everything else in Tiles (XP's defaults).
  const viewStorageKey = storage.key('explorer_view_by_path');
  const [viewByPath, setViewByPath] = useState<Record<string, ExplorerViewMode>>(() => {
    try {
      const raw = storage.local.getItem(viewStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, ExplorerViewMode>)
        : {};
    } catch {
      return {};
    }
  });

  const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
  const toggleSort = (key: 'name' | 'size' | 'type' | 'modified') =>
    setSort(prev =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );

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

  // Show-hidden-files toggle (#219). Off by default, persisted per instance;
  // when off, nodes flagged `hidden` are filtered out of the listing (and the
  // object count / keyboard nav), matching XP's Folder Options. When on they
  // show ghosted. Toggling is a user-visible control change → `ui:action`.
  const showHiddenKey = storage.key('explorer_show_hidden');
  const [showHidden, setShowHidden] = useState<boolean>(
    () => storage.local.getItem(showHiddenKey) === '1'
  );
  const toggleShowHidden = () =>
    setShowHidden(prev => {
      const next = !prev;
      storage.local.setItem(showHiddenKey, next ? '1' : '0');
      bus.emit({ type: 'ui:action', appId: 'Explorer', control: 'show-hidden', value: next });
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

  return {
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
  };
}
