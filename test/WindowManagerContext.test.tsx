import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useWindowManager } from '../src/context/WindowManagerContext';
import { renderWithProviders } from './utils';

const WindowManagerTestHarness = () => {
  const { windows, activeWindowId, openWindow, closeWindow, focusWindow } = useWindowManager();

  return (
    <div>
      <div data-testid="window-count">{windows.length}</div>
      <div data-testid="active-window">{activeWindowId ?? 'none'}</div>
      {windows.map((win, idx) => (
        <div key={win.id} data-testid={`zindex-${idx}`}>
          {win.zIndex}
        </div>
      ))}
      <button onClick={() => openWindow('app-1', 'App 1', <div>App 1</div>)}>Open first</button>
      <button onClick={() => openWindow('app-2', 'App 2', <div>App 2</div>)}>Open second</button>
      <button onClick={() => windows[0] && closeWindow(windows[0].id)}>Close first</button>
      <button onClick={() => windows[0] && focusWindow(windows[0].id)}>Focus first</button>
      <button onClick={() => windows[1] && focusWindow(windows[1].id)}>Focus second</button>
    </div>
  );
};

describe('WindowManagerContext', () => {
  it('openWindow adds a window to the windows array and marks it active', async () => {
    renderWithProviders(<WindowManagerTestHarness />);

    fireEvent.click(screen.getByText('Open first'));

    expect(screen.getByTestId('window-count').textContent).toBe('1');
    expect(screen.getByTestId('active-window').textContent).not.toBe('none');
  });

  it('closeWindow removes a window from the windows array', async () => {
    renderWithProviders(<WindowManagerTestHarness />);

    fireEvent.click(screen.getByText('Open first'));
    expect(screen.getByTestId('window-count').textContent).toBe('1');

    fireEvent.click(screen.getByText('Close first'));
    expect(screen.getByTestId('window-count').textContent).toBe('0');
    expect(screen.getByTestId('active-window').textContent).toBe('none');
  });

  it('focusWindow updates activeWindowId and bumps the target zIndex', async () => {
    renderWithProviders(<WindowManagerTestHarness />);

    fireEvent.click(screen.getByText('Open first'));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 2));
    });
    fireEvent.click(screen.getByText('Open second'));

    // After opening the second window it should be active and on top.
    const secondActiveId = screen.getByTestId('active-window').textContent;
    const firstZIndexBefore = screen.getByTestId('zindex-0').textContent;
    const secondZIndexBefore = screen.getByTestId('zindex-1').textContent;
    expect(secondActiveId).not.toBe('none');
    expect(Number(secondZIndexBefore)).toBeGreaterThan(Number(firstZIndexBefore));

    // Focusing the first window should make it active and raise its zIndex.
    fireEvent.click(screen.getByText('Focus first'));

    expect(screen.getByTestId('active-window').textContent).not.toBe(secondActiveId);
    expect(Number(screen.getByTestId('zindex-0').textContent)).toBeGreaterThan(
      Number(secondZIndexBefore)
    );
  });
});
