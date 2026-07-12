/**
 * Culture authoring DX tests (#129).
 *
 * Covers the locales-normalization fix (a 'ja' package's item-level
 * `locales: ['ja']` now filter as written), defineCulture() validation
 * warnings, and an end-to-end render of a third-language package.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filterByLocale, localeMatchesItem, defineCulture } from '../src/data/culture';
import type { DesktopShortcut } from '../src/data/culture';
import { WindowsXP } from '../src/lib';

describe('locale filtering (#129)', () => {
  it('localeMatchesItem is base-aware and case-insensitive', () => {
    expect(localeMatchesItem(['ja'], 'ja')).toBe(true);
    expect(localeMatchesItem(['ja'], 'ja-JP')).toBe(true);
    expect(localeMatchesItem(['en'], 'en-US')).toBe(true);
    expect(localeMatchesItem(['zh'], 'zh-CN')).toBe(true);
    expect(localeMatchesItem(['ja'], 'en')).toBe(false);
    expect(localeMatchesItem(['en'], 'ja')).toBe(false);
  });

  it("a 'ja' item filters for ja and is hidden for en (the fixed trap)", () => {
    const items: DesktopShortcut[] = [
      { id: 'nico', name: 'ニコニコ', app: 'InternetExplorer', icon: 'ie', locales: ['ja'] },
      { id: 'winamp', name: 'Winamp', app: 'InternetExplorer', icon: 'ie', locales: ['en'] },
      { id: 'shared', name: 'Shared', app: 'InternetExplorer', icon: 'ie' },
    ];
    expect(filterByLocale(items, 'ja').map(i => i.id)).toEqual(['nico', 'shared']);
    expect(filterByLocale(items, 'en').map(i => i.id)).toEqual(['winamp', 'shared']);
    expect(filterByLocale(items, 'zh-CN').map(i => i.id)).toEqual(['shared']);
  });
});

describe('defineCulture validation (#129)', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('warns on empty app, duplicate id, and item locales that miss the package', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    defineCulture({
      id: 'jp-retro',
      displayName: '日本 2000s',
      locales: ['ja', 'ja-JP'],
      desktopShortcuts: [
        { id: 'a', name: 'A', app: '', icon: 'ie' },
        { id: 'a', name: 'A2', app: 'InternetExplorer', icon: 'ie' },
        { id: 'wrong', name: 'W', app: 'InternetExplorer', icon: 'ie', locales: ['en'] },
      ],
    });
    const msgs = warn.mock.calls.map(c => String(c[0]));
    expect(msgs.some(m => /empty `app`/.test(m))).toBe(true);
    expect(msgs.some(m => /duplicate item id "a"/.test(m))).toBe(true);
    expect(msgs.some(m => /don't match the package locales/.test(m))).toBe(true);
    warn.mockRestore();
  });

  it('warns on a start-menu nameKey missing from the package i18n', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    defineCulture({
      id: 'jp-retro',
      displayName: '日本 2000s',
      locales: ['ja'],
      i18n: { ja: { 'apps.notepad': 'メモ帳' } },
      startMenu: {
        pinned: [{ id: 'np', action: 'Notepad', nameKey: 'apps.doesNotExist', icon: 'file' }],
        recent: [],
      },
    });
    expect(warn.mock.calls.map(c => String(c[0])).some(m => /nameKey "apps.doesNotExist"/.test(m))).toBe(true);
    warn.mockRestore();
  });
});

describe('third-language culture renders (#129)', () => {
  beforeEach(() => localStorage.clear());

  it("a 'ja' package shows only its ja-scoped shortcut on the desktop", async () => {
    const jpRetro = defineCulture({
      id: 'jp-retro',
      displayName: '日本 2000s',
      locales: ['ja', 'ja-JP'],
      desktopShortcuts: [
        { id: 'nico', name: 'ニコニコ動画', app: 'InternetExplorer', icon: 'ie', locales: ['ja'] },
        { id: 'winamp', name: 'Winamp', app: 'InternetExplorer', icon: 'ie', locales: ['en'] },
      ],
      i18n: { ja: { 'apps.notepad': 'メモ帳' } },
    });
    render(<WindowsXP language="ja" cultures={[jpRetro]} skipBoot autoLogin disableScreenSaver />);
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());
    expect(screen.getByTestId('desktop-icon-ニコニコ動画')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-icon-Winamp')).toBeNull();
  });
});
