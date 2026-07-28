import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Desktop from '../src/components/Desktop';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { ModalProvider } from '../src/context/ModalContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';
import { TrayProvider } from '../src/context/TrayContext';

// Mock PhotoViewer since we're testing integration
vi.mock('../src/apps/PhotoViewer', () => ({
  default: ({ src }: { src: string }) => <div data-testid="photo-viewer">Viewing: {src}</div>,
}));

// Mock XPIcon to avoid svg issues in test
vi.mock('../src/components/XPIcon', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

const renderDesktop = () => {
  return render(
    <ModalProvider>
      <UserSessionProvider>
        <FileSystemProvider>
          <WindowManagerProvider>
            <TrayProvider>
              <Desktop />
            </TrayProvider>
          </WindowManagerProvider>
        </FileSystemProvider>
      </UserSessionProvider>
    </ModalProvider>
  );
};

describe('Image File Integration', () => {
  it('opens PhotoViewer when an image file on desktop is double-clicked', async () => {
    renderDesktop();

    // 1. Open My Documents
    const myDocs = screen.getByText('My Documents');
    fireEvent.doubleClick(myDocs);

    // Wait for each navigation to settle, then fire exactly one double-click.
    // Triggering interactions inside waitFor can repeat them under CI load.
    const myPictures = await screen.findByText('My Pictures');
    fireEvent.doubleClick(myPictures);

    const samplePictures = await screen.findByText('Sample Pictures');
    fireEvent.doubleClick(samplePictures);

    const blissFile = await screen.findByText('Bliss.jpg');
    fireEvent.doubleClick(blissFile);

    await waitFor(() => {
      expect(screen.getByTestId('photo-viewer')).toBeDefined();
      expect(screen.getByText('Viewing: /images/desktop_bg.jpg')).toBeDefined();
    });
  }, 15_000);
});
