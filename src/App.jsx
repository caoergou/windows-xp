import React from 'react';
import styled from 'styled-components';
import { useUserSession } from './context/UserSessionContext';
import LoginScreen from './components/LoginScreen';
import Desktop from './components/Desktop';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

function App() {
  const { isLoggedIn } = useUserSession();

  return (
    <Container>
      {isLoggedIn ? <Desktop /> : <LoginScreen />}
    </Container>
  );
}

export default App;
