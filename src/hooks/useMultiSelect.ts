import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Shared multi-selection model for the desktop and Explorer (#211).
 *
 * One place owns the OS-standard selection semantics — plain click = select
 * only, Ctrl/Cmd click = toggle, Shift click = contiguous range from the anchor,
 * Ctrl+A = all, Shift+Arrow = extend — so both surfaces behave identically and
 * batch operations (multi-delete, batch drag) have a single source of truth.
 *
 * Engine-side: pure state/logic, no styling. Callers pass the *ordered* key list
 * (whatever order the view shows) so range/extend follow what the user sees.
 */

export interface ClickModifiers {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export interface MultiSelectApi {
  /** The set of selected keys. */
  selected: Set<string>;
  /** The last-focused key — drives the sidebar/details pane and the arrow anchor. */
  active: string | null;
  size: number;
  isSelected: (key: string) => boolean;
  clear: () => void;
  /** Replace the selection with a single key (plain click / programmatic). */
  selectOnly: (key: string) => void;
  /** Replace the selection with an explicit set (e.g. box-select), optionally naming the active key. */
  setSelection: (keys: Iterable<string>, active?: string | null) => void;
  /** Select every key in `ordered` (Ctrl+A). */
  selectAll: (ordered: string[]) => void;
  /** Handle a click on `key` with modifiers, given the current ordered view. */
  handleItemClick: (key: string, ordered: string[], mods: ClickModifiers) => void;
  /** Keyboard move to `nextKey`: `extend` (Shift+Arrow) grows the range, else selects only. */
  moveActive: (ordered: string[], nextKey: string, extend: boolean) => void;
}

function rangeBetween(ordered: string[], from: string, to: string): string[] {
  const i = ordered.indexOf(from);
  const j = ordered.indexOf(to);
  if (i < 0 || j < 0) return [to];
  const [lo, hi] = i <= j ? [i, j] : [j, i];
  return ordered.slice(lo, hi + 1);
}

export function useMultiSelect(): MultiSelectApi {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [active, setActive] = useState<string | null>(null);
  // The fixed end of a Shift range; a plain/Ctrl click moves it, Shift keeps it.
  const anchorRef = useRef<string | null>(null);

  const clear = useCallback(() => {
    setSelected(new Set());
    setActive(null);
    anchorRef.current = null;
  }, []);

  const selectOnly = useCallback((key: string) => {
    setSelected(new Set([key]));
    setActive(key);
    anchorRef.current = key;
  }, []);

  const setSelection = useCallback((keys: Iterable<string>, act: string | null = null) => {
    const set = new Set(keys);
    const list = [...set];
    const a = act ?? (list.length ? list[list.length - 1] : null);
    setSelected(set);
    setActive(a);
    anchorRef.current = a;
  }, []);

  const selectAll = useCallback((ordered: string[]) => {
    setSelected(new Set(ordered));
    setActive(ordered.length ? ordered[ordered.length - 1] : null);
    anchorRef.current = ordered.length ? ordered[0] : null;
  }, []);

  const handleItemClick = useCallback(
    (key: string, ordered: string[], mods: ClickModifiers) => {
      const additive = !!(mods.ctrlKey || mods.metaKey);
      if (mods.shiftKey) {
        const from = anchorRef.current ?? active ?? key;
        const range = rangeBetween(ordered, from, key);
        setSelected(prev => (additive ? new Set([...prev, ...range]) : new Set(range)));
        setActive(key);
        if (anchorRef.current == null) anchorRef.current = from;
      } else if (additive) {
        setSelected(prev => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
        setActive(key);
        anchorRef.current = key;
      } else {
        selectOnly(key);
      }
    },
    [active, selectOnly]
  );

  const moveActive = useCallback(
    (ordered: string[], nextKey: string, extend: boolean) => {
      if (extend) {
        const from = anchorRef.current ?? active ?? nextKey;
        setSelected(new Set(rangeBetween(ordered, from, nextKey)));
        setActive(nextKey);
        if (anchorRef.current == null) anchorRef.current = from;
      } else {
        selectOnly(nextKey);
      }
    },
    [active, selectOnly]
  );

  const isSelected = useCallback((key: string) => selected.has(key), [selected]);

  return useMemo(
    () => ({
      selected,
      active,
      size: selected.size,
      isSelected,
      clear,
      selectOnly,
      setSelection,
      selectAll,
      handleItemClick,
      moveActive,
    }),
    [selected, active, isSelected, clear, selectOnly, setSelection, selectAll, handleItemClick, moveActive]
  );
}
