import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useUserSession } from './context/UserSessionContext';
import { ModalProvider } from './context/ModalContext';
import LoginScreen from './components/LoginScreen';
import Desktop from './components/Desktop';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

function App() {
  const { isLoggedIn } = useUserSession();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <ModalProvider>
      <Container>
        {isLoggedIn ? <Desktop /> : <LoginScreen />}
      </Container>
    </ModalProvider>
  );
}

export default App;
