// Desktop box-selection (#163/A) — the drag-a-rectangle-to-select-icons gesture.
// Extracted verbatim from Desktop/index.tsx: a pure relocation of the selection
// state, refs, geometry, and the mousedown/move/up drag cycle. No behavior or
// timing change. The desktop owns `containerRef`/`iconRefs` (they are also used
// in render), so they are passed in; the hook owns everything else.
import { useState, useRef, useCallback, useEffect } from 'react';
import { BOX_SELECT_IGNORE } from '../constants';
import type { useMultiSelect } from '../../../hooks/useMultiSelect';

interface Point {
  x: number;
  y: number;
}

interface UseBoxSelectionArgs {
  containerRef: React.RefObject<HTMLDivElement>;
  iconRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
  selectedIcons: Set<string>;
  iconSelection: ReturnType<typeof useMultiSelect>;
}

export function useBoxSelection({
  containerRef,
  iconRefs,
  selectedIcons,
  iconSelection,
}: UseBoxSelectionArgs) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Point>({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState<Point>({ x: 0, y: 0 });
  const isSelectingRef = useRef(false);
  const selectionStartRef = useRef<Point>({ x: 0, y: 0 });
  const selectionEndRef = useRef<Point>({ x: 0, y: 0 });
  const baseSelectedRef = useRef<Set<string>>(new Set());
  const ctrlKeyRef = useRef(false);
  // A completed drag suppresses the click-to-clear that would otherwise fire on
  // mouseup; the desktop's onClick reads and resets this.
  const suppressClickClearRef = useRef(false);

  const updateSelectionFromBox = useCallback(
    (start: Point, end: Point, ctrlKey: boolean) => {
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

        const intersects = !(
          iconRight < left ||
          iconLeft > right ||
          iconBottom < top ||
          iconTop > bottom
        );

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

      iconSelection.setSelection(newSelected);
    },
    [containerRef, iconRefs, iconSelection]
  );

  useEffect(() => {
    return () => {
      isSelectingRef.current = false;
    };
  }, []);

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
      iconSelection.clear();
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

  return {
    isSelecting,
    selectionStart,
    selectionEnd,
    handleMouseDown,
    suppressClickClearRef,
  };
}
