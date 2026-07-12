import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { useUserSession } from './context/UserSessionContext';
import { useWindowManager } from './context/WindowManagerContext';
import { useShortcut } from './context/KeymapContext';
import LoginScreen from './components/LoginScreen';
import Desktop from './components/Desktop';
import BootScreen from './components/BootScreen';
import BsodScreen from './components/BsodScreen';
import XPIcon from './components/XPIcon';
import windowsIcon from './assets/icons/windows.svg';
import { TIME } from './constants';
import { canUseDOM, STORAGE_ERROR_EVENT, type Storage } from './utils/storage';
import { useStorage } from './context/StorageContext';
import { BSOD_EVENT } from './utils/easterEggs';
import { FS_NOTICE_EVENT } from './context/FileSystemContext/hooks/useFileOperations';
import type { FsNoticeDetail } from './context/FileSystemContext/hooks/useFileOperations';
import { useModal } from './context/ModalContext';
import { useXPEventBus } from './context/EventBusContext';
import { getSavedLanguage } from './utils/language';
import type { BootBranding, LoginBranding } from './branding';

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
  animation: ${props => (props.$fading ? fadeOut : 'none')} 0.5s ease-out forwards;
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
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
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
  border: 2px solid ${props => (props.$active ? '#316AC5' : 'transparent')};
  background: ${props => (props.$active ? '#e5e5e5' : 'transparent')};
  cursor: pointer;
  min-width: 70px;

  span {
    color: #000;
    font-size: 11px;
    font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
    text-align: center;
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

type BootPhase = 'BOOTING' | 'RUNNING' | 'SCREENSAVER';

const getInitialBootPhase = (storage: Storage, skipBoot?: boolean): BootPhase => {
  if (skipBoot) return 'RUNNING';

  const firstBootDone = storage.local.getItem(storage.key('first_boot_done'));
  const powerState = storage.local.getItem(storage.key('power_state'));

  if (
    !firstBootDone ||
    powerState === 'shutdown' ||
    powerState === 'restart' ||
    powerState === 'logout'
  ) {
    return 'BOOTING';
  }

  if (storage.local.getItem(storage.key('logged_in')) === 'true') {
    return 'SCREENSAVER';
  }

  return 'RUNNING';
};

export interface AppProps {
  initialLanguage?: string;
  skipBoot?: boolean;
  disableContextMenuBlock?: boolean;
  disableDevToolsBlock?: boolean;
  disableScreenSaver?: boolean;
  /** Boot-screen branding (#139). */
  boot?: BootBranding;
  /** Login-screen branding (#139). */
  login?: LoginBranding;
}

function App({
  initialLanguage,
  skipBoot,
  disableContextMenuBlock,
  disableDevToolsBlock,
  disableScreenSaver,
  boot,
  login,
}: AppProps = {}) {
  const { t } = useTranslation();
  const { dialog } = useModal();
  const bus = useXPEventBus();
  const storage = useStorage();

  // Surface persistence problems as XP dialogs instead of silent console
  // errors (#81): localStorage quota exceeded, recycle-bin restore fallback.
  const bootCompleteEmittedRef = React.useRef(false);
  useEffect(() => {
    if (bootCompleteEmittedRef.current) return;
    if (bootPhase === 'RUNNING' && isLoggedIn) {
      bootCompleteEmittedRef.current = true;
      bus.emit({ type: 'session:boot-complete' });
    }
  });

  useEffect(() => {
    if (!canUseDOM) return;
    const onStorageError = () => {
      void dialog.alert({
        title: t('storage.errorTitle'),
        message: t('storage.quotaExceeded'),
        type: 'warning',
      });
    };
    const onFsNotice = (event: Event) => {
      const detail = (event as CustomEvent<FsNoticeDetail>).detail;
      if (detail?.type === 'restore-fallback') {
        void dialog.alert({
          title: t('recycleBinNotices.restoreFallbackTitle'),
          message: t('recycleBinNotices.restoreFallbackMessage', { name: detail.name }),
          type: 'info',
        });
      }
    };
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    window.addEventListener(FS_NOTICE_EVENT, onFsNotice);
    return () => {
      window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
      window.removeEventListener(FS_NOTICE_EVENT, onFsNotice);
    };
  }, [dialog, t]);

  useEffect(() => {
    const language = getSavedLanguage(initialLanguage || 'en');
    if (i18n.language !== language) i18n.changeLanguage(language);
  }, [initialLanguage]);

  const { isLoggedIn, screensaverEnabled } = useUserSession();
  const { windows, activeWindowId, closeWindow, focusWindow } = useWindowManager();
  const [bootPhase, setBootPhase] = useState<BootPhase>(() => getInitialBootPhase(storage, skipBoot));
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

    // Dev-tools / view-source blocker. Not a user shortcut and gated by
    // `disableDevToolsBlock` (not `disableGlobalShortcuts`), so it stays a
    // dedicated listener rather than a keymap binding. The user-facing shortcuts
    // (Alt+F4 / Alt+Tab / BSOD) are registered via the keymap below (#132).
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disableDevToolsBlock) return;
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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && altTabVisible) {
        const target = windows[altTabIndex];
        if (target) focusWindow(target.id);
        setAltTabVisible(false);
      }
    };

    // CMD `format c:` / Run `bsod` reach the blue screen through this event (#85).
    const handleBsodEvent = () => setBsodVisible(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener(BSOD_EVENT, handleBsodEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener(BSOD_EVENT, handleBsodEvent);
    };
  }, [altTabVisible, altTabIndex, windows, focusWindow, disableDevToolsBlock]);

  // User-facing global shortcuts via the central keymap (#132). Registered here
  // (not as a raw window listener) so they honor `disableGlobalShortcuts` and the
  // host `keymap` prop, and so conflicts are detectable.
  useShortcut(
    { id: 'window.close', combo: 'Alt+F4', scope: 'global', label: 'Close focused window' },
    () => {
      if (activeWindowId) closeWindow(activeWindowId);
    }
  );
  useShortcut(
    { id: 'switcher.next', combo: 'Alt+Tab', scope: 'global', label: 'App switcher' },
    () => {
      if (windows.length === 0) return;
      if (!altTabVisible) {
        setAltTabVisible(true);
        const currentIdx = windows.findIndex(w => w.id === activeWindowId);
        setAltTabIndex((currentIdx + 1) % windows.length);
      } else {
        setAltTabIndex(prev => (prev + 1) % windows.length);
      }
    }
  );
  useShortcut(
    { id: 'egg.bsod', combo: 'Ctrl+Shift+Alt+B', scope: 'global', label: 'Blue Screen of Death' },
    () => setBsodVisible(true)
  );

  const dismissScreenSaver = useCallback(() => {
    if (bootPhase === 'SCREENSAVER' && !screenSaverFading) {
      setScreenSaverFading(true);
      setTimeout(() => {
        setBootPhase('RUNNING');
        setScreenSaverFading(false);
      }, 500);
    }
  }, [bootPhase, screenSaverFading]);

  useEffect(() => {
    if (bootPhase !== 'SCREENSAVER' || !canUseDOM) return undefined;
    window.addEventListener('keydown', dismissScreenSaver);
    return () => window.removeEventListener('keydown', dismissScreenSaver);
  }, [bootPhase, dismissScreenSaver]);

  // Idle detection: trigger screensaver after timeout
  useEffect(() => {
    if (
      disableScreenSaver ||
      !screensaverEnabled ||
      bootPhase !== 'RUNNING' ||
      !isLoggedIn ||
      !canUseDOM
    )
      return undefined;

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

  // Announce screensaver start/stop on the bus (#116). Emitting on enter and
  // cleaning up on leave means the stop always pairs with a preceding start.
  useEffect(() => {
    if (bootPhase !== 'SCREENSAVER') return undefined;
    bus.emit({ type: 'screensaver:start' });
    return () => {
      bus.emit({ type: 'screensaver:stop' });
    };
  }, [bootPhase, bus]);

  const handleBootComplete = () => {
    storage.local.setItem(storage.key('first_boot_done'), 'true');
    storage.local.setItem(storage.key('power_state'), 'running');
    setBootPhase('RUNNING');
  };

  // Clicking the BSOD "reboots" the machine: mark a restart and run the boot
  // sequence again, exactly like a real crash recovery (#85).
  const handleBsodReboot = () => {
    setBsodVisible(false);
    storage.local.setItem(storage.key('power_state'), 'restart');
    setBootPhase('BOOTING');
  };

  if (bsodVisible) {
    return <BsodScreen onClick={handleBsodReboot} />;
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
      {bootPhase === 'BOOTING' ? (
        <BootScreen onComplete={handleBootComplete} branding={boot} />
      ) : isLoggedIn ? (
        <Desktop />
      ) : (
        <LoginScreen branding={login} />
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
          {windows[altTabIndex] && <AltTabTitle>{windows[altTabIndex].title}</AltTabTitle>}
        </AltTabOverlay>
      )}
    </Container>
  );
}

export default App;
