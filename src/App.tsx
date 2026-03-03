import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useUserSession } from './context/UserSessionContext';
import { ModalProvider } from './context/ModalContext';
import LoginScreen from './components/LoginScreen';
import Desktop from './components/Desktop';
import BootScreen from './components/BootScreen';
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
  const [bootPhase, setBootPhase] = useState<BootPhase>(getInitialBootPhase);
  const [screenSaverFading, setScreenSaverFading] = useState(false);

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
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (!e.defaultPrevented) {
        e.preventDefault();
      }
    };

    const showEasterEgg = () => {
      const art = `
 __          __ _             _                     _____                    _  _
 \\ \\        / /(_)           | |                   / ____|                  (_)| |
  \\ \\  /\\  / /  _  _ __    __| |  ___ __      __  | (___    ___   ___  _   _  _ __  _  _
   \\ \\/  \\/ /  | || '_ \\  / _\` | / _ \\\\ \\ /\\ / /   \\___ \\  / _ \\ / __|| | | || '__|| || |_
    \\  /\\  /   | || | | || (_| || (_) |\\ V  V /    ____) ||  __/| (__ | |_| || |   | || |_
     \\/  \\/    |_||_| |_| \\__,_| \\___/  \\_/\\_/    |_____/  \\___| \\___| \\__,_||_|   |_| \\__|
      `;

      console.log(`%c${art}`, 'color: #0080ff; font-weight: bold; font-family: monospace;');
      console.log(
        '%c Windows Security Center detected an intrusion attempt',
        'color: red; font-size: 24px; font-weight: bold; background: #ffff00; padding: 10px; border: 2px solid red; border-radius: 5px;'
      );
      console.log('%c Warning: System is monitoring your activities.', 'font-size: 16px; color: #333;');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    showEasterEgg();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

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
      </Container>
    </ModalProvider>
  );
}

export default App;
