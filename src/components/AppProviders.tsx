import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { I18nextProvider, useTranslation } from 'react-i18next';
import App from '../App';
import MobileWarning from './MobileWarning';
import { useViewportScale } from '../hooks/useViewportScale';
import { ViewportScaleProvider } from '../context/ViewportScaleContext';
import { resolveOSTheme } from '../themes/useOSTheme';
import xpI18n, { NAMESPACE } from '../i18n';
import { FileSystemProvider, type FileSystemMode } from '../context/FileSystemContext';
import type { WallpaperItem } from '../data/wallpapers';
import { WindowManagerProvider } from '../context/WindowManagerContext';
import { KeymapProvider } from '../context/KeymapContext';
import { UserSessionProvider } from '../context/UserSessionContext';
import { TrayProvider } from '../context/TrayContext';
import { ModalProvider } from '../context/ModalContext';
import { AppRegistryProvider, useAppRegistry } from '../context/AppRegistryContext';
import { CultureProvider, useCulture } from '../context/CultureContext';
import { FileNode, AppRegistryEntry } from '../types';
import { CulturePackage, filterByLocale } from '../data/culture';
import { EventBusProvider } from '../context/EventBusContext';
import { StorageProvider } from '../context/StorageContext';
import { ContentPackProvider } from '../context/ContentPackContext';
import { mergeContentPacks, mergeFsFragments } from '../content/pack';
import type { ContentPack } from '../content/types';
import { SchedulerProvider } from '../context/SchedulerContext';
import { ClockProvider, type ClockConfig } from '../context/ClockContext';
import { RecentDocumentsProvider } from '../context/RecentDocumentsContext';
import { PrintSpoolerProvider } from '../context/PrintSpoolerContext';
import { PowerTransitionProvider, type PowerSequence } from '../context/PowerTransitionContext';
import { PowerTransitionOverlay } from './PowerTransitionOverlay';
import { XPEventBridge, XPImperativeApi, type XPHandle } from './XPBridge';
import { ScenarioRunner } from './ScenarioRunner';
// Dev-only overlay (#209): lazy so a production build that never sets `devtools`
// tree-shakes the panel out of the main chunk.
const DevToolsPanel = React.lazy(() => import('../devtools/DevToolsPanel'));
import { LessonProvider } from '../context/LessonContext';
import { NotesProvider } from '../context/NotesContext';
import type { Scenario } from '../scenario/types';
import type { Lesson } from '../lesson/types';
import { DeepLinkLoader } from './DeepLinkLoader';
import { MarkdownProvider } from './MarkdownProvider';
import type { MarkdownOptions } from '../apps/MarkdownViewer/config';
import type { DeepLinkRoutes } from '../utils/deepLink';
import { XPEventBus } from '../events';
import { registerSounds } from '../utils/soundManager';
import { xpTheme } from '../themes/xp';
import { mountThemeCss } from '../themes/mountThemeCss';
import type { OSTheme } from '../themes/contract';
import type { XPEventListener } from '../events';
import { setStoragePrefix, type PersistenceMode } from '../utils/storage';
import { getSavedLanguage } from '../utils/language';
import type { BootBranding, LoginBranding } from '../branding';
import type { ViewportPolicy } from '../hooks/useViewportScale';

export interface AppProvidersProps {
  /** Subscribe to desktop events (#76). */
  onEvent?: XPEventListener;
  /** Imperative handle for driving the desktop programmatically (#76). */
  handleRef?: React.Ref<XPHandle>;
  username?: string;
  password?: string;
  language?: string;
  customFileSystem?: Record<string, FileNode>;
  /** 'merge' (default) or 'replace' the built-in filesystem (#77). */
  fileSystemMode?: FileSystemMode;
  /** Login/user avatar: an XPIcon id or an image URL (#77). */
  avatar?: string;
  /** Extra wallpapers merged over the built-in list (#77). */
  wallpapers?: WallpaperItem[];
  /** Initial wallpaper (id or URL) when the user hasn't picked one (#77). */
  defaultWallpaper?: string;
  cultures?: CulturePackage[];
  apps?: AppRegistryEntry[];
  skipBoot?: boolean;
  autoLogin?: boolean;
  storagePrefix?: string;
  disableContextMenuBlock?: boolean;
  disableDevToolsBlock?: boolean;
  disableGlobalShortcuts?: boolean;
  /** Per-shortcut overrides (#132): map a shortcut id to a new combo, or `null` to disable it. */
  keymap?: Record<string, string | null>;
  disableScreenSaver?: boolean;
  /** Play the classic hourly chime on `time:hour`. Off by default (#130). */
  hourlyChime?: boolean;
  /** Inactivity threshold (ms) before `user:idle` fires. Default 60000 (#130). */
  idleThresholdMs?: number;
  /** Instance-local virtual system clock (#275). */
  clock?: ClockConfig;
  /** Authored power-off presentation and host-controlled completion (#279). */
  powerSequence?: PowerSequence;
  /** Deep-link key path(s) to open once interactive (#136). */
  openOnLoad?: string | string[];
  /** Pretty URL routes matched against `location` (#136). */
  routes?: DeepLinkRoutes;
  /** Host's current location for `routes` matching (#136). */
  location?: string;
  /** Push/pop history as top-level windows open/close (#136). Default off. */
  historyIntegration?: boolean;
  /** Persistence backend (#138): 'local' (default) | 'session' | 'none'. */
  persistence?: PersistenceMode;
  markdown?: MarkdownOptions;
  /** Boot-screen branding (#139). */
  boot?: BootBranding;
  /** Login-screen branding (#139). */
  login?: LoginBranding;
  /** Declarative scenario/story script — triggers, flags, gated actions (#84). */
  scenario?: Scenario;
  /**
   * Content packs (#241): bundles of authorized IE sites, a `customFileSystem`
   * fragment, an asset manifest, and per-culture string tables. Mounted into the
   * instance — pack files merge into the filesystem (under an explicit
   * `customFileSystem`), and authorized sites become available to IE.
   */
  contentPacks?: ContentPack[];
  /** Guided lessons (#141) — data-driven tutorials, driven via `startLesson`. */
  lessons?: Lesson[];
  /**
   * Mount the Scenario / event DevTools overlay (#209): a dev-time panel showing
   * the live event stream, current flags, and per-trigger hit/miss with the
   * `when` predicate tree. Opt-in; off in production.
   */
  devtools?: boolean;
  /** Small-screen / portrait strategy (#215). */
  viewportPolicy?: ViewportPolicy;
  /**
   * OS look-and-feel package (#213 B1). Defaults to the built-in Windows XP
   * (Luna) theme. The selected theme is injected through a styled-components
   * `ThemeProvider` (readable via `props.theme` / `useOSTheme()`) and supplies
   * the sound scheme registered at startup. Swapping it is the runtime seam a
   * future non-XP package plugs into.
   */
  theme?: OSTheme;
}

const CultureAwareProviders: React.FC<Omit<AppProvidersProps, 'cultures'>> = ({
  onEvent,
  handleRef,
  username,
  password,
  language,
  customFileSystem,
  fileSystemMode,
  avatar,
  wallpapers,
  defaultWallpaper,
  skipBoot,
  autoLogin,
  storagePrefix,
  disableContextMenuBlock,
  disableDevToolsBlock,
  disableGlobalShortcuts,
  keymap,
  disableScreenSaver,
  hourlyChime,
  idleThresholdMs,
  clock,
  powerSequence,
  openOnLoad,
  routes,
  location,
  historyIntegration,
  persistence,
  markdown,
  boot,
  login,
  scenario,
  lessons,
  devtools,
  contentPacks,
}) => {
  // Configure storage namespace synchronously before any context reads/writes storage.
  setStoragePrefix(storagePrefix || 'xp_');

  // Content packs (#241): merge their filesystem fragments under the host's
  // explicit customFileSystem (which wins on leaf collisions); sites/assets/
  // strings/resolver ride the ContentPackProvider below.
  const packFiles = useMemo(() => mergeContentPacks(contentPacks ?? []).files, [contentPacks]);
  const packRecycleBin = useMemo(
    () => mergeContentPacks(contentPacks ?? []).recycleBin,
    [contentPacks]
  );
  const packRecentDocuments = useMemo(
    () => mergeContentPacks(contentPacks ?? []).recentDocuments,
    [contentPacks]
  );
  const mountedPackContent = useMemo(() => mergeContentPacks(contentPacks ?? []), [contentPacks]);
  const mergedCustomFileSystem = useMemo(
    () =>
      Object.keys(packFiles).length
        ? mergeFsFragments(packFiles, customFileSystem ?? {})
        : customFileSystem,
    [packFiles, customFileSystem]
  );

  // One event bus per desktop instance (#76).
  const busRef = useMemo(() => new XPEventBus(), []);

  const { i18n } = useTranslation();
  const { culture, cultureKey, setCultureByLang } = useCulture();
  const { registry } = useAppRegistry();
  const activeLang = getSavedLanguage(language || 'en');

  // Item-level `locales` are honored here (#129): a shortcut whitelisted to
  // other languages is filtered out for the active language.
  const culturalShortcuts = useMemo(
    () =>
      culture.desktopShortcuts
        ? desktopShortcutsToNodes(filterByLocale(culture.desktopShortcuts, activeLang))
        : {},
    [culture, activeLang]
  );

  // Dev-mode: warn if the active culture references app ids that aren't in the
  // merged registry (respects the `apps` prop — validation that defineCulture
  // can't do at author time). Also surfaces unmet `requiredApps`.
  useEffect(() => {
    if (!(import.meta.env?.DEV ?? false)) return;
    const known = new Set(Object.keys(registry));
    (culture.desktopShortcuts ?? []).forEach(s => {
      if (s.app && !known.has(s.app)) {
        console.warn(
          `[windows-xp] culture "${culture.id}": desktop shortcut "${s.id}" references ` +
            `unregistered app "${s.app}". Register it (built-in or via the \`apps\` prop).`
        );
      }
    });
    (culture.requiredApps ?? []).forEach(appId => {
      if (!known.has(appId)) {
        console.warn(
          `[windows-xp] culture "${culture.id}": requiredApp "${appId}" is not registered.`
        );
      }
    });
  }, [culture, registry]);

  // Sync language and culture when the language prop changes.
  useEffect(() => {
    if (i18n.language !== activeLang) {
      i18n.changeLanguage(activeLang);
    }
    setCultureByLang(activeLang);
  }, [activeLang, i18n, setCultureByLang]);

  // Merge culture-specific i18n resources into the isolated xp i18n instance.
  useEffect(() => {
    if (!culture.i18n) return;
    Object.entries(culture.i18n).forEach(([lang, resources]) => {
      xpI18n.addResourceBundle(lang, NAMESPACE, resources, true, true);
    });
  }, [culture]);

  // User-provided customFileSystem takes precedence over the culture package
  return (
    <StorageProvider prefix={storagePrefix || 'xp_'} persistence={persistence}>
      <ContentPackProvider packs={contentPacks}>
        <EventBusProvider bus={busRef}>
          <XPEventBridge onEvent={onEvent} />
          <PowerTransitionProvider sequence={powerSequence ?? mountedPackContent.powerSequence}>
            <PowerTransitionOverlay />
            <ClockProvider config={clock}>
              <RecentDocumentsProvider seeded={packRecentDocuments}>
                <PrintSpoolerProvider
                  printers={mountedPackContent.printers}
                  jobs={mountedPackContent.printJobs}
                >
                  <SchedulerProvider
                    hourlyChime={hourlyChime ?? culture.hourlyChime}
                    idleThresholdMs={idleThresholdMs}
                  >
                    <UserSessionProvider
                      username={username}
                      password={password}
                      autoLogin={autoLogin}
                      avatar={avatar}
                      wallpapers={wallpapers}
                      defaultWallpaper={defaultWallpaper ?? culture.wallpaper}
                    >
                      <FileSystemProvider
                        customFileSystem={mergedCustomFileSystem}
                        cultureFileSystem={culturalShortcuts}
                        cultureKey={cultureKey}
                        fileSystemMode={fileSystemMode}
                        seededRecycleBin={packRecycleBin}
                      >
                        <WindowManagerProvider registry={registry}>
                          <MarkdownProvider options={markdown}>
                            <KeymapProvider
                              keymap={keymap}
                              disableGlobalShortcuts={disableGlobalShortcuts}
                            >
                              <TrayProvider>
                                <ModalProvider>
                                  <NotesProvider>
                                    <LessonProvider lessons={lessons}>
                                      <XPImperativeApi
                                        ref={handleRef}
                                        storagePrefix={storagePrefix}
                                      />
                                      <ScenarioRunner scenario={scenario} />
                                      {devtools && (
                                        <React.Suspense fallback={null}>
                                          <DevToolsPanel scenario={scenario} />
                                        </React.Suspense>
                                      )}
                                      <DeepLinkLoader
                                        open={openOnLoad}
                                        routes={routes}
                                        location={location}
                                        historyIntegration={historyIntegration}
                                      />
                                      <App
                                        initialLanguage={language}
                                        skipBoot={skipBoot}
                                        disableContextMenuBlock={disableContextMenuBlock}
                                        disableDevToolsBlock={disableDevToolsBlock}
                                        disableScreenSaver={disableScreenSaver}
                                        boot={boot}
                                        login={login}
                                      />
                                    </LessonProvider>
                                  </NotesProvider>
                                </ModalProvider>
                              </TrayProvider>
                            </KeymapProvider>
                          </MarkdownProvider>
                        </WindowManagerProvider>
                      </FileSystemProvider>
                    </UserSessionProvider>
                  </SchedulerProvider>
                </PrintSpoolerProvider>
              </RecentDocumentsProvider>
            </ClockProvider>
          </PowerTransitionProvider>
        </EventBusProvider>
      </ContentPackProvider>
    </StorageProvider>
  );
};

/** Convert desktop shortcuts from a culture package into filesystem nodes. */
function desktopShortcutsToNodes(
  shortcuts: NonNullable<CulturePackage['desktopShortcuts']>
): Record<string, FileNode> {
  return Object.fromEntries(
    shortcuts.map(s => [
      s.name,
      {
        type: 'app_shortcut',
        name: s.name,
        app: s.app,
        icon: s.icon,
        managedByCulture: true,
        cultureId: s.id,
      } as FileNode,
    ])
  );
}

// #215 small-screen scaling. The Letterbox and the transform sit ABOVE
// `.windows-xp-root` (which owns the 1024px baseline floor), so on a narrow
// container the whole desktop scales to fit, letterboxed — while the gallery,
// which mounts `.windows-xp-root` on its own, is untouched. Inactive ⇒ both are
// transparent full-size passthroughs, so the desktop is byte-identical.
const Letterbox = styled.div<{ $active: boolean }>`
  width: 100%;
  height: 100%;
  ${p =>
    p.$active &&
    `
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: ${resolveOSTheme(p.theme).tokens.DESKTOP_BACKGROUND};
  `}
`;

const RotateHint = styled.div`
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999997;
  max-width: min(92vw, 360px);
  padding: 7px 12px;
  box-sizing: border-box;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
`;

/**
 * Fixed-to-viewport chrome that must stay OUTSIDE the scaled `.windows-xp-root`
 * (a `position: fixed` element inside a `transform`ed ancestor is captured by
 * that ancestor). Rendered inside i18n so it can translate. (#215)
 */
const ViewportChrome: React.FC<{ showRotateHint: boolean }> = ({ showRotateHint }) => {
  const { t } = useTranslation();
  return (
    <>
      <MobileWarning />
      {showRotateHint && (
        <RotateHint className="windows-xp-portal" role="status" data-testid="rotate-hint">
          {t('mobileWarning.rotateHint')}
        </RotateHint>
      )}
    </>
  );
};

export const AppProviders: React.FC<AppProvidersProps> = ({
  cultures,
  apps,
  language,
  viewportPolicy,
  theme = xpTheme,
  ...rest
}) => {
  const activeLang = getSavedLanguage(language || 'en');
  const letterboxRef = useRef<HTMLDivElement>(null);
  const viewport = useViewportScale(viewportPolicy ?? 'auto', letterboxRef);

  // Register the active theme's sound scheme (#213 B1). This replaces the old
  // module-level `registerSounds(XP_SOUNDS)` binding so the sounds follow the
  // selected theme; `useMemo` runs synchronously during render, before any child
  // (boot chime included) can play. The engine's soundManager still binds no
  // audio itself; app sounds (QQ) self-register from their own package.
  useMemo(() => registerSounds(theme.sounds), [theme]);

  // Mount the active theme's skin sheet (`OSTheme.css`, #213 B1) — the skin
  // follows the selected theme instead of being statically imported by the
  // entries. Layout effect so the sheet is in place before first paint;
  // `mountThemeCss` refcounts shared tags and removes the last one on unmount.
  useLayoutEffect(() => mountThemeCss(theme), [theme]);

  const rootStyle: React.CSSProperties = viewport.active
    ? {
        flex: '0 0 auto',
        width: viewport.baseWidth,
        height: viewport.baseHeight,
        transform: `scale(${viewport.scale})`,
        transformOrigin: 'center center',
      }
    : { width: '100%', height: '100%' };

  return (
    <ThemeProvider theme={theme}>
      <Letterbox ref={letterboxRef} $active={viewport.active}>
        <I18nextProvider i18n={xpI18n}>
          <ViewportScaleProvider scale={viewport.scale}>
            <ViewportChrome showRotateHint={viewport.showRotateHint} />
            <div className="windows-xp-root" style={rootStyle}>
              <AppRegistryProvider apps={apps}>
                <CultureProvider cultures={cultures} defaultLanguage={activeLang}>
                  <CultureAwareProviders language={language} {...rest} />
                </CultureProvider>
              </AppRegistryProvider>
            </div>
          </ViewportScaleProvider>
        </I18nextProvider>
      </Letterbox>
    </ThemeProvider>
  );
};

export default AppProviders;
