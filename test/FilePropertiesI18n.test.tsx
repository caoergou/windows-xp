import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import FileProperties from '../src/components/FileProperties';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { ModalProvider } from '../src/context/ModalContext';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';
import { TrayProvider } from '../src/context/TrayContext';

/**
 * #121: getFileProperties used to return hardcoded Chinese ("0 字节",
 * "2003年10月25日") that leaked into the FileProperties surface even under
 * 'language="en"'. It now returns raw values that the UI localizes, so no
 * Chinese should appear in the English locale.
 */
const renderProps = () =>
  render(
    <UserSessionProvider>
      <FileSystemProvider>
        <ModalProvider>
          <WindowManagerProvider>
            <TrayProvider>
              {/* "Notepad" is an app shortcut on the default desktop root. */}
              <FileProperties fileItem={{ name: 'Notepad', type: 'file' }} parentPath={[]} />
            </TrayProvider>
          </WindowManagerProvider>
        </ModalProvider>
      </FileSystemProvider>
    </UserSessionProvider>
  );

test('FileProperties shows localized size/date and no hardcoded Chinese under en', () => {
  const { container } = renderProps();

  // Localized, English-locale surface.
  expect(screen.getByText('General')).toBeInTheDocument();
  // Byte size rendered via i18n ("0 bytes"), not the old "0 字节".
  expect(screen.getByText('0 bytes')).toBeInTheDocument();

  // No hardcoded Chinese strings leak into the English locale.
  const text = container.textContent ?? '';
  expect(text).not.toContain('字节');
  expect(text).not.toContain('个对象');
  expect(text).not.toContain('2003年10月25日');
  // The XP-era date is still present, formatted for the active locale.
  expect(text).toContain('2003');
});
