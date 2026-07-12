import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { WindowsXP } from '../lib/index';
import type { XPHandle } from '../components/XPBridge';
import type { XPEvent } from '../events';
import type { FileNode } from '../types';
import { useSiteI18n } from './siteI18n';

/**
 * Act 3 (#160, Phase 2) — "the glass box". A live desktop next to a terminal
 * strip streaming its **real** `onEvent` feed: touch the left, watch typed
 * events scroll by on the right. Three proofs replace feature cards —
 * observe (the ticker), drive (Haunt it), rewrite (Swap its world / Break it).
 *
 * The whole section (engine included) is lazy-loaded by Landing, so the engine
 * chunk stays out of the landing entry until the visitor scrolls here.
 */

// ── two injectable worlds (proof: content is data) ──────────────────────────
const makePhoto = (from: string, to: string, label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
      `<rect width="480" height="360" fill="url(%23g)"/>` +
      `<text x="240" y="188" font-family="Georgia" font-size="26" fill="white" ` +
      `text-anchor="middle" opacity="0.85">${label}</text></svg>`
  );

const WORLD_DEFAULT: Record<string, FileNode> = {
  'ReadMe.txt': {
    type: 'file',
    name: 'ReadMe.txt',
    app: 'Notepad',
    content:
      'Touch anything on this desktop.\r\n\r\n' +
      'Every action — open, drag, read, unlock — streams as a typed event on\r\n' +
      'the right. That feed is the same onEvent prop you get.',
  },
  'secret.txt': {
    type: 'file',
    name: 'secret.txt',
    app: 'Notepad',
    content: 'The lock is off. file:unlock just fired on the right. 🔓',
    locked: true,
    password: 'bliss',
    hint: 'Press "Break it" and watch the events',
  },
};

const WORLD_PORTFOLIO: Record<string, FileNode> = {
  Portfolio: {
    type: 'folder',
    name: 'Portfolio',
    icon: 'folder',
    children: {
      'sunset.jpg': {
        type: 'file',
        name: 'sunset.jpg',
        app: 'PhotoViewer',
        content: makePhoto('%23ff8a3c', '%23c0392b', 'sunset.jpg'),
      },
      'harbor.jpg': {
        type: 'file',
        name: 'harbor.jpg',
        app: 'PhotoViewer',
        content: makePhoto('%233aa7c9', '%23134e7a', 'harbor.jpg'),
      },
      'forest.jpg': {
        type: 'file',
        name: 'forest.jpg',
        app: 'PhotoViewer',
        content: makePhoto('%236fbf4b', '%231f5e2c', 'forest.jpg'),
      },
    },
  },
  'About Me.txt': {
    type: 'file',
    name: 'About Me.txt',
    app: 'Notepad',
    content:
      'Same engine, different world.\r\n\r\n' +
      'Nothing about this desktop is hard-coded — a single customFileSystem prop\r\n' +
      'turned it into a photographer’s portfolio. That is the campaign / blog /\r\n' +
      'game use-case in one gesture.',
  },
};

// ── styles ──────────────────────────────────────────────────────────────────
const Wrap = styled.section`
  max-width: 1120px;
  margin: 0 auto;
  padding: 56px 20px;
`;
const Eyebrow = styled.div`
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 12px;
  color: #8fb4f0;
  margin-bottom: 10px;
`;
const Title = styled.h2`
  font-size: clamp(26px, 4.5vw, 42px);
  margin: 4px 0 10px;
  color: #fff;
`;
const Lead = styled.p`
  max-width: 760px;
  color: #c2d0e6;
  font-size: 16px;
  line-height: 1.6;
`;
const Proofs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 16px;
`;
const Proof = styled.button<{ $tone: string }>`
  cursor: pointer;
  border: 1px solid ${p => p.$tone};
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #eaf1fb;
  padding: 10px 14px;
  font-family: inherit;
  font-size: 14px;
  text-align: left;
  transition: background 0.15s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
  b {
    color: ${p => p.$tone};
    display: block;
    font-size: 15px;
  }
  span {
    color: #9db0cf;
    font-size: 12.5px;
  }
`;
const Split = styled.div`
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 16px;
  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;
const ScreenFrame = styled.div`
  border-radius: 12px;
  padding: 10px 10px 26px;
  background: linear-gradient(180deg, #33373f, #191b20);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45), 0 0 0 1px #000;
  position: relative;
`;
const Screen = styled.div`
  position: relative;
  height: 380px;
  border-radius: 5px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 0 0 2px #0a0a0a;
  & > * {
    position: absolute !important;
    inset: 0;
  }
`;
const Terminal = styled.div`
  border-radius: 10px;
  border: 1px solid #1f3350;
  background: #060b16;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 300px;
`;
const TermHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #0b1526;
  border-bottom: 1px solid #1f3350;
  color: #7fe0a6;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #56d68a;
    box-shadow: 0 0 6px #56d68a;
  }
  .path {
    color: #6a86ad;
    margin-left: auto;
  }
`;
const TermBody = styled.pre`
  flex: 1;
  margin: 0;
  padding: 8px 12px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.55;
  color: #cfe0f5;
  min-height: 0;
`;
const Line = styled.div<{ $tone: string }>`
  white-space: pre-wrap;
  word-break: break-word;
  .t {
    color: ${p => p.$tone};
    font-weight: bold;
  }
  .p {
    color: #7f93b3;
  }
`;
const Snippet = styled.pre`
  margin: 18px 0 0;
  padding: 14px 16px;
  border-radius: 10px;
  background: #071324;
  border: 1px solid #16324f;
  color: #bcd0ea;
  font-family: 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.6;
  overflow-x: auto;
  .k {
    color: #6fb0ff;
  }
  .s {
    color: #7fe0a6;
  }
`;

const DOMAIN_TONE: Record<string, string> = {
  app: '#6fb0ff',
  window: '#8fb4f0',
  file: '#7fe0a6',
  folder: '#7fe0a6',
  session: '#c7a3f0',
  password: '#ff8a6b',
  notification: '#ffd24a',
  ie: '#6fe3d0',
  wallpaper: '#f0a3d0',
  qq: '#ff9a9a',
  recyclebin: '#7fe0a6',
};

const fmtEvent = (e: XPEvent): { tone: string; type: string; payload: string } => {
  const domain = e.type.split(':')[0];
  const { type, ...rest } = e as Record<string, unknown> & { type: string };
  void type;
  const payload = Object.entries(rest)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.join('/')}]` : JSON.stringify(v)}`)
    .join(' ');
  return { tone: DOMAIN_TONE[domain] ?? '#cfe0f5', type: e.type, payload };
};

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const GLASS_PREFIX = 'site_glass_';
if (typeof window !== 'undefined') {
  try {
    Object.keys(window.localStorage)
      .filter(k => k.startsWith(GLASS_PREFIX))
      .forEach(k => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

const GlassBox: React.FC = () => {
  const { t } = useSiteI18n();
  const xp = useRef<XPHandle>(null);
  const [world, setWorld] = useState<'default' | 'portfolio'>('default');
  const [busy, setBusy] = useState(false);
  const runToken = useRef(0);

  // Real onEvent → ring buffer → batched render (~8fps) so a burst can't thrash.
  const buffer = useRef<XPEvent[]>([]);
  const [events, setEvents] = useState<XPEvent[]>([]);
  const onEvent = useCallback((e: XPEvent) => {
    buffer.current.push(e);
    if (buffer.current.length > 200) buffer.current.shift();
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setEvents(buffer.current.slice(-40)), 120);
    return () => window.clearInterval(id);
  }, []);
  const termRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events]);

  const cancel = () => {
    runToken.current += 1;
    setBusy(false);
  };

  // Drive — a ghost tour over the imperative handle.
  const haunt = async () => {
    const handle = xp.current;
    if (!handle) return;
    cancel();
    const token = ++runToken.current;
    setBusy(true);
    const alive = () => token === runToken.current;
    handle.openApp('Calculator');
    await delay(800);
    if (!alive()) return;
    handle.notify({
      icon: 'help',
      title: t('glass.hauntTitle'),
      body: t('glass.hauntBody'),
      timeout: 5000,
    });
    await delay(900);
    if (!alive()) return;
    handle.openApp('Minesweeper');
    await delay(900);
    if (!alive()) return;
    const list = handle.windows.list();
    if (list[0]) handle.windows.minimize(list[0].id);
    await delay(700);
    if (!alive()) return;
    handle.showAlert(t('glass.hauntDoneTitle'), t('glass.hauntDoneBody'));
    setBusy(false);
  };

  // Rewrite — swap the whole world via a fresh customFileSystem.
  const swap = () => {
    cancel();
    setWorld(w => (w === 'default' ? 'portfolio' : 'default'));
  };

  // Rewrite/observe — trip the lock and watch file:unlock fire for real.
  const breakIt = async () => {
    const handle = xp.current;
    if (!handle) return;
    if (world !== 'default') setWorld('default');
    cancel();
    const token = ++runToken.current;
    setBusy(true);
    const alive = () => token === runToken.current;
    handle.notify({
      icon: 'user',
      title: t('glass.breakTitle'),
      body: t('glass.breakBody'),
      timeout: 5000,
    });
    await delay(800);
    if (!alive()) return;
    handle.openFile(['secret.txt']); // locked → password dialog
    await delay(1300);
    if (!alive()) return;
    handle.fs.unlockNode(['secret.txt']); // emits a real file:unlock
    await delay(500);
    if (!alive()) return;
    handle.openFile(['secret.txt']); // now opens the revealed content
    setBusy(false);
  };

  return (
    <Wrap id="glassbox">
      <Eyebrow>{t('glass.eyebrow')}</Eyebrow>
      <Title>{t('glass.title')}</Title>
      <Lead>{t('glass.body')}</Lead>

      <Proofs>
        <Proof $tone="#6fb0ff" onClick={haunt} disabled={busy} data-testid="glass-haunt">
          <b>{t('glass.haunt')}</b>
          <span>{t('glass.hauntHint')}</span>
        </Proof>
        <Proof $tone="#7fe0a6" onClick={swap} data-testid="glass-swap">
          <b>{t('glass.swap')}</b>
          <span>{world === 'default' ? t('glass.swapHint') : t('glass.swapBack')}</span>
        </Proof>
        <Proof $tone="#ff8a6b" onClick={breakIt} disabled={busy} data-testid="glass-break">
          <b>{t('glass.break')}</b>
          <span>{t('glass.breakHint')}</span>
        </Proof>
      </Proofs>

      <Split>
        <ScreenFrame>
          <Screen>
            <WindowsXP
              key={world}
              ref={xp}
              mode="embedded"
              viewportPolicy="scale"
              skipBoot
              autoLogin
              disableScreenSaver
              storagePrefix={`${GLASS_PREFIX}${world}_`}
              fileSystemMode="replace"
              customFileSystem={world === 'default' ? WORLD_DEFAULT : WORLD_PORTFOLIO}
              onEvent={onEvent}
            />
          </Screen>
        </ScreenFrame>

        <Terminal>
          <TermHead>
            <span className="dot" />
            onEvent
            <span className="path">live feed</span>
          </TermHead>
          <TermBody ref={termRef} data-testid="glass-ticker">
            {events.length === 0 ? (
              <Line $tone="#5f78a0">
                <span className="p">{t('glass.tickerIdle')}</span>
              </Line>
            ) : (
              events.map((e, i) => {
                const f = fmtEvent(e);
                return (
                  <Line key={i} $tone={f.tone}>
                    <span className="t">{f.type}</span>
                    {f.payload ? <span className="p"> {f.payload}</span> : null}
                  </Line>
                );
              })
            )}
          </TermBody>
        </Terminal>
      </Split>

      <Snippet>
        <span className="k">&lt;WindowsXP</span>{'\n'}
        {'  '}mode=<span className="s">&quot;embedded&quot;</span>{'\n'}
        {'  '}fileSystemMode=<span className="s">&quot;replace&quot;</span>{'\n'}
        {'  '}customFileSystem={'{'}yourWorld{'}'}{'\n'}
        {'  '}onEvent={'{'}e =&gt; console.log(e.type){'}'} <span className="p">{'// the feed →'}</span>{'\n'}
        {'  '}ref={'{'}xp{'}'} <span className="p">{'// xp.current.openApp(), .fs.unlockNode()…'}</span>{'\n'}
        <span className="k">/&gt;</span>
      </Snippet>
    </Wrap>
  );
};

export default GlassBox;
