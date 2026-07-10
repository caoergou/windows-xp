import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import PhotoViewer from '../src/apps/PhotoViewer';
import FileProperties from '../src/components/FileProperties';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { ModalProvider } from '../src/context/ModalContext';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';
import { TrayProvider } from '../src/context/TrayContext';

test('PhotoViewer renders image and properties button when fileItem provided', () => {
  const fileItem = { name: 'test.jpg', path: 'C:/test.jpg', exifPath: 'test_exif.json' };

  render(
    <UserSessionProvider>
      <FileSystemProvider>
        <ModalProvider>
          <WindowManagerProvider>
            <TrayProvider>
              <PhotoViewer src="test.jpg" fileItem={fileItem} />
            </TrayProvider>
          </WindowManagerProvider>
        </ModalProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  );

  expect(screen.getByRole('img')).toHaveAttribute('src', 'test.jpg');
  // Check for Properties button (contains info icon or text)
  expect(screen.getByText('Properties')).toBeInTheDocument();
});

test('FileProperties renders general info correctly', () => {
  // 直接测试 FileProperties 组件，提供必要的属性
  const fileItem = {
    name: 'test.jpg',
    type: 'file',
    path: 'C:/test.jpg',
    exifPath: 'test_exif.json',
  };

  render(
    <UserSessionProvider>
      <FileSystemProvider>
        <ModalProvider>
          <WindowManagerProvider>
            <TrayProvider>
              <FileProperties fileItem={fileItem} parentPath={[]} />
            </TrayProvider>
          </WindowManagerProvider>
        </ModalProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  );

  // 检查是否有常规标签
  expect(screen.getByText('General')).toBeInTheDocument();

  // 检查是否有摘要标签
  expect(screen.getByText('Summary')).toBeInTheDocument();
});

test('FileProperties switches tabs', async () => {
  const fileItem = { name: 'test.jpg', path: 'C:/test.jpg' };

  render(
    <UserSessionProvider>
      <FileSystemProvider>
        <ModalProvider>
          <WindowManagerProvider>
            <TrayProvider>
              <FileProperties fileItem={fileItem} />
            </TrayProvider>
          </WindowManagerProvider>
        </ModalProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  );

  fireEvent.click(screen.getByText('Summary'));
  expect(screen.getByText('Image')).toBeInTheDocument(); // Section header in Summary
});
