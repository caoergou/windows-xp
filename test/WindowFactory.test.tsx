import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { restoreComponent } from '../src/utils/WindowFactory';
import { useWindowManager } from '../src/context/WindowManagerContext';
import { getStorageKey } from '../src/utils/storage';
import { encodeOpenWindows } from '../src/utils/windowPersistence';
import { renderWithProviders } from './utils';
import Calculator from '../src/apps/Calculator';
import FileProperties from '../src/components/FileProperties';

const STORAGE_KEY = getStorageKey('open_windows');

/** Extract the element type of a restored node (null when not an element). */
const typeOf = (node: React.ReactNode): unknown =>
  React.isValidElement(node) ? node.type : null;

/** Extract the props of a restored element. */
const propsOf = (node: React.ReactNode): Record<string, unknown> =>
  React.isValidElement(node) ? (node.props as Record<string, unknown>) : {};

beforeEach(() => {
  localStorage.clear();
});

describe('restoreComponent — registry exact match', () => {
  it('restores an appId registered in APP_REGISTRY (Calculator) with its props', () => {
    const node = restoreComponent('Calculator', { windowId: 'w1' });
    expect(typeOf(node)).toBe(Calculator);
    expect(propsOf(node)).toEqual({ windowId: 'w1' });
  });

  it('restores strictly by appId — props never divert a registered appId (Notepad with a url prop stays Notepad)', () => {
    const notepadType = typeOf(restoreComponent('Notepad', {}));
    const node = restoreComponent('Notepad', { url: 'https://example.com' });
    expect(typeOf(node)).toBe(notepadType);
    expect(typeOf(node)).not.toBe(typeOf(restoreComponent('InternetExplorer', {})));
  });
});

describe('restoreComponent — dynamic FileProperties appId', () => {
  it("restores appIds shaped like 'properties-xxx' as FileProperties, preserving props", () => {
    const componentProps = { item: { name: 'a.txt', type: 'file' } };
    const node = restoreComponent('properties-a.txt-123', componentProps);
    expect(typeOf(node)).toBe(FileProperties);
    expect(propsOf(node)).toEqual(componentProps);
  });
});

describe('restoreComponent — retired legacy paths (#163 C)', () => {
  // The pre-registry prop-sniffing heuristics (initialPath/url/html/content/src)
  // and the id/中文名 aliases were retired behind the open_windows storage version
  // bump. Folder windows now persist appId 'Explorer', IE persists
  // 'InternetExplorer', etc., so these spellings must fall through to null.
  const warn = () => vi.spyOn(console, 'warn').mockImplementation(vi.fn());

  it.each([
    ['unknown id + initialPath (was Explorer)', 'some-legacy-id', { initialPath: ['C:'] }],
    ["'Internet Explorer' with a space (was InternetExplorer)", 'Internet Explorer', { url: 'x' }],
    ['unknown id + url (was InternetExplorer)', 'legacy-window', { url: 'about:blank' }],
    ['unknown id + content (was Notepad)', 'readme.txt', { content: 'hi' }],
    ['unknown id + src (was PhotoViewer)', 'picture-window', { src: '/img/photo.jpg' }],
    ['legacy alias 画图 (was MicrosoftPaint)', '画图', {}],
    ['legacy alias 扫雷 (was Minesweeper)', '扫雷', {}],
    ['legacy alias run (was RunDialog)', 'run', {}],
  ])('returns null for %s', (_label, appId, props) => {
    const spy = warn();
    try {
      expect(restoreComponent(appId, props as Record<string, unknown>)).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('restoreComponent — unknown appId fallback', () => {
  it('returns null and warns for an unknown appId with no recognizable props', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    try {
      const node = restoreComponent('TotallyUnknownApp', { some: 'prop' });
      expect(node).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('TotallyUnknownApp'),
        { some: 'prop' }
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});

// ── WindowManagerContext persistence roundtrip ──────────────────────────────

const onlyWindowManager = {
  providers: { userSession: false, fileSystem: false, tray: false, modal: false },
};

const PersistenceHarness = () => {
  const { windows, openWindow } = useWindowManager();
  return (
    <div>
      <div data-testid="count">{windows.length}</div>
      <div data-testid="app-ids">{windows.map((w) => w.appId).join(',')}</div>
      <div data-testid="component-props">
        {JSON.stringify(windows.map((w) => w.componentProps))}
      </div>
      <div data-testid="all-have-components">
        {windows.every((w) => React.isValidElement(w.component)) ? 'yes' : 'no'}
      </div>
      <button
        onClick={() =>
          openWindow('Calculator', '计算器', <div>calc ui</div>, 'calculator', {
            width: 208,
            height: 196,
            componentProps: { windowId: 'persisted' },
            onClose: vi.fn(),
            onFocus: vi.fn(),
          })
        }
      >
        open calc
      </button>
    </div>
  );
};

describe('WindowManagerContext — persistence to localStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serializes open windows, keeping componentProps and stripping component/functions', () => {
    vi.useFakeTimers();
    renderWithProviders(<PersistenceHarness />, onlyWindowManager);
    fireEvent.click(screen.getByText('open calc'));
    // Persistence is debounced (#80); advance past the window.
    act(() => {
      vi.advanceTimersByTime(400);
    });
    vi.useRealTimers();

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const envelope = JSON.parse(raw as string);
    // Persisted under the versioned envelope (#163 C).
    expect(envelope.version).toBe(1);
    const saved = envelope.windows;
    expect(saved).toHaveLength(1);

    const win = saved[0];
    expect(win.appId).toBe('Calculator');
    expect(win.title).toBe('计算器');
    expect(win.icon).toBe('calculator');
    expect(win.width).toBe(208);
    expect(win.height).toBe(196);
    expect(win.componentProps).toEqual({ windowId: 'persisted' });

    // React element and callbacks must not be serialized
    expect(win).not.toHaveProperty('component');
    expect(win).not.toHaveProperty('onClose');
    expect(win).not.toHaveProperty('onFocus');
    expect(win).not.toHaveProperty('badge');
    expect(win).not.toHaveProperty('progress');
    expect(win).not.toHaveProperty('isFlashing');
    // functions inside props are dropped by JSON serialization
    expect(win.props).not.toHaveProperty('onClose');
    expect(win.props).not.toHaveProperty('onFocus');
    expect(win.props.width).toBe(208);
  });

  it('roundtrips: a window opened in one provider instance is restored on remount', () => {
    const first = renderWithProviders(<PersistenceHarness />, onlyWindowManager);
    fireEvent.click(screen.getByText('open calc'));
    expect(screen.getByTestId('count').textContent).toBe('1');
    first.unmount();

    // Fresh provider mount reads localStorage and rebuilds the component via the registry
    renderWithProviders(<PersistenceHarness />, onlyWindowManager);
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('app-ids').textContent).toBe('Calculator');
    expect(screen.getByTestId('component-props').textContent).toBe(
      JSON.stringify([{ windowId: 'persisted' }])
    );
    expect(screen.getByTestId('all-have-components').textContent).toBe('yes');
  });

  it('restores a pre-seeded window list and drops entries restoreComponent cannot rebuild', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    const baseWindow = {
      title: 't',
      props: {},
      isMinimized: false,
      isMaximized: false,
      zIndex: 10001,
      left: 10,
      top: 10,
    };
    localStorage.setItem(
      STORAGE_KEY,
      encodeOpenWindows([
        { ...baseWindow, id: '1', appId: 'Calculator', componentProps: {} },
        {
          ...baseWindow,
          id: '2',
          appId: 'Explorer',
          componentProps: { initialPath: ['My Documents'] },
        },
        { ...baseWindow, id: '3', appId: 'NoSuchApp', componentProps: {} },
      ])
    );

    vi.useFakeTimers();
    renderWithProviders(<PersistenceHarness />, onlyWindowManager);
    // Persistence is debounced (#80); advance so the rewrite lands.
    act(() => {
      vi.advanceTimersByTime(400);
    });
    vi.useRealTimers();

    // Calculator and Explorer (both registry matches) survive; the unknown app
    // restores to null and is filtered out.
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('app-ids').textContent).toBe('Calculator,Explorer');
    expect(screen.getByTestId('all-have-components').textContent).toBe('yes');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('NoSuchApp'), {});

    // The persist effect rewrites storage (versioned) with only the restorable windows
    const resaved = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(resaved.windows.map((w: { appId: string }) => w.appId)).toEqual([
      'Calculator',
      'Explorer',
    ]);
  });

  it('discards a pre-#163 unversioned (bare-array) window list on load', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    // Old format: a bare array, no version envelope.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          appId: 'Calculator',
          title: 't',
          componentProps: {},
          props: {},
          isMinimized: false,
          isMaximized: false,
          zIndex: 10001,
          left: 10,
          top: 10,
        },
      ])
    );

    renderWithProviders(<PersistenceHarness />, onlyWindowManager);

    // The whole legacy payload is dropped — nothing is fed to restoreComponent.
    expect(screen.getByTestId('count').textContent).toBe('0');
    warnSpy.mockRestore();
  });

  // openWindow only persists props explicitly passed as props.componentProps; the props
  // baked into the `component` React element are never captured. A caller doing
  // openWindow('Notepad', 't', <Notepad content="hi" />) gets an empty-props Notepad
  // after refresh. Known bug, do not assert the lossy behavior as green.
  it.todo('#81: windows opened without explicit componentProps lose their component props on restore');
});
