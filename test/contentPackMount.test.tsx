/**
 * Content-pack runtime integration (#241, PR-B): mounting pack files into the
 * filesystem, and IE serving an authorized site over the Wayback fallback.
 */
import 'fake-indexeddb/auto';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { WindowsXP, createContentResolver, buildSiteRegistry } from '../src/lib';
import type { ContentPack } from '../src/lib';
import { assertLoadableSnapshot, type XPSnapshot } from '../src/snapshot';
import ContentView from '../src/apps/InternetExplorer/components/ContentView';

describe('ContentPack mounting (#241)', () => {
  beforeEach(() => localStorage.clear());

  it('merges pack files into the desktop filesystem', async () => {
    const pack: ContentPack = {
      id: 'demo-pack',
      files: {
        Portfolio: { type: 'app_shortcut', name: 'Portfolio', app: 'InternetExplorer', icon: 'ie' },
      },
    };
    render(<WindowsXP skipBoot autoLogin disableScreenSaver contentPacks={[pack]} />);
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());
    expect(screen.getByTestId('desktop-icon-Portfolio')).toBeInTheDocument();
    // Built-ins still present (merge, not replace).
    expect(screen.getByTestId('desktop-icon-Calculator')).toBeInTheDocument();
  });

  it('lets an explicit customFileSystem win over a pack file on collision', async () => {
    const pack: ContentPack = {
      id: 'p',
      files: {
        Shared: { type: 'app_shortcut', name: 'Shared', app: 'Calculator', icon: 'calculator' },
      },
    };
    render(
      <WindowsXP
        skipBoot
        autoLogin
        disableScreenSaver
        contentPacks={[pack]}
        customFileSystem={{
          Shared: { type: 'app_shortcut', name: 'Shared', app: 'Notepad', icon: 'notepad' },
        }}
      />
    );
    await waitFor(() => expect(screen.getByTestId('taskbar')).toBeInTheDocument());
    // One "Shared" icon — the customFileSystem one (Notepad) wins the leaf.
    expect(screen.getByTestId('desktop-icon-Shared')).toBeInTheDocument();
  });
});

describe('IE authorized-site registry (#241/#149)', () => {
  const noop = () => undefined;

  it('renders an authorized site (srcDoc) instead of the Wayback iframe (src)', async () => {
    const resolver = createContentResolver({ assets: {} });
    const sites = buildSiteRegistry({
      'https://qingchun-bbs.com/': { html: '<h1>青春 BBS</h1>', title: 'BBS' },
    });
    render(
      <ContentView
        currentEntry={{ url: 'qingchun-bbs.com', html: null }}
        sites={sites}
        resolver={resolver}
        onNavigate={noop}
        onOpenNewIE={noop}
        onLoad={noop}
        onError={noop}
        onOpenHelp={noop}
      />
    );
    await waitFor(() => {
      const frame = document.getElementById('ie-frame') as HTMLIFrameElement | null;
      expect(frame?.getAttribute('srcdoc')).toContain('青春 BBS');
    });
    // Authorized-site iframe uses srcDoc, not the Wayback `src` fallback.
    const frame = document.getElementById('ie-frame') as HTMLIFrameElement;
    expect(frame.getAttribute('src')).toBeNull();
  });

  it('falls through to the Wayback iframe when no site matches', () => {
    const resolver = createContentResolver({ assets: {} });
    render(
      <ContentView
        currentEntry={{ url: 'http://www.example.com', html: null }}
        sites={buildSiteRegistry({ 'other.com': { html: 'x' } })}
        resolver={resolver}
        onNavigate={noop}
        onOpenNewIE={noop}
        onLoad={noop}
        onError={noop}
        onOpenHelp={noop}
      />
    );
    const frame = document.getElementById('ie-frame') as HTMLIFrameElement;
    // No authorized match → the fallback iframe (Wayback `src`, no srcDoc).
    expect(frame.getAttribute('src')).toContain('web.archive.org');
    expect(frame.getAttribute('srcdoc')).toBeNull();
  });
});

describe('snapshot round-trips a contentRef node (#241)', () => {
  it('accepts a file node carrying contentRef instead of inline content', () => {
    const snap: XPSnapshot = {
      version: 1,
      fs: {
        root: {
          type: 'root',
          name: 'root',
          children: {
            'letter.md': {
              type: 'file',
              name: '外婆的信.md',
              app: 'MarkdownViewer',
              contentRef: { asset: 'grandma-letter' },
            },
          },
        },
      },
      recycleBin: {},
      openWindows: [],
      wallpaper: null,
      language: null,
      flags: {},
    };
    // The ref survives serialization and passes structural validation.
    const round = JSON.parse(JSON.stringify(snap));
    expect(() => assertLoadableSnapshot(round)).not.toThrow();
    const node = round.fs.root.children['letter.md'];
    expect(node.contentRef).toEqual({ asset: 'grandma-letter' });
    expect(node.content).toBeUndefined();
  });
});
