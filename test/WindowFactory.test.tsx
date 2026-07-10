import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { restoreComponent } from '../src/utils/WindowFactory';
import { useWindowManager } from '../src/context/WindowManagerContext';
import { getStorageKey } from '../src/utils/storage';
import { renderWithProviders } from './utils';
import Explorer from '../src/apps/Explorer';
import Calculator from '../src/apps/Calculator';
import PhotoViewer from '../src/apps/PhotoViewer';
import FileProperties from '../src/components/FileProperties';

const STORAGE_KEY = getStorageKey('open_windows');

/** Extract the element type of a restored node (null when not an element). */
const typeOf = (node: React.ReactNode): unknown =>
  React.isValidElement(node) ? node.type : null;

/** Extract the props of a restored element. */
const propsOf = (node: React.ReactNode): Record<string, unknown> =>
  React.isValidElement(node) ? (node.props as Record<string, unknown>) : {};

const isLazyType = (type: unknown): boolean =>
  typeof type === 'object' &&
  type !== null &&
  (type as { $$typeof?: symbol }).$$typeof === Symbol.for('react.lazy');

beforeEach(() => {
  localStorage.clear();
});

describe('restoreComponent — registry exact match', () => {
  it('restores an appId registered in APP_REGISTRY (Calculator) with its props', () => {
    const node = restoreComponent('Calculator', { windowId: 'w1' });
    expect(typeOf(node)).toBe(Calculator);
    expect(propsOf(node)).toEqual({ windowId: 'w1' });
  });

  it('registry match wins over legacy prop heuristics (Notepad appId with a url prop stays Notepad)', () => {
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

describe('restoreComponent — legacy prop heuristics', () => {
  it('restores unknown appIds with initialPath as Explorer', () => {
    const node = restoreComponent('some-legacy-id', { initialPath: ['C:', 'Documents'] });
    expect(typeOf(node)).toBe(Explorer);
    expect(propsOf(node)).toEqual({ initialPath: ['C:', 'Documents'] });
  });

  it("restores appId 'Internet Explorer' (with space, old format) as InternetExplorer", () => {
    const ieType = typeOf(restoreComponent('InternetExplorer', {}));
    expect(isLazyType(ieType)).toBe(true); // sanity: IE is a lazy component
    const node = restoreComponent('Internet Explorer', { url: 'https://example.com' });
    expect(typeOf(node)).toBe(ieType);
    expect(propsOf(node).url).toBe('https://example.com');
  });

  it('restores unknown appIds with a url prop as InternetExplorer', () => {
    const ieType = typeOf(restoreComponent('InternetExplorer', {}));
    expect(typeOf(restoreComponent('legacy-window', { url: 'about:blank' }))).toBe(ieType);
  });

  it('restores unknown appIds with an html prop as InternetExplorer', () => {
    const ieType = typeOf(restoreComponent('InternetExplorer', {}));
    const node = restoreComponent('legacy-window', { html: '<h1>hi</h1>' });
    expect(typeOf(node)).toBe(ieType);
    expect(propsOf(node)).toEqual({ html: '<h1>hi</h1>' });
  });

  it('restores unknown appIds with a content prop (and no url/html) as Notepad', () => {
    const notepadType = typeOf(restoreComponent('Notepad', {}));
    const node = restoreComponent('readme.txt', { content: 'hello', readOnly: true });
    expect(typeOf(node)).toBe(notepadType);
    expect(propsOf(node)).toEqual({ content: 'hello', readOnly: true });
  });

  it('content prop takes precedence over src (branch order: Notepad before PhotoViewer)', () => {
    const notepadType = typeOf(restoreComponent('Notepad', {}));
    expect(typeOf(restoreComponent('legacy', { content: 'x', src: 'a.png' }))).toBe(notepadType);
  });

  it('restores unknown appIds with a src prop as PhotoViewer', () => {
    const node = restoreComponent('picture-window', { src: '/img/photo.jpg' });
    expect(typeOf(node)).toBe(PhotoViewer);
    expect(propsOf(node)).toEqual({ src: '/img/photo.jpg' });
  });

  it.each([
    ['run', 'RunDialog'],
    ['cmd', 'CommandPrompt'],
    ['Command Prompt', 'CommandPrompt'],
    ['volume', 'VolumeControl'],
    ['network', 'NetworkConnections'],
    ['controlpanel', 'ControlPanel'],
    ['paint', 'MicrosoftPaint'],
    ['画图', 'MicrosoftPaint'],
    ['minesweeper', 'Minesweeper'],
    ['扫雷', 'Minesweeper'],
  ])('restores legacy alias appId %j as %s', (legacyAppId, registryId) => {
    const expectedType = typeOf(restoreComponent(registryId, {}));
    expect(expectedType).not.toBeNull();
    expect(typeOf(restoreComponent(legacyAppId, {}))).toBe(expectedType);
  });
});

describe('restoreComponent — My Computer / Recycle Bin / My Documents', () => {
  // In the current code these windows are restored via the initialPath heuristic
  // (resolveFileOpen always persists componentProps.initialPath for folder-like nodes).
  it.each([['My Computer'], ['Recycle Bin'], ['My Documents']])(
    'restores appId %j with initialPath as Explorer',
    (appId) => {
      const node = restoreComponent(appId, { initialPath: [appId] });
      expect(typeOf(node)).toBe(Explorer);
      expect(propsOf(node)).toEqual({ initialPath: [appId] });
    }
  );

  // CLAUDE.md documents a dedicated "My Computer / Recycle Bin / My Documents -> Explorer"
  // appId branch, but restoreComponent has no such branch: without componentProps.initialPath
  // these appIds fall through to the unknown-appId fallback and return null.
  it.todo(
    'documented appId-only branch: "My Computer" without initialPath should restore as Explorer (currently returns null)'
  );
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
    renderWithProviders(<PersistenceHarness />, onlyWindowManager);
    fireEvent.click(screen.getByText('open calc'));

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw as string);
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
      JSON.stringify([
        { ...baseWindow, id: '1', appId: 'Calculator', componentProps: {} },
        {
          ...baseWindow,
          id: '2',
          appId: 'old-explorer-window',
          componentProps: { initialPath: ['My Documents'] },
        },
        { ...baseWindow, id: '3', appId: 'NoSuchApp', componentProps: {} },
      ])
    );

    renderWithProviders(<PersistenceHarness />, onlyWindowManager);

    // Calculator (registry match) and legacy Explorer (initialPath heuristic) survive;
    // the unknown app restores to null and is filtered out.
    expect(screen.getByTestId('count').textContent).toBe('2');
    expect(screen.getByTestId('app-ids').textContent).toBe('Calculator,old-explorer-window');
    expect(screen.getByTestId('all-have-components').textContent).toBe('yes');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('NoSuchApp'), {});

    // The persist effect rewrites storage with only the restorable windows
    const resaved = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(resaved.map((w: { appId: string }) => w.appId)).toEqual([
      'Calculator',
      'old-explorer-window',
    ]);
  });

  // openWindow only persists props explicitly passed as props.componentProps; the props
  // baked into the `component` React element are never captured. A caller doing
  // openWindow('Notepad', 't', <Notepad content="hi" />) gets an empty-props Notepad
  // after refresh. Known bug, do not assert the lossy behavior as green.
  it.todo('#81: windows opened without explicit componentProps lose their component props on restore');
});
