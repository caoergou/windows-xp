// Explorer keyboard operations (#163/A, from #87/#211) — Backspace up, F5
// refresh, F2 rename, Delete → recycle, Enter open, Ctrl/Cmd+A select-all, and
// arrow/Home/End navigation (Shift extends the range). Relocated verbatim from
// useExplorer as a factory bound to the live per-render deps; no behavior change.
import type React from 'react';
import { FileNode, isContainerNode } from '../../types';
import type { useMultiSelect } from '../../hooks/useMultiSelect';

interface KeyDownDeps {
  currentFolder: FileNode | null | undefined;
  currentPath: string[];
  selection: ReturnType<typeof useMultiSelect>;
  orderedKeys: () => string[];
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  handleUp: () => void;
  handleRename: (override?: { key: string; item: FileNode }) => void;
  handleDeleteSelection: (override?: { key: string; item: FileNode }) => void;
  handleNavigate: (name: string) => void;
}

export const makeExplorerKeyDown =
  (deps: KeyDownDeps) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    const {
      currentFolder,
      currentPath,
      selection,
      orderedKeys,
      setRefreshKey,
      handleUp,
      handleRename,
      handleDeleteSelection,
      handleNavigate,
    } = deps;

    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    const folder = currentFolder && isContainerNode(currentFolder) ? currentFolder : null;
    const selKey = selection.active;
    const selNode = selKey && folder ? folder.children[selKey] : undefined;

    // Ctrl/Cmd+A selects every item in the folder (#211).
    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
      if (!folder) return;
      e.preventDefault();
      selection.selectAll(orderedKeys());
      return;
    }

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
      if (selection.size > 0) {
        e.preventDefault();
        handleDeleteSelection(selKey && selNode ? { key: selKey, item: selNode } : undefined);
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
      // Shift+Arrow extends the range from the anchor; a plain arrow moves it.
      selection.moveActive(keys, keys[idx], e.shiftKey);
    }
  };
