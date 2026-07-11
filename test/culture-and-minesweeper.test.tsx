import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { WindowsXP } from '../src/lib';
import Minesweeper from '../src/apps/Minesweeper';
import { getDesktopShortcuts, getStartMenuProfile } from '../src/data/culture';
import { renderWithProviders } from './utils';
import i18n from '../src/i18n';
import ControlPanel from '../src/apps/ControlPanel';

describe('culture profiles', () => {
  beforeEach(() => {
    localStorage.clear();
    i18n.changeLanguage('en');
  });

  it('uses distinct, functional desktop and Start menu applications', () => {
    expect(getDesktopShortcuts('zh').map(item => item.app)).toContain('SafeGuard360');
    expect(getDesktopShortcuts('en')).toEqual([
      expect.objectContaining({ app: 'WindowsMediaPlayer', icon: 'media_player' }),
    ]);
    expect(getDesktopShortcuts('en').some(item => item.app === 'DummyApp')).toBe(false);

    expect(getStartMenuProfile('zh').pinned.map(item => item.action)).toContain('QQ');
    expect(getStartMenuProfile('en').pinned.map(item => item.action)).toContain(
      'WindowsMediaPlayer'
    );
  });

  it('applies the saved system language on startup', async () => {
    localStorage.setItem('xp_language', 'zh');
    render(<WindowsXP language="en" skipBoot autoLogin disableScreenSaver />);

    await waitFor(() => {
      expect(screen.getByTestId('desktop-icon-360安全卫士')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('desktop-icon-Windows Media Player')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /language/i })).not.toBeInTheDocument();
  });

  it('exposes language selection under Control Panel System', async () => {
    renderWithProviders(<ControlPanel />);

    expect(screen.getByText('Add or Remove Programs')).toBeInTheDocument();
    expect(screen.queryByText('添加或删除程序')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('System'));

    const language = screen.getByRole('combobox', { name: 'System language:' });
    fireEvent.change(language, { target: { value: 'zh' } });
    expect(await screen.findByText(/must restart to apply the new language/i)).toBeInTheDocument();
  });
});

describe('Minesweeper controls', () => {
  it('keeps each cell at 16px and reveals the selected cell', async () => {
    renderWithProviders(<Minesweeper />);
    const cell = await screen.findByTestId('minesweeper-cell-0-0');

    expect(getComputedStyle(cell).minWidth).toBe('16px');
    expect(getComputedStyle(cell).minHeight).toBe('16px');
    fireEvent.click(cell);

    await waitFor(() => expect(cell).toHaveAttribute('data-revealed', 'true'));
  });

  it('uses right-click for flags without opening the desktop menu', async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
    render(<WindowsXP language="en" skipBoot autoLogin disableScreenSaver />);
    fireEvent.doubleClick(await screen.findByTestId('desktop-icon-Minesweeper'));

    const cell = await screen.findByTestId('minesweeper-cell-0-0');
    fireEvent.contextMenu(cell);

    await waitFor(() => expect(cell).toHaveAttribute('data-flagged', 'true'));
    expect(screen.queryByText('Refresh')).not.toBeInTheDocument();
  });

  it('shows the taskbar menu with a functional Task Manager entry', async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
    render(<WindowsXP language="en" skipBoot autoLogin disableScreenSaver />);

    fireEvent.contextMenu(await screen.findByTestId('taskbar'));
    expect(await screen.findByText('Task Manager')).toBeInTheDocument();
    expect(screen.queryByText('Refresh')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Task Manager'));
    expect(await screen.findByText('Applications')).toBeInTheDocument();
  });
});
