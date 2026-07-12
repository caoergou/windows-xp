import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Keymap,
  parseCombo,
  normalizeCombo,
  comboMatchesEvent,
  isTextEntryElement,
  type ShortcutSpec,
} from '../src/utils/keymap';

const ev = (o: Partial<KeyboardEvent> & { key: string }) => ({
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  preventDefault: vi.fn(),
  ...o,
}) as unknown as KeyboardEvent;

describe('parseCombo', () => {
  it('parses modifiers and normalizes the key', () => {
    expect(parseCombo('Mod+Shift+S')).toEqual({ mod: true, ctrl: false, meta: false, alt: false, shift: true, key: 's' });
    expect(parseCombo('Alt+F4')).toEqual({ mod: false, ctrl: false, meta: false, alt: true, shift: false, key: 'f4' });
    expect(parseCombo('Ctrl+Esc').key).toBe('escape');
    expect(parseCombo('Delete').key).toBe('delete');
    expect(parseCombo('Up').key).toBe('arrowup');
  });
});

describe('normalizeCombo', () => {
  it('canonicalizes order and case so equivalent combos collide', () => {
    expect(normalizeCombo('Shift+Mod+s')).toBe(normalizeCombo('mod+shift+S'));
    expect(normalizeCombo('Ctrl+Esc')).toBe('ctrl+escape');
  });
});

describe('comboMatchesEvent — Mod normalization', () => {
  it('Mod is Ctrl on Windows/Linux, Cmd on macOS', () => {
    const modA = parseCombo('Mod+A');
    // non-mac: Ctrl+A matches, Cmd+A does not
    expect(comboMatchesEvent(modA, ev({ key: 'a', ctrlKey: true }), false)).toBe(true);
    expect(comboMatchesEvent(modA, ev({ key: 'a', metaKey: true }), false)).toBe(false);
    // mac: Cmd+A matches, Ctrl+A does not
    expect(comboMatchesEvent(modA, ev({ key: 'a', metaKey: true }), true)).toBe(true);
    expect(comboMatchesEvent(modA, ev({ key: 'a', ctrlKey: true }), true)).toBe(false);
  });

  it('literal Ctrl stays Ctrl on macOS', () => {
    const ctrlEsc = parseCombo('Ctrl+Esc');
    expect(comboMatchesEvent(ctrlEsc, ev({ key: 'Escape', ctrlKey: true }), true)).toBe(true);
    expect(comboMatchesEvent(ctrlEsc, ev({ key: 'Escape', metaKey: true }), true)).toBe(false);
  });

  it('requires exact modifier set (no extra modifiers)', () => {
    const altF4 = parseCombo('Alt+F4');
    expect(comboMatchesEvent(altF4, ev({ key: 'F4', altKey: true }), false)).toBe(true);
    expect(comboMatchesEvent(altF4, ev({ key: 'F4', altKey: true, ctrlKey: true }), false)).toBe(false);
  });

  it('handles Shift with a letter (uppercase event key)', () => {
    const c = parseCombo('Mod+Shift+S');
    expect(comboMatchesEvent(c, ev({ key: 'S', ctrlKey: true, shiftKey: true }), false)).toBe(true);
  });
});

describe('Keymap.dispatch', () => {
  const spec = (o: Partial<ShortcutSpec> & { id: string; combo: string; scope: ShortcutSpec['scope'] }): ShortcutSpec => o;

  it('fires a matching global binding and preventDefaults by default', () => {
    const km = new Keymap({ isMac: false });
    const fn = vi.fn();
    km.register(spec({ id: 'startMenu.toggle', combo: 'Ctrl+Esc', scope: 'global' }), fn);
    const e = ev({ key: 'Escape', ctrlKey: true });
    expect(km.dispatch(e, { inInput: false })).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('disableGlobalShortcuts silences global bindings but not app ones', () => {
    const km = new Keymap({ isMac: false, disableGlobalShortcuts: true });
    const g = vi.fn(); const a = vi.fn();
    km.register(spec({ id: 'window.close', combo: 'Alt+F4', scope: 'global' }), g);
    km.register(spec({ id: 'calc.equals', combo: 'Enter', scope: 'app', appId: 'Calculator' }), a);
    expect(km.dispatch(ev({ key: 'F4', altKey: true }), { inInput: false })).toBe(false);
    expect(g).not.toHaveBeenCalled();
    expect(km.dispatch(ev({ key: 'Enter' }), { inInput: false, focusedAppId: 'Calculator' })).toBe(true);
    expect(a).toHaveBeenCalledOnce();
  });

  it('app-scope fires only when its window is focused', () => {
    const km = new Keymap({ isMac: false });
    const fn = vi.fn();
    km.register(spec({ id: 'mine.reset', combo: 'F2', scope: 'app', appId: 'Minesweeper' }), fn);
    expect(km.dispatch(ev({ key: 'F2' }), { inInput: false, focusedAppId: 'Explorer' })).toBe(false);
    expect(km.dispatch(ev({ key: 'F2' }), { inInput: false, focusedAppId: 'Minesweeper' })).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('desktop-scope fires only when no window/dialog is focused', () => {
    const km = new Keymap({ isMac: false });
    const fn = vi.fn();
    km.register(spec({ id: 'desktop.rename', combo: 'F2', scope: 'desktop' }), fn);
    expect(km.dispatch(ev({ key: 'F2' }), { inInput: false, inWindow: true })).toBe(false);
    expect(fn).not.toHaveBeenCalled();
    expect(km.dispatch(ev({ key: 'F2' }), { inInput: false, inWindow: false })).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('stands down while typing unless allowInInput', () => {
    const km = new Keymap({ isMac: false });
    const guarded = vi.fn(); const allowed = vi.fn();
    km.register(spec({ id: 'desktop.selectAll', combo: 'Mod+A', scope: 'global' }), guarded);
    km.register(spec({ id: 'calc.digit', combo: '1', scope: 'app', appId: 'Calculator', allowInInput: true }), allowed);
    expect(km.dispatch(ev({ key: 'a', ctrlKey: true }), { inInput: true })).toBe(false);
    expect(guarded).not.toHaveBeenCalled();
    expect(km.dispatch(ev({ key: '1' }), { inInput: true, focusedAppId: 'Calculator' })).toBe(true);
    expect(allowed).toHaveBeenCalledOnce();
  });

  it('honors overrides: remap and disable', () => {
    const km = new Keymap({ isMac: false, overrides: { 'startMenu.toggle': 'Mod+Space', 'window.close': null } });
    const toggle = vi.fn(); const close = vi.fn();
    km.register(spec({ id: 'startMenu.toggle', combo: 'Ctrl+Esc', scope: 'global' }), toggle);
    km.register(spec({ id: 'window.close', combo: 'Alt+F4', scope: 'global' }), close);
    // original combo no longer fires; the remapped one does
    expect(km.dispatch(ev({ key: 'Escape', ctrlKey: true }), { inInput: false })).toBe(false);
    expect(km.dispatch(ev({ key: ' ', ctrlKey: true }), { inInput: false })).toBe(true);
    expect(toggle).toHaveBeenCalledOnce();
    // disabled binding never fires
    expect(km.dispatch(ev({ key: 'F4', altKey: true }), { inInput: false })).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it('unregister removes a binding', () => {
    const km = new Keymap({ isMac: false });
    const fn = vi.fn();
    const off = km.register(spec({ id: 'x', combo: 'F5', scope: 'global' }), fn);
    off();
    expect(km.dispatch(ev({ key: 'F5' }), { inInput: false })).toBe(false);
  });
});

describe('conflict detection', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { warn.mockRestore(); });

  it('warns when two ids bind the same combo in the same scope', () => {
    const km = new Keymap({ isMac: false, warnOnConflict: true });
    km.register({ id: 'a', combo: 'Ctrl+Esc', scope: 'global' }, () => {});
    km.register({ id: 'b', combo: 'ctrl+escape', scope: 'global' }, () => {});
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0][0])).toMatch(/keymap conflict/);
  });

  it('does not warn across different scopes or apps', () => {
    const km = new Keymap({ isMac: false, warnOnConflict: true });
    km.register({ id: 'a', combo: 'F2', scope: 'app', appId: 'Explorer' }, () => {});
    km.register({ id: 'b', combo: 'F2', scope: 'app', appId: 'Minesweeper' }, () => {});
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('isTextEntryElement', () => {
  it('detects inputs, textareas and selects', () => {
    const mk = (tag: string) => document.createElement(tag);
    expect(isTextEntryElement(mk('input'))).toBe(true);
    expect(isTextEntryElement(mk('textarea'))).toBe(true);
    expect(isTextEntryElement(mk('select'))).toBe(true);
    expect(isTextEntryElement(mk('div'))).toBe(false);
    expect(isTextEntryElement(null)).toBe(false);
  });

  it('detects contentEditable elements', () => {
    // jsdom doesn't compute `isContentEditable`, so assert on the property directly.
    const el = document.createElement('div');
    Object.defineProperty(el, 'isContentEditable', { value: true });
    expect(isTextEntryElement(el)).toBe(true);
  });
});
