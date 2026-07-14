import 'fake-indexeddb/auto';
import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppRegistryProvider, useAppRegistry } from '../src/context/AppRegistryContext';
import { CultureProvider, useCulture } from '../src/context/CultureContext';
import { XPEventBus, createXPEventBus } from '../src/events';
import { EventBusProvider } from '../src/context/EventBusContext';
import {
  WindowManagerProvider,
  useWindowManagerActions,
} from '../src/context/WindowManagerContext';
import { FileSystemProvider } from '../src/context/FileSystemContext';
import { UserSessionProvider } from '../src/context/UserSessionContext';
import { ModalProvider } from '../src/context/ModalContext';
import { TrayProvider } from '../src/context/TrayContext';
import { WindowIdProvider } from '../src/context/WindowIdContext';
import { useApp } from '../src/hooks/useApp';
import type { AppRegistryEntry } from '../src/types';
import type { CulturePackage } from '../src/data/culture';

const appEntry = (id: string): AppRegistryEntry => ({
  id,
  name: id,
  icon: 'app_window',
  restore: () => null,
});

describe('prop reactivity & composability (#122)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('apps prop is reactive after mount and preserves runtime registrations', () => {
    let ctx: ReturnType<typeof useAppRegistry> | null = null;
    const Probe: React.FC = () => {
      ctx = useAppRegistry();
      return null;
    };

    const { rerender } = render(
      <AppRegistryProvider apps={[appEntry('AppA')]}>
        <Probe />
      </AppRegistryProvider>
    );
    expect(ctx!.registry.AppA).toBeDefined();
    expect(ctx!.registry.AppB).toBeUndefined();

    // Runtime registration should survive the next prop-driven re-merge.
    act(() => ctx!.registerApp(appEntry('RuntimeApp')));
    expect(ctx!.registry.RuntimeApp).toBeDefined();

    // Add AppB via the prop after mount → it registers.
    rerender(
      <AppRegistryProvider apps={[appEntry('AppA'), appEntry('AppB')]}>
        <Probe />
      </AppRegistryProvider>
    );
    expect(ctx!.registry.AppB).toBeDefined();
    expect(ctx!.registry.RuntimeApp).toBeDefined(); // preserved
    expect(ctx!.registry.Calculator).toBeDefined(); // built-ins intact
  });

  it('cultures prop is reactive after mount', () => {
    const jp = (): CulturePackage =>
      ({ id: 'jp', displayName: '日本', locales: ['ja'] }) as unknown as CulturePackage;

    let ctx: ReturnType<typeof useCulture> | null = null;
    const Probe: React.FC = () => {
      ctx = useCulture();
      return null;
    };

    const { rerender } = render(
      <CultureProvider cultures={[]}>
        <Probe />
      </CultureProvider>
    );
    expect(ctx!.cultures.some(c => c.id === 'jp')).toBe(false);

    rerender(
      <CultureProvider cultures={[jp()]}>
        <Probe />
      </CultureProvider>
    );
    expect(ctx!.cultures.some(c => c.id === 'jp')).toBe(true);
    // Built-ins preserved.
    expect(ctx!.cultures.some(c => c.id === 'en')).toBe(true);
  });

  it('a custom app can write a file using only useApp().fs', () => {
    let api: ReturnType<typeof useApp> | null = null;
    const Probe: React.FC = () => {
      api = useApp('w1');
      return null;
    };

    render(
      <UserSessionProvider>
        <FileSystemProvider>
          <ModalProvider>
            <WindowManagerProvider>
              <TrayProvider>
                <WindowIdProvider windowId="w1">
                  <Probe />
                </WindowIdProvider>
              </TrayProvider>
            </WindowManagerProvider>
          </ModalProvider>
        </FileSystemProvider>
      </UserSessionProvider>
    );

    act(() => {
      api!.fs.createFile(['note.txt'], { type: 'file', content: 'from app', app: 'Notepad' });
    });
    expect(api!.fs.readFile(['note.txt'])).toMatchObject({ name: 'note.txt' });

    act(() => {
      api!.fs.writeFile(['note.txt'], 'edited');
    });
    expect((api!.fs.readFile(['note.txt']) as { content?: string })?.content).toBe('edited');

    act(() => {
      api!.fs.deleteFile(['note.txt']);
    });
    expect(api!.fs.readFile(['note.txt'])).toBeNull();
  });

  it('bare providers observe the same bus via createXPEventBus + EventBusProvider', () => {
    const bus = createXPEventBus();
    expect(bus).toBeInstanceOf(XPEventBus);
    const seen: string[] = [];
    bus.subscribe(e => seen.push(e.type));

    let actions: ReturnType<typeof useWindowManagerActions> | null = null;
    const Probe: React.FC = () => {
      actions = useWindowManagerActions();
      return null;
    };
    render(
      <EventBusProvider bus={bus}>
        <WindowManagerProvider>
          <Probe />
        </WindowManagerProvider>
      </EventBusProvider>
    );

    act(() => {
      actions!.openWindow('Calculator', 'Calc', <div />, 'calculator');
    });
    expect(seen).toContain('app:launch');
  });
});
