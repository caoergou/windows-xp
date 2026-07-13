import React, { Suspense, useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import blissUrl from '../assets/images/desktop_bg.jpg';
import { useSiteI18n } from './siteI18n';

const HeroDesktop = React.lazy(() => import('./HeroDesktop'));
const GlassBox = React.lazy(() => import('./GlassBox'));

/**
 * Landing page (#160) — "Three Desktops, One Engine". Phase 1 of the spec:
 * Act 1 (a real, self-driving desktop embed), Act 2 (static three-monitor
 * reveal), Act 4 (diegetic demo doors + roadmap + taskbar footer), site i18n,
 * SEO copy in real DOM, and `prefers-reduced-motion` support. Phases 2–3
 * (glass-box event ticker, Display Properties theming, pull-back camera,
 * cross-bezel drag, sound, exit dialog) are tracked as follow-ups.
 */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const GlobalReset = createGlobalStyle`
  #ssr-floor { display: none !important; }
  html, body {
    margin: 0;
    background: #0b1220;
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

const Page = styled.div`
  font-family: 'Trebuchet MS', Tahoma, 'Microsoft YaHei', sans-serif;
  color: #e8eef7;
  background:
    radial-gradient(1200px 600px at 50% -10%, #2a63c9 0%, transparent 60%),
    linear-gradient(180deg, #0e1830 0%, #0b1220 100%);
  min-height: 100vh;
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

const Section = styled.section`
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

// ── Act 1: the live desktop ─────────────────────────────────────────────────
const HeroWrap = styled(Section)`
  padding-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #bfe8c9;
  background: rgba(46, 160, 90, 0.16);
  border: 1px solid rgba(94, 214, 138, 0.5);
  border-radius: 999px;
  padding: 5px 12px;
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #56d68a;
    box-shadow: 0 0 8px #56d68a;
  }
`;

const Monitor = styled.div`
  position: relative;
  width: 100%;
  max-width: 900px;
  aspect-ratio: 4 / 3;
  max-height: 68vh;
  border-radius: 18px;
  padding: 18px 18px 40px;
  background: linear-gradient(180deg, #3a3f4a 0%, #23262d 60%, #16181d 100%);
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.08) inset,
    0 30px 60px rgba(0, 0, 0, 0.55),
    0 0 0 1px #000;
  &::after {
    /* power LED */
    content: '';
    position: absolute;
    right: 26px;
    bottom: 14px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #6fe38a;
    box-shadow: 0 0 8px #6fe38a;
  }
`;

const Screen = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 0 0 2px #0a0a0a, 0 0 30px rgba(0, 0, 0, 0.6) inset;
`;

const Poster = styled.button`
  position: absolute;
  inset: 0;
  border: 0;
  cursor: pointer;
  color: #fff;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
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

const HeroCaption = styled.p`
  max-width: 680px;
  text-align: center;
  color: #c7d4ea;
  font-size: 16px;
  line-height: 1.6;
  margin: 4px 0 0;
`;

// ── Act 2: three monitors ───────────────────────────────────────────────────
const Title = styled.h1`
  font-size: clamp(30px, 5vw, 50px);
  margin: 6px 0 12px;
  color: #fff;
  span {
    color: #8fb4f0;
  }
`;

const Lead = styled.p`
  max-width: 760px;
  color: #c2d0e6;
  font-size: 17px;
  line-height: 1.65;
`;

const MonitorRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px;
  margin-top: 34px;
  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const MiniMonitor = styled.a<{ $variant: 'xp' | 'netcafe' | 'echo' }>`
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 14px;
  padding: 12px 12px 22px;
  background: linear-gradient(180deg, #2f333c, #191b20);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45), 0 0 0 1px #000;
  position: relative;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  &::after {
    content: '';
    position: absolute;
    right: 16px;
    bottom: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3a4a3a;
    transition: background 0.25s ease, box-shadow 0.25s ease;
  }
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.5),
      0 0 0 1px #000,
      0 0 40px ${p => (p.$variant === 'netcafe' ? 'rgba(27, 79, 138, 0.25)' : 'rgba(36, 94, 219, 0.25)')};
    &::after {
      background: #6fe38a;
      box-shadow: 0 0 8px #6fe38a;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover { transform: none; }
  }
`;

const MiniScreen = styled.div<{ $variant: 'xp' | 'netcafe' | 'echo' }>`
  height: 170px;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 0 2px #0a0a0a;
  background: ${p =>
    p.$variant === 'xp'
      ? `url(${blissUrl}) center / cover no-repeat`
      : p.$variant === 'netcafe'
        ? 'radial-gradient(120% 90% at 30% 0%, #10233f 0%, #050912 70%)'
        : 'linear-gradient(160deg, #0d5c63 0%, #0a3b45 55%, #06232b 100%)'};
  .enter-hint {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
    color: #fff;
    font-size: 15px;
    font-weight: bold;
    letter-spacing: 1px;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 2;
    pointer-events: none;
  }
  ${MiniMonitor}:hover & .enter-hint {
    opacity: 1;
  }
`;

const MiniOverlay = styled.div<{ $variant: 'xp' | 'netcafe' | 'echo' }>`
  position: absolute;
  inset: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 6px;
  .win {
    align-self: flex-start;
    width: 62%;
    height: 46px;
    border-radius: 4px 4px 0 0;
    background: rgba(255, 255, 255, 0.9);
    border-top: 14px solid
      ${p => (p.$variant === 'netcafe' ? '#1b4f8a' : p.$variant === 'echo' ? '#0e8f9e' : '#245edb')};
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4);
  }
  .bar {
    height: 22px;
    border-radius: 3px;
    background: ${p =>
      p.$variant === 'netcafe'
        ? 'linear-gradient(#2a5fa0,#173a63)'
        : p.$variant === 'echo'
          ? 'rgba(255,255,255,0.22)'
          : 'linear-gradient(#3d95f5,#1b62c9)'};
    ${p => (p.$variant === 'echo' ? 'width: 60%; margin: 0 auto; border-radius: 14px;' : '')}
  }
`;

const Tag = styled.span<{ $concept?: boolean }>`
  position: absolute;
  top: 18px;
  right: 18px;
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  color: ${p => (p.$concept ? '#0b1220' : '#032')};
  background: ${p => (p.$concept ? '#7fd3d9' : '#6fe38a')};
  font-weight: bold;
`;

const MiniLabel = styled.div`
  margin-top: 12px;
  .n {
    font-weight: bold;
    color: #fff;
    font-size: 14px;
  }
  .d {
    color: #a9b8d2;
    font-size: 12.5px;
    line-height: 1.5;
    margin-top: 3px;
  }
`;

// ── Act 4: doors + roadmap ──────────────────────────────────────────────────
const Doors = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  margin-top: 30px;
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Door = styled.a<{ $accent: string }>`
  display: block;
  text-decoration: none;
  color: #10203a;
  background: linear-gradient(180deg, #ffffff, #eef4ff);
  border: 1px solid ${p => p.$accent};
  border-top: 6px solid ${p => p.$accent};
  border-radius: 10px;
  padding: 22px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.35);
  }
  .t {
    font-size: 20px;
    font-weight: bold;
  }
  .d {
    color: #405274;
    font-size: 14px;
    line-height: 1.55;
    margin: 8px 0 16px;
  }
  .cta {
    font-weight: bold;
    color: ${p => p.$accent};
  }
`;

const Roadmap = styled.ol`
  list-style: none;
  padding: 0;
  margin: 34px 0 0;
  display: grid;
  gap: 12px;
`;

const RoadItem = styled.li<{ $tone: string }>`
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid ${p => p.$tone};
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 15px;
  color: #d6e0f2;
  .when {
    flex-shrink: 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: ${p => p.$tone};
    width: 70px;
    font-weight: bold;
  }
`;

// ── Taskbar footer ──────────────────────────────────────────────────────────
// A static footer at the end of the page (NOT sticky) — a floating taskbar
// would collide with the hero desktop's own taskbar (two taskbars on screen).
const Taskbar = styled.footer`
  height: 34px;
  display: flex;
  align-items: stretch;
  background: linear-gradient(180deg, #245edb 0%, #1941a5 8%, #2461db 45%, #2461db 90%, #1c50c0 100%);
  border-top: 1px solid #4b8bf5;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.3);
  z-index: 50;
  font-size: 12px;
`;

const StartBtn = styled.button`
  border: 0;
  cursor: pointer;
  color: #fff;
  font-weight: bold;
  font-style: italic;
  font-size: 15px;
  padding: 0 22px 0 14px;
  background: linear-gradient(180deg, #3aa740 0%, #2a8f36 45%, #1f7a2c 100%);
  border-radius: 0 12px 12px 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 7px;
  .flag {
    width: 15px;
    height: 15px;
    border-radius: 3px;
    background: conic-gradient(#f35b2c 0 25%, #6fbf3b 0 50%, #3d95f5 0 75%, #f5c33b 0);
  }
`;

const NavStrip = styled.nav`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  overflow: hidden;
  a {
    color: #fff;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 3px;
    white-space: nowrap;
    &:hover {
      background: rgba(255, 255, 255, 0.18);
    }
  }
`;

const Tray = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px 0 10px;
  background: linear-gradient(180deg, #1288e4 0%, #0e6fc0 100%);
  border-left: 1px solid #0d5aa0;
  a,
  button {
    color: #fff;
    text-decoration: none;
    background: none;
    border: 0;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
  }
  .clock {
    color: #fff;
    min-width: 48px;
    text-align: center;
  }
`;

const monitors = [
  { key: 'xp', variant: 'xp' as const, live: true, href: 'demo/en/' },
  { key: 'netcafe', variant: 'netcafe' as const, href: 'demo/zh/' },
];

const Landing: React.FC = () => {
  const { t, lang, setLang } = useSiteI18n();
  const reduced = prefersReducedMotion();
  const [poweredOn, setPoweredOn] = useState(false);
  const [clock, setClock] = useState('');
  const idleRef = useRef<number | null>(null);
  // Lazy-mount the (heavy, second-engine) glass box only when scrolled near it.
  const [showGlass, setShowGlass] = useState(false);
  const glassSentinel = useRef<HTMLDivElement>(null);

  // Auto power-on the hero shortly after load (interaction also triggers it),
  // so a first-time visitor can drag a real window within ~5s (acceptance #1).
  useEffect(() => {
    const start = () => setPoweredOn(true);
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    if (typeof w.requestIdleCallback === 'function') {
      idleRef.current = w.requestIdleCallback(start) as unknown as number;
    }
    const t0 = window.setTimeout(start, 1400);
    return () => window.clearTimeout(t0);
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      let h = d.getHours();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      setClock(`${h}:${d.getMinutes().toString().padStart(2, '0')} ${ampm}`);
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const el = glassSentinel.current;
    if (!el || showGlass) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setShowGlass(true);
          io.disconnect();
        }
      },
      { rootMargin: '250px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [showGlass]);

  return (
    <Page>
      <GlobalReset />

      {/* Act 1 — you're already inside */}
      <HeroWrap id="top">
        <Badge>
          <span className="dot" />
          {t('hero.badge')}
        </Badge>
        <Monitor>
          <Screen>
            {poweredOn ? (
              <EngineHost>
                <Suspense fallback={<Poster as="div" aria-hidden />}>
                  <HeroDesktop
                    greeterTitle={t('greeter.title')}
                    greeterBody={t('greeter.body')}
                    reduced={reduced}
                  />
                </Suspense>
              </EngineHost>
            ) : (
              <Poster onClick={() => setPoweredOn(true)} aria-label={t('hero.powerOn')}>
                <span className="pill">▶ {t('hero.powerOn')}</span>
              </Poster>
            )}
          </Screen>
        </Monitor>
        <HeroCaption>{t('hero.tagline')}</HeroCaption>
      </HeroWrap>

      {/* Act 2 — two worlds, one engine */}
      <Section id="engine">
        <Eyebrow>{t('act2.eyebrow')}</Eyebrow>
        <Title>
          Two Worlds, One Engine <span>· 两个世界，一个引擎</span>
        </Title>
        <Lead>{t('act2.body')}</Lead>
        <MonitorRow>
          {monitors.map(m => (
            <MiniMonitor key={m.key} $variant={m.variant} href={m.href}>
              {m.live && <Tag>{t('monitor.live')}</Tag>}
              <MiniScreen $variant={m.variant}>
                <MiniOverlay $variant={m.variant}>
                  <div className="win" />
                  <div className="bar" />
                </MiniOverlay>
                <span className="enter-hint">{m.variant === 'netcafe' ? t('door.zh.cta') : t('door.en.cta')}</span>
              </MiniScreen>
              <MiniLabel>
                <div className="n">{t(`monitor.${m.key}`)}</div>
                <div className="d">{t(`monitor.${m.key}Desc`)}</div>
              </MiniLabel>
            </MiniMonitor>
          ))}
        </MonitorRow>
      </Section>

      {/* Act 3 — the glass box (lazy, mounts on scroll) */}
      <div ref={glassSentinel} />
      {showGlass && (
        <Suspense fallback={<Section style={{ minHeight: 460 }} aria-hidden />}>
          <GlassBox />
        </Suspense>
      )}

      {/* Roadmap */}
      <Section id="roadmap">
        <h2 style={{ marginTop: 0, color: '#fff' }}>{t('roadmap.title')}</h2>
        <Roadmap>
          <RoadItem $tone="#6fe38a">
            <span className="when">{t('roadmap.now')}</span>
            {t('roadmap.1')}
          </RoadItem>
          <RoadItem $tone="#8fb4f0">
            <span className="when">{t('roadmap.next')}</span>
            {t('roadmap.2')}
          </RoadItem>
          <RoadItem $tone="#c7a3f0">
            <span className="when">{t('roadmap.later')}</span>
            {t('roadmap.3')}
          </RoadItem>
          <RoadItem $tone="#c7a3f0">
            <span className="when">{t('roadmap.later')}</span>
            {t('roadmap.4')}
          </RoadItem>
        </Roadmap>
      </Section>

      {/* Footer as a real XP taskbar */}
      <Taskbar>
        <StartBtn onClick={() => document.getElementById('top')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })}>
          <span className="flag" />
          {t('footer.start')}
        </StartBtn>
        <NavStrip>
          <a href="#engine">{t('act2.title')}</a>
          <a href="#glassbox">{t('glass.title')}</a>
          <a href="demo/en/">{t('nav.demoEn')}</a>
          <a href="demo/zh/">{t('nav.demoZh')}</a>
          <a href="gallery/">{t('nav.gallery')}</a>
        </NavStrip>
        <Tray>
          <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} title="language">
            {t('lang.switch')}
          </button>
          <a href="https://github.com/caoergou/windows-xp" title="GitHub">
            GitHub
          </a>
          <span className="clock" aria-hidden>
            {clock}
          </span>
        </Tray>
      </Taskbar>
    </Page>
  );
};

export default Landing;
