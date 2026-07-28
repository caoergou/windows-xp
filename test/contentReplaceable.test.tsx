import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { WindowsXP } from '../src/lib';
import type { FileNode } from '../src/lib';

const customFs: Record<string, FileNode> = {
  Portfolio: { type: 'app_shortcut', name: 'Portfolio', app: 'InternetExplorer', icon: 'ie' },
};

describe('content replaceability (#77)', () => {
  beforeEach(() => localStorage.clear());

  it('merge mode (default) keeps built-in desktop shortcuts', async () => {
    render(<WindowsXP skipBoot autoLogin customFileSystem={customFs} />);
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());
    // A built-in app shortcut is present alongside the custom one.
    expect(screen.getByTestId('desktop-icon-Calculator')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-icon-Portfolio')).toBeInTheDocument();
  });

  it('replace mode drops built-in shortcuts and shows only injected content', async () => {
    render(<WindowsXP skipBoot autoLogin fileSystemMode="replace" customFileSystem={customFs} />);
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());

    // Built-in app shortcuts and culture shortcuts are gone.
    expect(screen.queryByTestId('desktop-icon-Calculator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('desktop-icon-Internet Explorer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('desktop-icon-QQ')).not.toBeInTheDocument();
    // The consumer's content is the desktop.
    expect(screen.getByTestId('desktop-icon-Portfolio')).toBeInTheDocument();
  });

  it('applies a custom wallpaper URL via defaultWallpaper', async () => {
    const url = 'https://example.com/my-wallpaper.jpg';
    render(<WindowsXP skipBoot autoLogin defaultWallpaper={url} />);
    await waitFor(() => expect(screen.getByTestId('desktop')).toBeInTheDocument());
    const desktop = screen.getByTestId('desktop');
    expect(desktop).toHaveStyle(`background-image: url(${url})`);
  });

  it('password-gates a locked folder opened from the desktop (#298)', async () => {
    render(
      <WindowsXP
        skipBoot
        autoLogin
        fileSystemMode="replace"
        customFileSystem={{
          Secret: {
            type: 'folder',
            name: 'Secret',
            locked: true,
            password: 'correct-horse',
            hint: 'A hint',
            children: {
              'private.txt': {
                type: 'file',
                name: 'private.txt',
                app: 'Notepad',
                content: 'private',
              },
            },
          },
        }}
      />
    );

    fireEvent.doubleClick(await screen.findByTestId('desktop-icon-Secret'));
    const password = await screen.findByPlaceholderText(/password|密码/i);
    expect(screen.queryByTestId('file-item-private.txt')).not.toBeInTheDocument();

    fireEvent.change(password, { target: { value: 'correct-horse' } });
    fireEvent.keyDown(password, { key: 'Enter' });
    await waitFor(() => expect(screen.getByTestId('file-item-private.txt')).toBeInTheDocument());
  });

  it('keeps the same password gate when navigating to a locked Explorer child (#298)', async () => {
    render(
      <WindowsXP
        skipBoot
        autoLogin
        fileSystemMode="replace"
        customFileSystem={{
          Open: {
            type: 'folder',
            name: 'Open',
            children: {
              Secret: {
                type: 'folder',
                name: 'Secret',
                locked: true,
                password: 'correct-horse',
                children: {
                  'private.txt': {
                    type: 'file',
                    name: 'private.txt',
                    app: 'Notepad',
                    content: 'private',
                  },
                },
              },
            },
          },
        }}
      />
    );

    fireEvent.doubleClick(await screen.findByTestId('desktop-icon-Open'));
    fireEvent.doubleClick(await screen.findByTestId('file-item-Secret'));
    const password = await screen.findByPlaceholderText(/password|密码/i);
    expect(screen.queryByTestId('file-item-private.txt')).not.toBeInTheDocument();

    fireEvent.change(password, { target: { value: 'correct-horse' } });
    fireEvent.keyDown(password, { key: 'Enter' });
    await waitFor(() => expect(screen.getByTestId('file-item-private.txt')).toBeInTheDocument());
  });
});
