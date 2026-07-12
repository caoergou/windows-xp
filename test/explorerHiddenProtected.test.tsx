/**
 * FileNode attributes (#219): `hidden` files are filtered from Explorer until
 * "show hidden files" is toggled on; `protected` files refuse deletion in-fiction.
 */
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import Explorer from '../src/apps/Explorer';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { ModalProvider } from '../src/context/ModalContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';
import { TrayProvider } from '../src/context/TrayContext';

vi.mock('../src/components/XPIcon', () => ({ default: () => <div data-testid="xp-icon">Icon</div> }));
vi.mock('../src/components/Explorer/ExplorerSidebar', () => ({ default: () => <div>Sidebar</div> }));
vi.mock('../src/components/Explorer/ExplorerToolbar', () => ({ default: () => <div>Toolbar</div> }));
vi.mock('../src/components/Explorer/AddressBar', () => ({ default: () => <div>AddressBar</div> }));

vi.mock('../src/data/filesystem.json', () => ({
  default: {
    root: {
      type: 'folder',
      name: 'root',
      children: {
        'notes.txt': { type: 'file', name: 'notes.txt', app: 'Notepad', content: 'hi' },
        'secret.txt': { type: 'file', name: 'secret.txt', hidden: true, mtime: '2007-08-12', app: 'Notepad', content: 'clue' },
        'boot.ini': { type: 'file', name: 'boot.ini', protected: true, app: 'Notepad', content: '[boot]' },
      },
    },
  },
}));

const mount = () =>
  render(
    <UserSessionProvider>
      <FileSystemProvider>
        <ModalProvider>
          <WindowManagerProvider>
            <TrayProvider>
              <Explorer initialPath={[]} />
            </TrayProvider>
          </WindowManagerProvider>
        </ModalProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  );

beforeEach(() => localStorage.clear());

test('a hidden file is absent until "show hidden files" is toggled on', async () => {
  mount();
  // Visible files render; the hidden one does not.
  expect(screen.getByText('notes.txt')).toBeInTheDocument();
  expect(screen.getByText('boot.ini')).toBeInTheDocument();
  expect(screen.queryByText('secret.txt')).not.toBeInTheDocument();

  // Right-click empty space → context menu → "Show Hidden Files".
  fireEvent.contextMenu(screen.getByText('notes.txt').closest('div')!.parentElement!.parentElement!);
  const toggle = await screen.findByText(/Show Hidden Files/i);
  fireEvent.click(toggle);

  // Now the hidden file appears.
  await waitFor(() => expect(screen.getByText('secret.txt')).toBeInTheDocument());
});

test('deleting a protected file is refused with an error', async () => {
  mount();
  const protectedItem = screen.getByText('boot.ini').closest('[data-item-key]') as HTMLElement;
  fireEvent.contextMenu(protectedItem);
  const del = await screen.findByText(/^Delete$/i);
  fireEvent.click(del);
  await waitFor(() =>
    expect(screen.getByText(/protected system file/i)).toBeInTheDocument()
  );
  // The file is still there — deletion did not proceed.
  expect(screen.getByText('boot.ini')).toBeInTheDocument();
});
