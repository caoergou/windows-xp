// Explorer touch gestures (#163/A, from #125) — map finger taps on the file
// area to the existing mouse metaphor: tap → select, double-tap → open/navigate,
// long-press → the item's context menu. List scrolling still works (passive
// listeners; a tap cancels once the finger moves past tolerance). The synthetic
// mouse click/contextmenu that follows a handled tap is suppressed via
// `isSyntheticAfterTouch`. Extracted verbatim from useExplorer; no behavior
// change. `lastTouchAt` and `isSyntheticAfterTouch` live here since only touch
// writes them and the mouse handlers only read them.
import { useRef } from 'react';
import { useTapGestures } from '../../../hooks/useTapGestures';
import { useMultiSelect } from '../../../hooks/useMultiSelect';
import { FileNode, isContainerNode } from '../../../types';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetItem: { key: string; item: FileNode } | null;
}

interface UseExplorerTouchArgs {
  currentFolder: FileNode | null | undefined;
  selection: ReturnType<typeof useMultiSelect>;
  onOpen: (key: string) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
}

export function useExplorerTouch({
  currentFolder,
  selection,
  onOpen,
  setContextMenu,
}: UseExplorerTouchArgs) {
  const lastTouchAt = useRef(0);
  const isSyntheticAfterTouch = () => Date.now() - lastTouchAt.current < 700;

  const touchTargetRef = useRef<{ key: string; item: FileNode } | null>(null);
  const resolveTouchItem = (key: string): FileNode | undefined =>
    currentFolder && isContainerNode(currentFolder) ? currentFolder.children[key] : undefined;

  const fileTouchGestures = useTapGestures({
    onTap: () => {
      lastTouchAt.current = Date.now();
      const target = touchTargetRef.current;
      if (target) selection.selectOnly(target.key);
      else selection.clear();
    },
    onDoubleTap: () => {
      lastTouchAt.current = Date.now();
      const target = touchTargetRef.current;
      if (target) onOpen(target.key);
    },
    onLongPress: ({ x, y }) => {
      lastTouchAt.current = Date.now();
      const target = touchTargetRef.current;
      if (target) {
        selection.selectOnly(target.key);
        setContextMenu({ visible: true, x, y, targetItem: { key: target.key, item: target.item } });
      } else {
        selection.clear();
        setContextMenu({ visible: true, x, y, targetItem: null });
      }
    },
  });

  const handleFileAreaTouchStart = (e: React.TouchEvent) => {
    const el = (e.target as HTMLElement).closest('[data-item-key]') as HTMLElement | null;
    const key = el?.dataset.itemKey;
    const item = key ? resolveTouchItem(key) : undefined;
    touchTargetRef.current = key && item ? { key, item } : null;
    fileTouchGestures.onTouchStart(e);
  };

  return { isSyntheticAfterTouch, fileTouchGestures, handleFileAreaTouchStart };
}
