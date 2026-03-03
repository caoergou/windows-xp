import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import Desktop from '../src/components/Desktop';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { ModalProvider } from '../src/context/ModalContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';

// Mock PhotoViewer since we're testing integration
vi.mock('../src/apps/PhotoViewer', () => ({
  default: ({ src }) => <div data-testid="photo-viewer">Viewing: {src}</div>
}));

// Mock XPIcon to avoid svg issues in test
vi.mock('../src/components/XPIcon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

const renderDesktop = () => {
  return render(
    <ModalProvider>
      <UserSessionProvider>
        <FileSystemProvider>
            <WindowManagerProvider>
            <Desktop />
            </WindowManagerProvider>
        </FileSystemProvider>
      </UserSessionProvider>
    </ModalProvider>
  );
};

describe('Image File Integration', () => {
  it('opens PhotoViewer when an image file on desktop is double-clicked', async () => {
    // Assuming 'Bliss.jpg' is in filesystem.json under root -> children
    // If it's in 'My Documents', it won't be on Desktop by default unless desktop items are different.
    // Let's check where we added 'Bliss.jpg'.
    // We added it to "My Documents" -> children.
    // Desktop only shows root -> children.

    // Ah, wait, I added it to "My Documents" which is inside "root".
    // The "Desktop" component renders `fs.root.children`.
    // "My Documents" is a child of root.
    // So "My Documents" icon should be on desktop. "Bliss.jpg" is inside "My Documents".
    // So to test "Bliss.jpg", we first need to open "My Documents" (Explorer), then double click "Bliss.jpg".

    // Wait, let's verify where I added "Bliss.jpg".
    // I added it as a sibling to "Private" folder inside "My Documents".

    // So the flow is:
    // 1. Double click "My Documents" on Desktop.
    // 2. Wait for Explorer to open.
    // 3. Find "Bliss.jpg" in Explorer.
    // 4. Double click "Bliss.jpg".
    // 5. Check if PhotoViewer is opened.

    renderDesktop();

    // 1. Open My Documents
    const myDocs = screen.getByText('我的文档');
    fireEvent.doubleClick(myDocs);

    // 2. Explorer should open. We look for "Bliss.jpg" text.
    await waitFor(() => {
        expect(screen.getByText('Bliss.jpg')).toBeDefined();
    });

    // 3. Double click Bliss.jpg
    const blissFile = screen.getByText('Bliss.jpg');
    fireEvent.doubleClick(blissFile);

    // 4. Check for PhotoViewer
    await waitFor(() => {
        expect(screen.getByTestId('photo-viewer')).toBeDefined();
        expect(screen.getByText('Viewing: /images/desktop_bg.jpg')).toBeDefined();
    });
  });
});
