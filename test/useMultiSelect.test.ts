import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiSelect } from '../src/hooks/useMultiSelect';

const ORDER = ['a', 'b', 'c', 'd', 'e'];
const sel = (s: Set<string>) => [...s].sort().join('');

describe('useMultiSelect', () => {
  it('plain click selects only that item', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => result.current.handleItemClick('c', ORDER, {}));
    expect(sel(result.current.selected)).toBe('c');
    expect(result.current.active).toBe('c');
    act(() => result.current.handleItemClick('a', ORDER, {}));
    expect(sel(result.current.selected)).toBe('a');
  });

  it('Ctrl/Cmd click toggles membership', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => result.current.handleItemClick('a', ORDER, {}));
    act(() => result.current.handleItemClick('c', ORDER, { ctrlKey: true }));
    act(() => result.current.handleItemClick('e', ORDER, { metaKey: true }));
    expect(sel(result.current.selected)).toBe('ace');
    act(() => result.current.handleItemClick('c', ORDER, { ctrlKey: true })); // toggle off
    expect(sel(result.current.selected)).toBe('ae');
  });

  it('Shift click selects a contiguous range from the anchor', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => result.current.handleItemClick('b', ORDER, {})); // anchor = b
    act(() => result.current.handleItemClick('d', ORDER, { shiftKey: true }));
    expect(sel(result.current.selected)).toBe('bcd');
    // a second shift-click re-ranges from the SAME anchor (b), not from d
    act(() => result.current.handleItemClick('a', ORDER, { shiftKey: true }));
    expect(sel(result.current.selected)).toBe('ab');
  });

  it('Ctrl+Shift click adds the range to the existing selection', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => result.current.handleItemClick('a', ORDER, {}));
    act(() => result.current.handleItemClick('d', ORDER, { ctrlKey: true })); // {a,d}, anchor=d
    act(() => result.current.handleItemClick('e', ORDER, { ctrlKey: true, shiftKey: true })); // + range d..e
    expect(sel(result.current.selected)).toBe('ade');
  });

  it('selectAll / clear / setSelection', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => result.current.selectAll(ORDER));
    expect(result.current.size).toBe(5);
    act(() => result.current.setSelection(['b', 'd'], 'd'));
    expect(sel(result.current.selected)).toBe('bd');
    expect(result.current.active).toBe('d');
    act(() => result.current.clear());
    expect(result.current.size).toBe(0);
    expect(result.current.active).toBe(null);
  });

  it('moveActive: plain arrow selects only, Shift+arrow extends from anchor', () => {
    const { result } = renderHook(() => useMultiSelect());
    act(() => result.current.selectOnly('b')); // anchor = b
    act(() => result.current.moveActive(ORDER, 'c', false)); // plain: only c, anchor moves
    expect(sel(result.current.selected)).toBe('c');
    act(() => result.current.moveActive(ORDER, 'e', true)); // shift from c
    expect(sel(result.current.selected)).toBe('cde');
    act(() => result.current.moveActive(ORDER, 'd', true)); // shrink range c..d
    expect(sel(result.current.selected)).toBe('cd');
  });
});
