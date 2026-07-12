import React, { useEffect, useRef } from 'react';
import { WindowsXP } from '../lib/index';
import type { XPHandle } from '../components/XPBridge';
import type { AppRegistryEntry, FileNode } from '../types';
import GreeterNotepad from './GreeterNotepad';

/**
 * Act 1 (#160): a real, running desktop embedded on the landing page. It
 * lazy-loads below a static poster, then drives *itself* — opening a Notepad
 * that types a message via the public `XPHandle` — to prove the page is the
 * product, not a screenshot. One live instance only (§7.3).
 */

const HERO_PREFIX = 'site_hero_';

// Per-visit freshness (§7.2): drop this instance's persisted window list so the
// self-typing greeter always replays. (Collapses to persistence="session" once
// #138 lands.) IndexedDB file content is reseeded from HERO_FS at mount.
if (typeof window !== 'undefined') {
  try {
    Object.keys(window.localStorage)
      .filter(k => k.startsWith(HERO_PREFIX))
      .forEach(k => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

const HERO_FS: Record<string, FileNode> = {
  'Read Me.txt': {
    type: 'file',
    name: 'Read Me.txt',
    app: 'Notepad',
    content:
      'This desktop is a real embed of @caoergou/windows-xp.\r\n\r\n' +
      'Drag windows, open the Start menu, double-click icons — it all works, ' +
      'because this IS the engine, not a picture of it.\r\n\r\n' +
      'Scroll down to see the same engine wearing three different worlds.',
  },
};

interface HeroDesktopProps {
  greeterTitle: string;
  greeterBody: string;
  reduced: boolean;
}

const HeroDesktop: React.FC<HeroDesktopProps> = ({ greeterTitle, greeterBody, reduced }) => {
  const xp = useRef<XPHandle>(null);

  const apps: AppRegistryEntry[] = React.useMemo(
    () => [
      {
        id: 'GreeterNotepad',
        name: greeterTitle,
        icon: 'file',
        window: { width: 430, height: 300, left: 150, top: 90, singleton: true },
        lifecycle: {},
        restore: (props: unknown) => (
          <GreeterNotepad {...(props as { body?: string; reduced?: boolean })} />
        ),
      },
    ],
    [greeterTitle]
  );

  // Once the desktop is up, script it: open the greeter that types itself.
  useEffect(() => {
    const id = window.setTimeout(() => {
      xp.current?.openApp('GreeterNotepad', { body: greeterBody, reduced });
    }, 900);
    return () => window.clearTimeout(id);
  }, [greeterBody, reduced]);

  return (
    <WindowsXP
      ref={xp}
      mode="embedded"
      skipBoot
      autoLogin
      storagePrefix={HERO_PREFIX}
      fileSystemMode="replace"
      customFileSystem={HERO_FS}
      apps={apps}
      disableScreenSaver
    />
  );
};

export default HeroDesktop;
