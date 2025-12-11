import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useUserSession } from './context/UserSessionContext';
import { ModalProvider } from './context/ModalContext';
import LoginScreen from './components/LoginScreen';
import Desktop from './components/Desktop';
import BootScreen from './components/BootScreen';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

function App() {
  const { isLoggedIn } = useUserSession();
  const [bootPhase, setBootPhase] = useState('CHECKING'); // CHECKING, BOOTING, RUNNING

  useEffect(() => {
    const handleKeyDown = (e) => {
      // F12
      if (e.key === 'F12' || e.code === 'F12') {
        e.preventDefault();
        e.stopPropagation();
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if (e.ctrlKey && e.shiftKey && ['KeyI', 'KeyJ', 'KeyC'].includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.code === 'KeyU') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
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
        '%c windows 安全防护中心发现入侵请求',
        'color: red; font-size: 24px; font-weight: bold; background: #ffff00; padding: 10px; border: 2px solid red; border-radius: 5px;'
      );
      console.log('%c 警告：系统正在监控您的操作。', 'font-size: 16px; color: #333;');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    showEasterEgg();

    // Check boot status
    const checkBoot = () => {
        const firstBootDone = localStorage.getItem('xp_first_boot_done');
        const powerState = localStorage.getItem('xp_power_state');

        if (!firstBootDone) {
            setBootPhase('BOOTING');
        } else if (powerState === 'shutdown' || powerState === 'restart') {
            setBootPhase('BOOTING');
        } else {
            setBootPhase('RUNNING');
        }
    };
    checkBoot();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const handleBootComplete = () => {
      localStorage.setItem('xp_first_boot_done', 'true');
      localStorage.setItem('xp_power_state', 'running');
      setBootPhase('RUNNING');
  };

  if (bootPhase === 'CHECKING') return null; // Or a black screen

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
