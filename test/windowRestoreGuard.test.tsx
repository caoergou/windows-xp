import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Desktop from '../src/components/Desktop';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { ModalProvider } from '../src/context/ModalContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';
import { TrayProvider } from '../src/context/TrayContext';
import { encodeOpenWindows } from '../src/utils/windowPersistence';

// Keep the render light and deterministic.
vi.mock('../src/components/XPIcon', () => ({
  default: () => <div data-testid="xp-icon">Icon</div>,
}));
vi.mock('../src/components/Taskbar', () => ({
  default: () => <div data-testid="taskbar">Taskbar</div>,
}));

const OPEN_WINDOWS_KEY = 'xp_open_windows';

function renderDesktop() {
  return render(
    <UserSessionProvider>
      <FileSystemProvider>
        <ModalProvider>
          <WindowManagerProvider>
            <TrayProvider>
              <Desktop />
            </TrayProvider>
          </WindowManagerProvider>
        </ModalProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  localStorage.clear();
});

/**
 * A malformed persisted window record (here, one missing the `props` field)
 * used to make WindowChrome throw on `props.minWidth`, white-screening the
 * entire desktop — taskbar and all (#223 bug 2). The field-level fallback plus
 * the per-window error boundary must keep the desktop alive.
 */
test('a persisted window record missing `props` does not white-screen the desktop', () => {
  const malformed = {
    id: 'bad-1',
    appId: 'Calculator',
    title: 'Calculator',
    icon: 'calculator',
    componentProps: {},
    zIndex: 100,
    width: 208,
    height: 196,
    left: 100,
    top: 100,
    isMinimized: false,
    isMaximized: false,
    // NOTE: no `props` field on purpose.
  };
  localStorage.setItem(OPEN_WINDOWS_KEY, encodeOpenWindows([malformed]));

  expect(() => renderDesktop()).not.toThrow();
  // The desktop itself is still mounted (a desktop icon is present).
  expect(screen.getByText('My Computer')).toBeDefined();
});

/**
 * A record whose `appId` is not in the registry restores to a null component;
 * it must still not crash the desktop, and siblings on the desktop survive.
 */
test('an unregistered appId record leaves the desktop and its icons intact', () => {
  const unknownApp = {
    id: 'bad-2',
    appId: 'ThisAppDoesNotExist',
    title: 'Ghost',
    icon: 'app_window',
    componentProps: {},
    props: {},
    zIndex: 100,
    width: 300,
    height: 200,
    left: 50,
    top: 50,
    isMinimized: false,
    isMaximized: false,
  };
  localStorage.setItem(OPEN_WINDOWS_KEY, encodeOpenWindows([unknownApp]));

  expect(() => renderDesktop()).not.toThrow();
  expect(screen.getByText('My Computer')).toBeDefined();
});
