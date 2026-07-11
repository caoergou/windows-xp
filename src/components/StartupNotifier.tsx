import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCulture } from '../context/CultureContext';
import { useTray } from '../context/TrayContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { APP_REGISTRY } from '../registry/apps';

const STARTUP_TRAY_ID = 'startup-notify';

/**
 * StartupNotifier (#118) — fires the active culture's `startupNotification`
 * as a tray balloon shortly after the desktop appears, emanating from a
 * persistent tray icon.
 *
 * Replaces the old hardcoded, zh-only `AntivirusPopup`: the 360 Safe Guard
 * reminder now lives in the zh culture package, so any culture can declare a
 * startup balloon (with an optional persistent tray icon + click target) or
 * none — without a language guard here. Rendered by Desktop so it only fires
 * on the desktop. Renders nothing itself.
 */
const StartupNotifier: React.FC = () => {
  const { t } = useTranslation();
  const { culture } = useCulture();
  const { notify, register, unregister } = useTray();
  const { openWindow } = useWindowManager();
  const firedForCulture = useRef<string | null>(null);

  const startup = culture.startupNotification;

  const openApp = useCallback(
    (appId?: string) => {
      if (!appId) return;
      const def = APP_REGISTRY[appId];
      if (!def) return;
      openWindow(appId, def.name ?? appId, def.restore({}), def.icon, {
        ...(def.window ?? {}),
        componentProps: {},
      });
    },
    [openWindow]
  );

  // Keep a persistent tray icon for cultures that declare one, so the balloon
  // has a real icon to point at (and a click target), XP-style.
  useEffect(() => {
    if (!startup?.trayIcon) return undefined;
    const title = startup.titleKey ? t(startup.titleKey) : (startup.title ?? '');
    register(STARTUP_TRAY_ID, {
      icon: startup.trayIcon,
      tooltip: title,
      order: 40,
      onClick: () => openApp(startup.app),
    });
    return () => unregister(STARTUP_TRAY_ID);
  }, [startup, t, register, unregister, openApp]);

  // Pop the balloon once per culture (a mid-session language switch re-arms it).
  useEffect(() => {
    if (!startup) return undefined;
    if (firedForCulture.current === culture.id) return undefined;
    firedForCulture.current = culture.id;

    const timer = setTimeout(() => {
      notify({
        icon: startup.icon,
        title: startup.titleKey ? t(startup.titleKey) : (startup.title ?? ''),
        body: startup.bodyKey ? t(startup.bodyKey) : startup.body,
        timeout: startup.timeout,
        anchorId: startup.trayIcon ? STARTUP_TRAY_ID : undefined,
        onClick: startup.app ? () => openApp(startup.app) : undefined,
      });
    }, startup.delay ?? 3000);

    return () => clearTimeout(timer);
  }, [startup, culture.id, notify, t, openApp]);

  return null;
};

export default StartupNotifier;
