import { render, screen, fireEvent, act } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Desktop from '../src/components/Desktop';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { ModalProvider } from '../src/context/ModalContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';
import { TrayProvider } from '../src/context/TrayContext';

// Mock XPIcon
vi.mock('../src/components/XPIcon', () => ({
  default: () => <div data-testid="xp-icon">Icon</div>,
}));

// Mock Taskbar
vi.mock('../src/components/Taskbar', () => ({
  default: () => <div data-testid="taskbar">Taskbar</div>,
}));

test('Desktop refresh action triggers visible blink (remount)', async () => {
  vi.useFakeTimers();

  render(
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

  // We know "My Computer" exists on desktop
  const myComputer = screen.getByText('My Computer');
  expect(myComputer).toBeDefined();

  // Find the container to right click (DesktopContainer)
  const desktopIcon = myComputer.closest('div')?.parentElement; // DesktopIcon -> IconGrid
  const desktopContainer = desktopIcon?.parentElement; // IconGrid -> DesktopContainer

  if (!desktopContainer) {
    throw new Error('Desktop container not found');
  }

  // Right click
  fireEvent.contextMenu(desktopContainer);

  // Click "Refresh"
  const refreshOption = screen.getByText('Refresh');
  fireEvent.click(refreshOption);

  // We check for opacity 0
  const iconGridElement = myComputer.parentElement?.parentElement;
  expect(iconGridElement).toHaveStyle('opacity: 0');

  // Advance timers by 100ms
  act(() => {
    vi.advanceTimersByTime(100);
  });

  // Re-query for the element because it might have been remounted (key change)
  const myComputerNew = screen.getByText('My Computer');
  const iconGridElementNew = myComputerNew.parentElement?.parentElement;

  // Now opacity should be 1
  expect(iconGridElementNew).toHaveStyle('opacity: 1');

  // Also verify it's a different element (remounted)
  expect(iconGridElementNew).not.toBe(iconGridElement);
});
