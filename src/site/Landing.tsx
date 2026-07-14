import React, { Suspense, useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import blissUrl from '../assets/images/desktop_bg.jpg';
import { useSiteI18n } from './siteI18n';

const HeroDesktop = React.lazy(() => import('./HeroDesktop'));

/**
 * Landing page v3 (#250) — "one monitor, one room, the millennium internet".
 * A single act: a CRT monitor glowing in a dark room, running the real engine.
 * All explanation is diegetic (readme + desktop shortcuts inside the screen) or
 * lives in docs; the page carries one tagline, one install command and one
 * quiet line of links. No sections, no page-level XP chrome — the only taskbar
 * anywhere is the genuine one inside the desktop.
 */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const isSmallViewport = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(max-width: 520px)').matches;

const GlobalReset = createGlobalStyle`
  #ssr-floor { display: none !important; }
  html, body {
    margin: 0;
    background: #07090f;
    height: auto;
    min-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }
  #root {
    min-height: 100vh;
    height: auto;
    width: 100%;
  }
  * { box-sizing: border-box; }
`;

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// The room: near-black, one light source (the screen), a breath of noise.
const Page = styled.main`
  font-family: 'Trebuchet MS', Tahoma, 'Microsoft YaHei', sans-serif;
  color: #e8eef7;
  background:
    radial-gradient(900px 520px at 50% 32%, rgba(38, 90, 187, 0.2) 0%, transparent 65%), #07090f;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  padding: 40px 20px 48px;
  position: relative;
  &::after {
    content: '';
    position: fixed;
    inset: 0;
    background: ${NOISE_SVG};
    background-size: 200px 200px;
    opacity: 0.03;
    mix-blend-mode: overlay;
    pointer-events: none;
    z-index: 100;
  }
`;

// Sized from BOTH axes so monitor + tagline + install + links fit one viewport:
// width is capped by the height budget times 4:3 — the non-monitor stack
// (page padding + gaps + tagline + pill + quiet line) plus the bezel's own
// vertical chrome comes to ≈ 320px on a desktop viewport.
const Monitor = styled.div`
  position: relative;
  width: min(880px, 94vw, calc((100vh - 320px) * 4 / 3));
  border-radius: 18px;
  padding: 16px 16px 34px;
  background: linear-gradient(180deg, #3a3f4a 0%, #23262d 60%, #16181d 100%);
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.08) inset,
    0 30px 60px rgba(0, 0, 0, 0.55),
    0 0 90px rgba(46, 104, 205, 0.14),
    0 0 0 1px #000;
  &::after {
    /* power LED */
    content: '';
    position: absolute;
    right: 24px;
    bottom: 12px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #6fe38a;
    box-shadow: 0 0 8px #6fe38a;
  }
`;

// The screen owns the 4:3 ratio (not the outer bezel), so the engine's
// scaled viewport fills it edge-to-edge with no pillarbox bars.
const Screen = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  overflow: hidden;
  background: #000;
  box-shadow:
    0 0 0 2px #0a0a0a,
    0 0 30px rgba(0, 0, 0, 0.6) inset;
`;

// One-time CRT power-on blink: a bright horizontal beam that snaps open.
const crtOn = keyframes`
  0%   { opacity: 1; transform: scaleY(0.004); }
  55%  { opacity: 1; transform: scaleY(0.012); }
  80%  { opacity: 0.9; transform: scaleY(1); }
  100% { opacity: 0; transform: scaleY(1); }
`;

const PowerFlash = styled.div`
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: radial-gradient(closest-side, #f4f9ff 0%, #bcd6ff 55%, transparent 100%);
  transform-origin: center;
  animation: ${crtOn} 0.34s ease-out forwards;
`;

const Poster = styled.button<{ $as?: string }>`
  position: absolute;
  inset: 0;
  border: 0;
  cursor: pointer;
  color: #fff;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  background:
    linear-gradient(rgba(0, 30, 80, 0.25), rgba(0, 30, 80, 0.45)),
    url(${blissUrl}) center / cover no-repeat;
  .pill {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 6px;
    padding: 10px 18px;
    font-size: 15px;
  }
`;

const EngineHost = styled.div`
  position: absolute;
  inset: 0;
  /* The engine renders its own fixed-position desktop; scope it to the screen. */
  & > * {
    position: absolute !important;
    inset: 0;
  }
`;

// The page's entire visible copy: one line.
const Tagline = styled.h1`
  margin: 0;
  max-width: 720px;
  text-align: center;
  font-size: clamp(17px, 2.4vw, 24px);
  font-weight: normal;
  line-height: 1.55;
  color: #dbe5f5;
  text-wrap: balance;
`;

// …and one command.
const InstallPill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(143, 180, 240, 0.28);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #b9c9e4;
  font-family: 'Courier New', monospace;
  font-size: 13.5px;
  padding: 9px 14px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(143, 180, 240, 0.5);
  }
  .ver {
    color: #64748f;
    font-size: 11.5px;
  }
  .copied {
    color: #7fe0a6;
    font-size: 11.5px;
  }
`;

// …and one quiet line of links. A museum placard's credit line, not a menu.
const QuietLine = styled.nav`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 0;
  font-size: 12.5px;
  letter-spacing: 0.4px;
  color: #4c5a75;
  a,
  button {
    color: #7c8aa5;
    text-decoration: none;
    background: none;
    border: 0;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    letter-spacing: inherit;
    padding: 2px 4px;
    &:hover {
      color: #cfdcf2;
      text-decoration: underline;
    }
  }
  .sep {
    padding: 0 6px;
    user-select: none;
  }
  @media (max-width: 520px) {
    font-size: 15px;
    gap: 10px 0;
    a[data-demo],
    button {
      padding: 8px 10px;
    }
    a[data-demo] {
      border: 1px solid rgba(143, 180, 240, 0.35);
      border-radius: 6px;
    }
  }
`;

const INSTALL_CMD = 'npm install @caoergou/windows-xp';

const Landing: React.FC = () => {
  const { t, lang, setLang } = useSiteI18n();
  const reduced = prefersReducedMotion();
  // ≤520px the live desktop is illegible — serve the poster + big demo links
  // instead of a shrunken engine (honest and fast beats interactive and broken).
  const [mobile] = useState(isSmallViewport);
  const [poweredOn, setPoweredOn] = useState(false);
  const [flash, setFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const idleRef = useRef<number | null>(null);

  // Auto power-on shortly after load (interaction also triggers it), so a
  // first-time visitor can drag a real window within ~5s (#160 acceptance #1).
  useEffect(() => {
    if (mobile) return;
    const start = () => setPoweredOn(true);
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === 'function') {
      idleRef.current = w.requestIdleCallback(start) as unknown as number;
    }
    const t0 = window.setTimeout(start, 1400);
    return () => window.clearTimeout(t0);
  }, [mobile]);

  // One-time CRT blink when the screen comes alive (skipped under reduced motion).
  useEffect(() => {
    if (!poweredOn || reduced) return;
    setFlash(true);
    const t0 = window.setTimeout(() => setFlash(false), 400);
    return () => window.clearTimeout(t0);
  }, [poweredOn, reduced]);

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the command is selectable text either way */
    }
  };

  const demoHref = lang === 'zh' ? 'demo/zh/' : 'demo/en/';

  return (
    <Page>
      <GlobalReset />

      <Monitor>
        <Screen>
          {poweredOn && !mobile ? (
            <EngineHost>
              <Suspense fallback={<Poster as="div" aria-hidden />}>
                <HeroDesktop
                  key={lang}
                  greeterFileName={t('greeter.fileName')}
                  greeterBody={t('greeter.body')}
                  language={lang}
                />
              </Suspense>
              {flash && <PowerFlash aria-hidden />}
            </EngineHost>
          ) : mobile ? (
            <Poster as="a" href={demoHref} aria-label={t('hero.mobileOpen')}>
              <span className="pill">{t('hero.mobileOpen')} →</span>
            </Poster>
          ) : (
            <Poster onClick={() => setPoweredOn(true)} aria-label={t('hero.powerOn')}>
              <span className="pill">▶ {t('hero.powerOn')}</span>
            </Poster>
          )}
        </Screen>
      </Monitor>

      <Tagline>{t('tagline')}</Tagline>

      <InstallPill onClick={copyInstall} title={t('install.copy')} data-testid="install-pill">
        <span>{INSTALL_CMD}</span>
        {copied ? (
          <span className="copied">✓ {t('install.copied')}</span>
        ) : (
          <span className="ver">v{__SITE_VERSION__}</span>
        )}
      </InstallPill>

      <QuietLine aria-label="site">
        <a href="demo/zh/" data-demo>
          {t('links.demoZh')}
        </a>
        <span className="sep">·</span>
        <a href="demo/en/" data-demo>
          {t('links.demoEn')}
        </a>
        <span className="sep">·</span>
        <a href="docs/">{t('links.docs')}</a>
        <span className="sep">·</span>
        <a href="gallery/">{t('links.gallery')}</a>
        <span className="sep">·</span>
        <a href="https://github.com/caoergou/windows-xp">GitHub</a>
        <span className="sep">·</span>
        <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} title="language">
          {t('lang.switch')}
        </button>
      </QuietLine>
    </Page>
  );
};

export default Landing;
