import { render, screen, act, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Desktop from '../src/components/Desktop';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { ModalProvider } from '../src/context/ModalContext';

// Mock XPIcon
vi.mock('../src/components/XPIcon', () => ({
  default: () => <div data-testid="xp-icon">Icon</div>
}));

// Mock Taskbar
vi.mock('../src/components/Taskbar', () => ({
  default: () => <div data-testid="taskbar">Taskbar</div>
}));

test('Desktop refresh action triggers visible blink (remount)', async () => {
  vi.useFakeTimers();

  render(
    <FileSystemProvider>
      <ModalProvider>
        <WindowManagerProvider>
          <Desktop />
        </WindowManagerProvider>
      </ModalProvider>
    </FileSystemProvider>
  );

  // We know "我的电脑" exists on desktop
  const myComputer = screen.getByText('我的电脑');
  expect(myComputer).toBeDefined();

  // Find the container to right click (DesktopContainer)
  const desktopIcon = myComputer.closest('div').parentElement; // DesktopIcon -> IconGrid
  const desktopContainer = desktopIcon.parentElement; // IconGrid -> DesktopContainer

  // Right click
  fireEvent.contextMenu(desktopContainer);

  // Click "刷新"
  const refreshOption = screen.getByText('刷新');
  fireEvent.click(refreshOption);

  // We check for opacity 0
  let iconGridElement = myComputer.parentElement.parentElement;
  expect(iconGridElement).toHaveStyle('opacity: 0');

  // Advance timers by 100ms
  act(() => {
    vi.advanceTimersByTime(100);
  });

  // Re-query for the element because it might have been remounted (key change)
  const myComputerNew = screen.getByText('我的电脑');
  const iconGridElementNew = myComputerNew.parentElement.parentElement;

  // Now opacity should be 1
  expect(iconGridElementNew).toHaveStyle('opacity: 1');

  // Also verify it's a different element (remounted)
  expect(iconGridElementNew).not.toBe(iconGridElement);
});
