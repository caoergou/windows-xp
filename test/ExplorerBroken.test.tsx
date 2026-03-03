import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Explorer from '../src/apps/Explorer';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { ModalProvider } from '../src/context/ModalContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';
import { TrayProvider } from '../src/context/TrayContext';

// Mock XPIcon
vi.mock('../src/components/XPIcon', () => ({
  default: () => <div data-testid="xp-icon">Icon</div>
}));

// Mock components used in Explorer
vi.mock('../src/components/Explorer/ExplorerSidebar', () => ({
    default: () => <div>Sidebar</div>
}));
vi.mock('../src/components/Explorer/ExplorerToolbar', () => ({
    default: ({ onBack, onForward, onUp }: any) => (
        <div>
            <button onClick={onBack}>Back</button>
            <button onClick={onForward}>Forward</button>
            <button onClick={onUp}>Up</button>
        </div>
    )
}));
vi.mock('../src/components/Explorer/AddressBar', () => ({
    default: () => <div>AddressBar</div>
}));

// Mock filesystem data to include broken files/folders
vi.mock('../src/data/filesystem.json', () => ({
  default: {
    "root": {
      "type": "folder",
      "name": "root",
      "children": {
        "BrokenFolder": {
          "type": "folder",
          "name": "损坏的文件夹",
          "broken": true,
          "children": {}
        },
        "BrokenFile.txt": {
          "type": "file",
          "name": "损坏的文件.txt",
          "broken": true,
          "app": "Notepad",
          "content": "..."
        },
        "NormalFolder": {
           "type": "folder",
           "name": "正常文件夹",
           "children": {}
        }
      }
    }
  }
}));

test('Opening a broken folder shows error message', async () => {
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

  // Find the broken folder
  const brokenFolder = screen.getByText('损坏的文件夹');

  // Double click to open
  fireEvent.doubleClick(brokenFolder.closest('div')!); // Click the wrapper

  // Check for error modal
  await waitFor(() => {
     const errorMsg = screen.queryByText(/磁盘文件损坏/);
     expect(errorMsg).toBeInTheDocument();
  }, { timeout: 1000 }).catch(() => {
     throw new Error("Expected error message not found!");
  });
});

test('Opening a broken file shows error message', async () => {
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

    // Find the broken file
    const brokenFile = screen.getByText('损坏的文件.txt');

    // Double click to open
    fireEvent.doubleClick(brokenFile.closest('div')!); // Click the wrapper

    await waitFor(() => {
       const errorMsg = screen.queryByText(/磁盘文件损坏/);
       expect(errorMsg).toBeInTheDocument();
    }, { timeout: 1000 }).catch(() => {
        throw new Error("Expected error message not found!");
    });
  });
