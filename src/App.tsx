import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useUserSession } from './context/UserSessionContext';
import { useWindowManager } from './context/WindowManagerContext';
import { ModalProvider } from './context/ModalContext';
import LoginScreen from './components/LoginScreen';
import Desktop from './components/Desktop';
import BootScreen from './components/BootScreen';
import XPIcon from './components/XPIcon';
import windowsIcon from './assets/icons/windows.svg';

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
  filter: drop-shadow(0 0 15px rgba(0, 120, 215, 0.6));
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
  background: rgba(0, 0, 50, 0.88);
  border: 2px solid #5a8adf;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 999999;
  min-width: 300px;
`;

const AltTabTitle = styled.div`
  color: white;
  font-size: 12px;
  font-family: Tahoma, sans-serif;
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
  border-radius: 4px;
  border: 2px solid ${props => props.$active ? '#fff' : 'transparent'};
  background: ${props => props.$active ? 'rgba(255,255,255,0.2)' : 'transparent'};
  cursor: pointer;
  min-width: 60px;

  span {
    color: white;
    font-size: 10px;
    font-family: Tahoma, sans-serif;
    text-align: center;
    max-width: 70px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

type BootPhase = 'BOOTING' | 'RUNNING' | 'SCREENSAVER';

const getInitialBootPhase = (): BootPhase => {
  const firstBootDone = localStorage.getItem('xp_first_boot_done');
  const powerState = localStorage.getItem('xp_power_state');

  if (!firstBootDone || powerState === 'shutdown' || powerState === 'restart' || powerState === 'logout') {
    return 'BOOTING';
  }

  if (localStorage.getItem('xp_logged_in') === 'true') {
    return 'SCREENSAVER';
  }

  return 'RUNNING';
};

function App() {
  const { isLoggedIn } = useUserSession();
  const { windows, activeWindowId, closeWindow, focusWindow } = useWindowManager();
  const [bootPhase, setBootPhase] = useState<BootPhase>(getInitialBootPhase);
  const [screenSaverFading, setScreenSaverFading] = useState(false);
  const [altTabVisible, setAltTabVisible] = useState(false);
  const [altTabIndex, setAltTabIndex] = useState(0);

  // One-time setup: context menu block + easter egg
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!e.defaultPrevented) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);

    const art = `
 __          __ _             _                     _____                    _  _
 \\ \\        / /(_)           | |                   / ____|                  (_)| |
  \\ \\  /\\  / /  _  _ __    __| |  ___ __      __  | (___    ___   ___  _   _  _ __  _  _
   \\ \\/  \\/ /  | || '_ \\  / _\` | / _ \\\\ \\ /\\ / /   \\___ \\  / _ \\ / __|| | | || '__|| || |_
    \\  /\\  /   | || | | || (_| || (_) |\\ V  V /    ____) ||  __/| (__ | |_| || |   | || |_
     \\/  \\/    |_||_| |_| \\__,_| \\___/  \\_/\\_/    |_____/  \\___| \\___| \\__,_||_|   |_| \\__|
      `;
    console.log(`%c${art}`, 'color: #0080ff; font-weight: bold; font-family: monospace;');
    console.log('%c Windows Security Center detected an intrusion attempt', 'color: red; font-size: 24px; font-weight: bold; background: #ffff00; padding: 10px; border: 2px solid red; border-radius: 5px;');
    console.log('%c Warning: System is monitoring your activities.', 'font-size: 16px; color: #333;');

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Keyboard shortcuts: re-register when window state changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [activeWindowId, altTabVisible, altTabIndex, windows, closeWindow, focusWindow]);

  const dismissScreenSaver = useCallback(() => {
    if (bootPhase === 'SCREENSAVER' && !screenSaverFading) {
      setScreenSaverFading(true);
      setTimeout(() => {
        setBootPhase('RUNNING');
        setScreenSaverFading(false);
      }, 500);
    }
  }, [bootPhase, screenSaverFading]);

  const handleBootComplete = () => {
    localStorage.setItem('xp_first_boot_done', 'true');
    localStorage.setItem('xp_power_state', 'running');
    setBootPhase('RUNNING');
  };

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
        <ScreenSaverHint>Click or press any key to continue...</ScreenSaverHint>
      </ScreenSaverContainer>
    );
  }

  return (
    <ModalProvider>
      <Container>
        {bootPhase === 'BOOTING' ? (
          <BootScreen onComplete={handleBootComplete} />
        ) : (
          isLoggedIn ? <Desktop /> : <LoginScreen />
        )}
        {altTabVisible && windows.length > 0 && (
          <AltTabOverlay>
            <AltTabTitle>切换窗口</AltTabTitle>
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
    </ModalProvider>
  );
}

export default App;
