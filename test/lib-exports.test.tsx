import { describe, it, expect } from 'vitest';
import {
  WindowsXP,
  AppProviders,
  FileSystemProvider,
  WindowManagerProvider,
  UserSessionProvider,
  ModalProvider,
  TrayProvider,
  useFileSystem,
  useWindowManager,
  useUserSession,
  useModal,
  useTray,
  useApp,
} from '../src/lib';

describe('Library public API', () => {
  it('exports WindowsXP component', () => {
    expect(WindowsXP).toBeDefined();
    // forwardRef components are exotic objects, not plain functions (#76).
    expect(['function', 'object']).toContain(typeof WindowsXP);
  });

  it('exports providers', () => {
    expect(AppProviders).toBeDefined();
    expect(FileSystemProvider).toBeDefined();
    expect(WindowManagerProvider).toBeDefined();
    expect(UserSessionProvider).toBeDefined();
    expect(ModalProvider).toBeDefined();
    expect(TrayProvider).toBeDefined();
  });

  it('exports hooks', () => {
    expect(useFileSystem).toBeDefined();
    expect(useWindowManager).toBeDefined();
    expect(useUserSession).toBeDefined();
    expect(useModal).toBeDefined();
    expect(useTray).toBeDefined();
    expect(useApp).toBeDefined();
  });
});
