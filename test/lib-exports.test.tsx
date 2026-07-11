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
// Type-only imports (#79): this file is included in `tsc --noEmit`, so if any
// public type is dropped from the entry point this test file fails to compile.
import type {
  CulturePackage,
  CulturalItem,
  DesktopShortcut,
  StickyNoteContent,
  StartMenuApp,
  StartMenuProfile,
  BrowserCultureProfile,
  CultureKey,
  WallpaperItem,
  ModalContextType,
  TrayItem,
  TrayContextType,
  JsonValue,
  ExifData,
  AppRegistryEntry,
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

  it('re-exports culture / wallpaper / modal / tray / util types (compile-time guard, #79)', () => {
    // Constructing values with the imported types keeps the imports live and
    // proves they are usable without hand-copying. A dropped export fails tsc.
    const shortcut: DesktopShortcut = { id: 's', name: 'X', app: 'Calculator', icon: 'calculator' };
    const note: StickyNoteContent = { id: 'n', title: 'T', content: 'C' };
    const app: StartMenuApp = { id: 'a', action: 'open', nameKey: 'k', icon: 'i' };
    const menu: StartMenuProfile = { pinned: [app], recent: [] };
    const browser: BrowserCultureProfile = { homepage: 'about:blank' };
    const item: CulturalItem = { id: 'c' };
    const key: CultureKey = 'zh';
    const pkg: CulturePackage = {
      id: 'demo',
      displayName: 'Demo',
      locales: ['zh'],
      desktopShortcuts: [shortcut],
      stickyNote: note,
      startMenu: menu,
      browser,
    };
    const json: JsonValue = { nested: [1, 'two', true, null] };
    const wallpaper = { id: 'w', name: 'W', url: 'u' } as WallpaperItem;
    const exif = {} as ExifData;
    const tray = {} as TrayItem;
    const trayCtx = {} as TrayContextType;
    const modalCtx = {} as ModalContextType;
    const entry = {} as AppRegistryEntry;

    expect(pkg.desktopShortcuts?.[0].app).toBe('Calculator');
    expect(menu.pinned[0].action).toBe('open');
    expect(browser.homepage).toBe('about:blank');
    expect(item.id).toBe('c');
    expect(key).toBe('zh');
    expect(json).toBeDefined();
    expect([wallpaper, exif, tray, trayCtx, modalCtx, entry].length).toBe(6);
  });
});
