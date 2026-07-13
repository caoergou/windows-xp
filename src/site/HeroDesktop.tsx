import React, { useEffect, useRef, useState } from 'react';
import { WindowsXP } from '../lib/index';
import type { XPHandle } from '../components/XPBridge';
import type { FileNode } from '../types';

/**
 * The hero desktop (#160 Act 1, reshaped by #250): a real, running desktop
 * embedded on the landing page. It lazy-loads below a static poster, then
 * drives *itself* — opening the REAL Notepad in auto-type mode via the public
 * `XPHandle` — to prove the page is the product, not a screenshot. After the
 * typing finishes it's an ordinary Notepad: menus, editing, save-to-FS.
 */

const HERO_PREFIX = 'site_hero_';

// Per-visit freshness (§7.2): drop this instance's persisted window list so
// the self-typing greeter always replays — including on a language-toggle
// remount. (Collapses to persistence="session" once #138 lands.)
const clearHeroStorage = () => {
  try {
    Object.keys(window.localStorage)
      .filter(k => k.startsWith(HERO_PREFIX))
      .forEach(k => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  return true;
};

// The desktop IS the content strategy (#250 §2.2): the zh/en worlds are
// shortcuts on the desktop instead of marketing cards on the page, and the
// pitch lives in an in-fiction readme instead of hero paragraphs.
const HERO_FS: Record<string, FileNode> = {
  'Read Me.txt': {
    type: 'file',
    name: 'Read Me.txt',
    app: 'Notepad',
    content:
      'This desktop is a real embed of @caoergou/windows-xp.\r\n\r\n' +
      'Drag windows, open the Start menu, double-click icons — it all works, ' +
      'because this IS the engine, not a picture of it.\r\n\r\n' +
      'Double-click a shortcut on the desktop to step into the full thing — ' +
      'the millennium Chinese internet (QQ, 360, Thunder) or the Western one ' +
      '(Winamp, Norton, MSN).',
  },
  '中文桌面': {
    type: 'external_link',
    name: '中文桌面',
    href: 'demo/zh/',
    newTab: false,
  },
  'English Desktop': {
    type: 'external_link',
    name: 'English Desktop',
    href: 'demo/en/',
    newTab: false,
  },
};

interface HeroDesktopProps {
  greeterFileName: string;
  greeterBody: string;
  language: string;
}

const HeroDesktop: React.FC<HeroDesktopProps> = ({ greeterFileName, greeterBody, language }) => {
  const xp = useRef<XPHandle>(null);
  // Synchronous, per-mount: must run before <WindowsXP> reads persisted state.
  useState(clearHeroStorage);

  // Once the desktop is up, script it over the public handle: the stock
  // Notepad, in auto-type mode. Same API any host gets — no private hooks.
  useEffect(() => {
    const id = window.setTimeout(() => {
      xp.current?.openApp('Notepad', {
        fileName: greeterFileName,
        autoTypeText: greeterBody,
        autoTypeSpeed: 42,
      });
    }, 900);
    return () => window.clearTimeout(id);
  }, [greeterFileName, greeterBody]);

  return (
    <WindowsXP
      ref={xp}
      mode="embedded"
      viewportPolicy="scale"
      skipBoot
      autoLogin
      language={language}
      storagePrefix={HERO_PREFIX}
      fileSystemMode="replace"
      customFileSystem={HERO_FS}
      disableScreenSaver
    />
  );
};

export default HeroDesktop;
