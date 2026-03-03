import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { expect, test, vi } from 'vitest';
import PhotoViewer from '../src/apps/PhotoViewer';
import FileProperties from '../src/components/FileProperties';
import { WindowManagerContext } from '../src/context/WindowManagerContext';

// Mock context functions
const mockOpenWindow = vi.fn();
const mockCloseWindow = vi.fn();

const mockWindowManager = {
    openWindow: mockOpenWindow,
    closeWindow: mockCloseWindow,
    windows: [],
    activeWindowId: null,
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    resizeWindow: vi.fn(),
    focusWindow: vi.fn(),
};

const WindowManagerProvider = ({ children }) => (
    <WindowManagerContext.Provider value={mockWindowManager}>
        {children}
    </WindowManagerContext.Provider>
);

test('PhotoViewer renders image and properties button when fileItem provided', () => {
    const fileItem = { name: 'test.jpg', path: 'C:/test.jpg', exifPath: 'test_exif.json' };

    render(
        <WindowManagerProvider>
            <PhotoViewer src="test.jpg" fileItem={fileItem} />
        </WindowManagerProvider>
    );

    expect(screen.getByRole('img')).toHaveAttribute('src', 'test.jpg');
    // Check for Properties button (contains info icon or text)
    expect(screen.getByText('属性')).toBeInTheDocument();
});

test('Clicking properties button opens FileProperties window', () => {
    const fileItem = { name: 'test.jpg', path: 'C:/test.jpg', exifPath: 'test_exif.json' };

    render(
        <WindowManagerProvider>
            <PhotoViewer src="test.jpg" fileItem={fileItem} />
        </WindowManagerProvider>
    );

    const btn = screen.getByText('属性');
    fireEvent.click(btn);

    expect(mockOpenWindow).toHaveBeenCalledWith(
        expect.stringMatching(/^properties-test.jpg/),
        'test.jpg 属性',
        expect.anything(), // component
        'properties',
        expect.objectContaining({ width: 350 })
    );
});

test('FileProperties renders general info correctly', () => {
    const fileItem = { name: 'test.jpg', path: 'C:/test.jpg', exifPath: 'test_exif.json' };

    render(
        <WindowManagerProvider>
            <FileProperties fileItem={fileItem} />
        </WindowManagerProvider>
    );

    expect(screen.getByText('test.jpg')).toBeInTheDocument();
    expect(screen.getByText('常规')).toBeInTheDocument();
    expect(screen.getByText('JPEG 图像')).toBeInTheDocument();
});

test('FileProperties switches tabs', async () => {
    const fileItem = { name: 'test.jpg', path: 'C:/test.jpg' };

    render(
        <WindowManagerProvider>
            <FileProperties fileItem={fileItem} />
        </WindowManagerProvider>
    );

    fireEvent.click(screen.getByText('摘要'));
    expect(screen.getByText('图像')).toBeInTheDocument(); // Section header in Summary
});
