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
  default: ({ src }: { src: string }) => <div data-testid="photo-viewer">Viewing: {src}</div>
}));

// Mock XPIcon to avoid svg issues in test
vi.mock('../src/components/XPIcon', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>
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
    const myDocs = screen.getByText('我的文档');
    fireEvent.doubleClick(myDocs);

    // 2. Open My Pictures
    await waitFor(() => {
        const myPictures = screen.getByText('My Pictures');
        fireEvent.doubleClick(myPictures);
    });

    // 3. Open Sample Pictures
    await waitFor(() => {
        const samplePictures = screen.getByText('Sample Pictures');
        fireEvent.doubleClick(samplePictures);
    });

    // 4. Check for Bliss.jpg
    await waitFor(() => {
        expect(screen.getByText('Bliss.jpg')).toBeDefined();
    });

    // 5. Double click Bliss.jpg
    const blissFile = screen.getByText('Bliss.jpg');
    fireEvent.doubleClick(blissFile);

    // 6. Check for PhotoViewer
    await waitFor(() => {
        expect(screen.getByTestId('photo-viewer')).toBeDefined();
        expect(screen.getByText('Viewing: /images/desktop_bg.jpg')).toBeDefined();
    });
  });
});
