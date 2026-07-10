import React, { useEffect } from 'react';
import styled from 'styled-components';
import { sounds } from '../utils/soundManager';
import primaryLogo from '../assets/images/bios__primary_logo.png';
import loadingBar from '../assets/images/bios__loading_bar.gif';
import copyright from '../assets/images/bios__copyright.png';
import secondaryLogo from '../assets/images/bios__secondary_logo.png';

interface BootScreenProps {
  onComplete: () => void;
}

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000000;
  display: flex;
  flex-direction: column;
  z-index: 99999;
  cursor: none;
  user-select: none;
  padding: 48px;
  box-sizing: border-box;
`;

const LogoArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 7;
  gap: 40px;
`;

const PrimaryLogo = styled.img`
  width: 200px;
  height: auto;
  display: block;
`;

const LoadingBar = styled.img`
  width: 150px;
  height: auto;
  display: block;
`;

const MetaArea = styled.div`
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const Copyright = styled.img`
  width: 200px;
  height: auto;
  display: block;
`;

const SecondaryLogo = styled.img`
  width: 75px;
  height: auto;
  display: block;
  margin-bottom: 2px;
`;

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Attempt to play the authentic Windows XP startup sound.
    // Browsers may block autoplay until the user has interacted with the page.
    const soundTimer = setTimeout(() => {
      sounds.startup();
    }, 300);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(soundTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <Container>
      <LogoArea>
        <PrimaryLogo src={primaryLogo} alt="Microsoft Windows XP" />
        <LoadingBar src={loadingBar} alt="Loading" />
      </LogoArea>
      <MetaArea>
        <Copyright src={copyright} alt="Copyright" />
        <SecondaryLogo src={secondaryLogo} alt="Microsoft" />
      </MetaArea>
    </Container>
  );
};

export default BootScreen;
