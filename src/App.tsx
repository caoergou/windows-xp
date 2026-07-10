import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { useUserSession } from './context/UserSessionContext';
import { useWindowManager } from './context/WindowManagerContext';
import LoginScreen from './components/LoginScreen';
import Desktop from './components/Desktop';
import BootScreen from './components/BootScreen';
import BsodScreen from './components/BsodScreen';
import XPIcon from './components/XPIcon';
import MobileWarning from './components/MobileWarning';
import windowsIcon from './assets/icons/windows.svg';
import { TIME } from './constants';
import { safeLocalStorage, getStorageKey, canUseDOM } from './utils/storage';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

const floatAnimation = keyframes`
  0% { transform: translate(0, 0); }
  25% { transform: translate(10vw, -5vh); }
  50% { transform: translate(-5vw, 10vh); }
  75% { transform: translate(-10vw, -8vh); }
  100% { transform: translate(0, 0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const ScreenSaverContainer = styled.div<{ $fading: boolean }>`
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  animation: ${props => props.$fading ? fadeOut : 'none'} 0.5s ease-out forwards;
`;

const FloatingLogo = styled.img`
  width: 128px;
  height: 128px;
  animation: ${floatAnimation} 12s ease-in-out infinite;
  user-select: none;
`;

const ScreenSaverHint = styled.div`
  position: absolute;
  bottom: 40px;
  color: #555;
  font-size: 13px;
  font-family: 'Courier New', monospace;
`;

const AltTabOverlay = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #ece9d8;
  border: 1px solid #003c74;
  box-shadow: 2px 2px 0 #808080;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 999999;
  min-width: 300px;
  max-width: 90vw;
`;

const AltTabTitle = styled.div`
  color: #000;
  font-size: 11px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
`;

const AltTabItems = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const AltTabItem = styled.div<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: 2px solid ${props => props.$active ? '#316AC5' : 'transparent'};
  background: ${props => props.$active ? '#e5e5e5' : 'transparent'};
  cursor: pointer;
  min-width: 70px;

  span {
    color: #000;
    font-size: 11px;
    font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
    text-align: center;
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

type BootPhase = 'BOOTING' | 'RUNNING' | 'SCREENSAVER';

const getInitialBootPhase = (skipBoot?: boolean): BootPhase => {
  if (skipBoot) return 'RUNNING';

  const firstBootDone = safeLocalStorage.getItem(getStorageKey('first_boot_done'));
  const powerState = safeLocalStorage.getItem(getStorageKey('power_state'));

  if (!firstBootDone || powerState === 'shutdown' || powerState === 'restart' || powerState === 'logout') {
    return 'BOOTING';
  }

  if (safeLocalStorage.getItem(getStorageKey('logged_in')) === 'true') {
    return 'SCREENSAVER';
  }

  return 'RUNNING';
};

export interface AppProps {
  initialLanguage?: 'en' | 'zh';
  skipBoot?: boolean;
  disableContextMenuBlock?: boolean;
  disableDevToolsBlock?: boolean;
  disableScreenSaver?: boolean;
}

function App({
  initialLanguage,
  skipBoot,
  disableContextMenuBlock,
  disableDevToolsBlock,
  disableScreenSaver,
}: AppProps = {}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (initialLanguage && i18n.language !== initialLanguage) {
      i18n.changeLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  const { isLoggedIn, screensaverEnabled } = useUserSession();
  const { windows, activeWindowId, closeWindow, focusWindow } = useWindowManager();
  const [bootPhase, setBootPhase] = useState<BootPhase>(() => getInitialBootPhase(skipBoot));
  const [screenSaverFading, setScreenSaverFading] = useState(false);
  const [altTabVisible, setAltTabVisible] = useState(false);
  const [altTabIndex, setAltTabIndex] = useState(0);
  const [bsodVisible, setBsodVisible] = useState(false);

  // Context menu block (can be disabled for embedded usage)
  useEffect(() => {
    if (disableContextMenuBlock || !canUseDOM) return undefined;

    const handleContextMenu = (e: MouseEvent) => {
      if (!e.defaultPrevented) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [disableContextMenuBlock]);

  // Keyboard shortcuts and dev-tools block
  useEffect(() => {
    if (!canUseDOM) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!disableDevToolsBlock) {
        if (e.key === 'F12' || e.code === 'F12') {
          e.preventDefault();
          e.stopPropagation();
        }
        if (e.ctrlKey && e.shiftKey && ['KeyI', 'KeyJ', 'KeyC'].includes(e.code)) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (e.ctrlKey && e.code === 'KeyU') {
          e.preventDefault();
          e.stopPropagation();
        }
      }
      // Alt+F4: close focused window
      if (e.altKey && e.key === 'F4' && activeWindowId) {
        e.preventDefault();
        closeWindow(activeWindowId);
      }
      // Alt+Tab: show/cycle switcher
      if (e.altKey && e.key === 'Tab' && windows.length > 0) {
        e.preventDefault();
        if (!altTabVisible) {
          setAltTabVisible(true);
          const currentIdx = windows.findIndex(w => w.id === activeWindowId);
          setAltTabIndex((currentIdx + 1) % windows.length);
        } else {
          setAltTabIndex(prev => (prev + 1) % windows.length);
        }
      }
      // BSOD easter egg: Ctrl+Shift+Alt+B
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setBsodVisible(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && altTabVisible) {
        const target = windows[altTabIndex];
        if (target) focusWindow(target.id);
        setAltTabVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeWindowId, altTabVisible, altTabIndex, windows, closeWindow, focusWindow, disableDevToolsBlock]);

  const dismissScreenSaver = useCallback(() => {
    if (bootPhase === 'SCREENSAVER' && !screenSaverFading) {
      setScreenSaverFading(true);
      setTimeout(() => {
        setBootPhase('RUNNING');
        setScreenSaverFading(false);
      }, 500);
    }
  }, [bootPhase, screenSaverFading]);

  // Idle detection: trigger screensaver after timeout
  useEffect(() => {
    if (disableScreenSaver || !screensaverEnabled || bootPhase !== 'RUNNING' || !isLoggedIn || !canUseDOM) return undefined;

    let timeoutId: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setBootPhase('SCREENSAVER');
      }, TIME.SCREENSAVER_TIMEOUT);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [bootPhase, isLoggedIn, disableScreenSaver, screensaverEnabled]);

  const handleBootComplete = () => {
    safeLocalStorage.setItem(getStorageKey('first_boot_done'), 'true');
    safeLocalStorage.setItem(getStorageKey('power_state'), 'running');
    setBootPhase('RUNNING');
  };

  if (bsodVisible) {
    return <BsodScreen onClick={() => setBsodVisible(false)} />;
  }

  if (bootPhase === 'SCREENSAVER') {
    return (
      <ScreenSaverContainer
        $fading={screenSaverFading}
        onClick={dismissScreenSaver}
        onKeyDown={dismissScreenSaver}
        tabIndex={0}
        autoFocus
      >
        <FloatingLogo src={windowsIcon} alt="Windows XP" draggable={false} />
        <ScreenSaverHint>{t('screensaver.dismissHint')}</ScreenSaverHint>
      </ScreenSaverContainer>
    );
  }

  return (
    <Container>
      <MobileWarning />
      {bootPhase === 'BOOTING' ? (
        <BootScreen onComplete={handleBootComplete} />
      ) : (
        isLoggedIn ? <Desktop /> : <LoginScreen />
      )}
      {altTabVisible && windows.length > 0 && (
        <AltTabOverlay>
          <AltTabTitle>{t('altTab.switchWindow', '切换窗口')}</AltTabTitle>
          <AltTabItems>
            {windows.map((win, idx) => (
              <AltTabItem
                key={win.id}
                $active={idx === altTabIndex}
                onClick={() => {
                  focusWindow(win.id);
                  setAltTabVisible(false);
                }}
              >
                <XPIcon name={win.icon || 'app_window'} size={32} />
                <span>{win.title}</span>
              </AltTabItem>
            ))}
          </AltTabItems>
          {windows[altTabIndex] && (
            <AltTabTitle>{windows[altTabIndex].title}</AltTabTitle>
          )}
        </AltTabOverlay>
      )}
    </Container>
  );
}

export default App;
