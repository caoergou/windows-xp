import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { WindowManagerProvider } from '../src/context/WindowManagerContext';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';
import { ModalProvider } from '../src/context/ModalContext';
import { TrayProvider } from '../src/context/TrayContext';

export interface ProviderOptions {
  /** Wrap with UserSessionProvider (default: true) */
  userSession?: boolean;
  /** Wrap with FileSystemProvider (default: true) */
  fileSystem?: boolean;
  /** Wrap with WindowManagerProvider (default: true) */
  windowManager?: boolean;
  /** Wrap with TrayProvider (default: true) */
  tray?: boolean;
  /** Wrap with ModalProvider (default: true) */
  modal?: boolean;
  /** Props passed to UserSessionProvider */
  userSessionProps?: React.ComponentProps<typeof UserSessionProvider>;
  /** Value override passed to WindowManagerProvider */
  windowManagerValue?: React.ComponentProps<typeof WindowManagerProvider>['value'];
  /** Custom file system passed to FileSystemProvider */
  customFileSystem?: React.ComponentProps<typeof FileSystemProvider>['customFileSystem'];
}

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providers?: ProviderOptions;
}

const defaultProviderOptions: ProviderOptions = {
  userSession: true,
  fileSystem: true,
  windowManager: true,
  tray: true,
  modal: true,
};

function AllProviders({
  children,
  options = defaultProviderOptions,
}: {
  children: React.ReactNode;
  options?: ProviderOptions;
}) {
  const opts = { ...defaultProviderOptions, ...options };

  let content = children;

  if (opts.modal) {
    content = <ModalProvider>{content}</ModalProvider>;
  }

  if (opts.tray) {
    content = <TrayProvider>{content}</TrayProvider>;
  }

  if (opts.windowManager) {
    content = (
      <WindowManagerProvider value={opts.windowManagerValue}>{content}</WindowManagerProvider>
    );
  }

  if (opts.fileSystem) {
    content = (
      <FileSystemProvider customFileSystem={opts.customFileSystem}>{content}</FileSystemProvider>
    );
  }

  if (opts.userSession) {
    content = <UserSessionProvider {...opts.userSessionProps}>{content}</UserSessionProvider>;
  }

  return content;
}

/**
 * Renders the given UI wrapped with the standard provider tree.
 *
 * The wrapping order matches AppProviders:
 * UserSessionProvider -> FileSystemProvider -> WindowManagerProvider
 * -> TrayProvider -> ModalProvider -> UI
 *
 * Use `options.providers` to enable/disable individual providers or pass
 * provider-specific options.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof render> {
  const { providers, ...renderOptions } = options;

  return render(ui, {
    ...renderOptions,
    wrapper: ({ children }) => <AllProviders options={providers}>{children}</AllProviders>,
  });
}
