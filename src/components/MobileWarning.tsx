import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { XPButton } from './XPButton';
import { useStorage } from '../context/StorageContext';
import { COLORS, FONTS } from '../constants';

/**
 * Touch onboarding hint (#125).
 *
 * Touch is now a first-class input (tap = click, double-tap = open, long-press =
 * context menu, drag windows by the title bar), so this is no longer a blocking
 * "desktop recommended" wall. On a touch device it shows once — a small,
 * dismissible hint explaining the gestures — then never again for that instance
 * (the dismissal is persisted per `storagePrefix`).
 */

const HINT_KEY = 'touch_hint_seen';

const HintBar = styled.div`
  position: fixed;
  left: 50%;
  bottom: 46px;
  transform: translateX(-50%);
  z-index: 999998;
  max-width: min(92vw, 420px);
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  box-sizing: border-box;
  background: ${COLORS.SURFACE};
  border: 1px solid ${COLORS.BUTTON_SHADOW};
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  font-family: ${FONTS.UI};
  animation: touchHintIn 0.28s ease-out;

  @keyframes touchHintIn {
    from {
      opacity: 0;
      transform: translate(-50%, 12px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
`;

const HintText = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 12px;
    margin-bottom: 3px;
  }

  p {
    margin: 0;
    font-size: 11px;
    line-height: 1.5;
  }
`;

const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    ((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints ?? 0) > 0);

const MobileWarning: React.FC = () => {
  const { t } = useTranslation();
  const storage = useStorage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isTouchDevice()) return;
    try {
      if (storage.local.getItem(storage.key(HINT_KEY))) return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, [storage]);

  const dismiss = () => {
    setVisible(false);
    try {
      storage.local.setItem(storage.key(HINT_KEY), '1');
    } catch {
      /* ignore */
    }
  };

  if (!visible) return null;

  return (
    <HintBar className="windows-xp-portal" data-testid="touch-hint" role="status">
      <XPIcon name="help" size={28} />
      <HintText>
        <strong>{t('mobileWarning.title')}</strong>
        <p>{t('mobileWarning.message')}</p>
      </HintText>
      <XPButton onClick={dismiss} data-testid="touch-hint-dismiss">
        {t('mobileWarning.gotIt')}
      </XPButton>
    </HintBar>
  );
};

export default MobileWarning;
