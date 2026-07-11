import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCulture } from '../context/CultureContext';
import { useTray } from '../context/TrayContext';

/**
 * StartupNotifier (#118) — fires the active culture's `startupNotification`
 * as a tray balloon shortly after the desktop appears.
 *
 * Replaces the old hardcoded, zh-only `AntivirusPopup`: the 360 Safe Guard
 * reminder now lives in the zh culture package, so any culture can declare a
 * startup balloon (or none) without a language guard here. Rendered by Desktop
 * so it only fires once the user is on the desktop. Renders nothing itself.
 */
const StartupNotifier: React.FC = () => {
  const { t } = useTranslation();
  const { culture } = useCulture();
  const { notify } = useTray();
  const firedForCulture = useRef<string | null>(null);

  const startup = culture.startupNotification;

  useEffect(() => {
    if (!startup) return undefined;
    // Fire at most once per culture (a mid-session language switch re-arms it).
    if (firedForCulture.current === culture.id) return undefined;
    firedForCulture.current = culture.id;

    const timer = setTimeout(() => {
      notify({
        icon: startup.icon,
        title: startup.titleKey ? t(startup.titleKey) : (startup.title ?? ''),
        body: startup.bodyKey ? t(startup.bodyKey) : startup.body,
        timeout: startup.timeout,
      });
    }, startup.delay ?? 3000);

    return () => clearTimeout(timer);
  }, [startup, culture.id, notify, t]);

  return null;
};

export default StartupNotifier;
