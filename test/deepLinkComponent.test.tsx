/**
 * Deep-linking end-to-end through <WindowsXP/> (#136): `openOnLoad` opens
 * windows, `getShareUrl` round-trips, external-link nodes and `openExternal`
 * fire `link:external`.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WindowsXP } from '../src/lib';
import type { XPHandle } from '../src/lib';
import type { XPEvent } from '../src/lib';
import type { FileNode } from '../src/lib';

const customFileSystem: Record<string, FileNode> = {
  'hello.txt': { type: 'file', name: 'hello.txt', app: 'Notepad', content: 'hi from a deep link' },
  Anthropic: {
    type: 'external_link',
    name: 'Anthropic',
    href: 'https://example.com/tickets',
    icon: 'ie',
  },
};

describe('deep linking through <WindowsXP/> (#136)', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  });
  afterEach(() => {
    localStorage.clear();
    openSpy.mockRestore();
  });

  it('openOnLoad opens the addressed file window, and getShareUrl round-trips it', async () => {
    const ref = React.createRef<XPHandle>();
    render(
      <WindowsXP
        ref={ref}
        skipBoot
        autoLogin
        disableScreenSaver
        customFileSystem={customFileSystem}
        openOnLoad="hello.txt"
      />
    );

    // The Notepad window opened with the file's content.
    await waitFor(() =>
      expect(screen.getByDisplayValue('hi from a deep link')).toBeInTheDocument()
    );

    const notepad = ref.current!.windows.list().find(w => w.appId === 'Notepad');
    expect(notepad).toBeTruthy();

    const url = ref.current!.getShareUrl(notepad!.id);
    expect(url).toContain('open=hello.txt');
  });

  it('opening an external_link node via a deep link fires link:external and leaves via the URL', async () => {
    const events: XPEvent[] = [];
    render(
      <WindowsXP
        skipBoot
        autoLogin
        disableScreenSaver
        customFileSystem={customFileSystem}
        openOnLoad="Anthropic"
        onEvent={e => events.push(e)}
      />
    );

    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());

    await waitFor(() => {
      const ext = events.find(e => e.type === 'link:external');
      expect(ext).toMatchObject({
        type: 'link:external',
        url: 'https://example.com/tickets',
        source: 'Anthropic',
      });
    });
    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/tickets',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('double-clicking an external-link desktop icon fires link:external (no window opens)', async () => {
    const events: XPEvent[] = [];
    render(
      <WindowsXP
        skipBoot
        autoLogin
        disableScreenSaver
        customFileSystem={customFileSystem}
        onEvent={e => events.push(e)}
      />
    );

    const icon = await screen.findByTestId('desktop-icon-Anthropic');
    fireEvent.doubleClick(icon);

    await waitFor(() => expect(events.some(e => e.type === 'link:external')).toBe(true));
    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/tickets',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('handle.openExternal navigates and emits link:external', async () => {
    const events: XPEvent[] = [];
    const ref = React.createRef<XPHandle>();
    render(
      <WindowsXP ref={ref} skipBoot autoLogin disableScreenSaver onEvent={e => events.push(e)} />
    );
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());

    ref.current!.openExternal('https://example.com/buy');

    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/buy',
      '_blank',
      'noopener,noreferrer'
    );
    const ext = events.find(e => e.type === 'link:external');
    expect(ext).toMatchObject({
      type: 'link:external',
      url: 'https://example.com/buy',
      newTab: true,
    });
  });
});
