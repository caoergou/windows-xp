import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppProviders from '../src/components/AppProviders';
import { defineApp } from '../src/registry/defineApp';
import { defineOS } from '../src/os/defineOS';
import { resolveAppRole } from '../src/os/appRoles';
import { paperOS } from '../src/themes/paper';
import { Keymap } from '../src/utils/keymap';
import { APP_REGISTRY, resolveFileOpen } from '../src/registry/apps';
import { mountThemeCss } from '../src/themes/mountThemeCss';
import XPDataMenuBar from '../src/themes/xp/chrome/MenuBar';
import { xpTheme } from '../src/themes/xp';

afterEach(() => {
  localStorage.clear();
  document.head.querySelectorAll('[data-os-theme-css]').forEach(node => node.remove());
});

describe('OS package contract (#213)', () => {
  it('renders a non-XP package through chrome slots without mounting XP skin CSS', async () => {
    render(<AppProviders os={paperOS} skipBoot autoLogin persistence="none" />);

    await waitFor(() => expect(screen.getByLabelText('Paper OS')).toBeInTheDocument());
    expect(document.querySelector('[data-testid="taskbar"]')).not.toBeInTheDocument();
    expect(document.head.querySelector('[data-os-theme-css="xp"]')).not.toBeInTheDocument();
  });

  it('keeps BehaviorProfile closed and uses the OS primary modifier for Mod bindings', () => {
    const os = defineOS({
      ...paperOS,
      id: 'paper-test',
      theme: { ...paperOS.theme, id: 'paper-test' },
    });
    const keymap = new Keymap({ primaryModifier: os.behavior.primaryModifier });
    const handler = vi.fn();
    keymap.register({ id: 'test.mod', combo: 'Mod+K', scope: 'global' }, handler);

    const event = {
      key: 'k',
      ctrlKey: false,
      metaKey: true,
      altKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    expect(keymap.dispatch(event, { inInput: false })).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('mounts authored theme ids as attribute data, not selector syntax', () => {
    const cleanup = mountThemeCss({ ...paperOS.theme, id: 'paper"]#unsafe', css: 'body{}' });
    expect(
      Array.from(document.head.querySelectorAll('[data-os-theme-css]')).some(
        node => node.getAttribute('data-os-theme-css') === 'paper"]#unsafe'
      )
    ).toBe(true);
    cleanup();
  });

  it('preserves declarative menus and roles on defineApp and resolves role references', () => {
    const app = defineApp({
      id: 'PaperEditor',
      name: 'Paper Editor',
      role: 'editor',
      menus: [{ id: 'file', label: 'File', items: [{ id: 'file.save', label: 'Save' }] }],
      component: () => <div />,
    });

    expect(app.role).toBe('editor');
    expect(app.menus?.[0]?.items[0]?.id).toBe('file.save');
    expect(resolveAppRole('role:editor', { editor: app.id })).toBe('PaperEditor');
    const resolved = resolveFileOpen(
      'note.txt',
      { type: 'file', name: 'note.txt', app: 'role:editor' },
      { editor: app.id },
      {
        [app.id]: {
          ...app,
          associations: [{ appField: app.id, getProps: () => ({}) }],
        },
      }
    );
    expect(resolved?.appId).toBe(app.id);
  });

  it('preserves an Explorer file identity when resolving Notepad', () => {
    const resolved = resolveFileOpen(
      'readme.txt',
      { type: 'file', name: 'readme.txt', app: 'Notepad', content: 'hello' },
      undefined,
      APP_REGISTRY,
      ['我的电脑', '本地磁盘 (C:)', 'readme.txt']
    );

    expect(resolved?.appId).toBe('Notepad');
    expect(resolved?.windowProps.componentProps).toMatchObject({
      fileName: 'readme.txt',
      filePath: ['我的电脑', '本地磁盘 (C:)'],
      content: 'hello',
    });
  });

  it('keeps a Notepad application shortcut untitled', () => {
    const resolved = resolveFileOpen(
      'Notepad',
      { type: 'app_shortcut', name: 'Notepad', app: 'Notepad' },
      undefined,
      APP_REGISTRY,
      ['Notepad']
    );

    expect(resolved?.windowProps.componentProps).toMatchObject({ content: '' });
    expect(resolved?.windowProps.componentProps).not.toHaveProperty('fileName');
    expect(resolved?.windowProps.componentProps).not.toHaveProperty('filePath');
  });

  it('lets the OS menu renderer choose a command instead of executing the first item', () => {
    const onCommand = vi.fn();
    render(
      <ThemeProvider theme={xpTheme}>
        <XPDataMenuBar
          menus={[
            {
              id: 'file',
              label: 'File',
              items: [
                { id: 'file.open', label: 'Open' },
                { id: 'file.save', label: 'Save', shortcut: 'Mod+S' },
              ],
            },
          ]}
          onCommand={onCommand}
        />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'File' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Save/ }));
    expect(onCommand).toHaveBeenCalledWith('file.save');
  });
});
