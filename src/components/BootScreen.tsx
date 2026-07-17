import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { sounds, playCustomSound } from '../utils/soundManager';
import type { BootBranding } from '../branding';
import primaryLogo from '../assets/images/bios__primary_logo.png';
import loadingBar from '../assets/images/bios__loading_bar.gif';
import copyright from '../assets/images/bios__copyright.png';
import secondaryLogo from '../assets/images/bios__secondary_logo.png';
import { resolveOSTheme } from '../themes/useOSTheme';

interface BootScreenProps {
  onComplete: () => void;
  branding?: BootBranding;
}

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
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

const BootText = styled.div`
  color: white;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.BOOT};
  font-size: 28px;
  letter-spacing: 0.5px;
  text-align: center;
`;

const slide = keyframes`
  0% { left: -40%; }
  100% { left: 100%; }
`;

// A branded indeterminate bar used when `progressColor` is set (the default XP
// GIF can't be recolored). Kept in the same 150px footprint as the GIF.
const ProgressTrack = styled.div`
  position: relative;
  width: 150px;
  height: 14px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $color: string }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40%;
  background: ${props => props.$color};
  animation: ${slide} 1.6s linear infinite;
`;

const BootScreen: React.FC<BootScreenProps> = ({ onComplete, branding }) => {
  const branded = !!(
    branding &&
    (branding.logo || branding.text || branding.progressColor || branding.startupSound)
  );

  useEffect(() => {
    // Attempt to play the startup sound (custom when branded, else the XP chime).
    // Browsers may block autoplay until the user has interacted with the page.
    const soundTimer = setTimeout(() => {
      if (branding?.startupSound) playCustomSound(branding.startupSound);
      else sounds.startup();
    }, 300);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(soundTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, branding]);

  return (
    <Container className="xp-hide-cursor" data-testid="boot-screen">
      <LogoArea>
        {branding?.logo ? (
          <PrimaryLogo src={branding.logo} alt={branding.text || 'Logo'} />
        ) : branded ? null : (
          <PrimaryLogo src={primaryLogo} alt="Microsoft Windows XP" />
        )}
        {branding?.text && <BootText>{branding.text}</BootText>}
        {branding?.progressColor ? (
          <ProgressTrack aria-label="Loading">
            <ProgressFill $color={branding.progressColor} />
          </ProgressTrack>
        ) : (
          <LoadingBar src={loadingBar} alt="Loading" />
        )}
      </LogoArea>
      {/* Suppress the Microsoft copyright/logo once any branding is applied. */}
      {!branded && (
        <MetaArea>
          <Copyright src={copyright} alt="Copyright" />
          <SecondaryLogo src={secondaryLogo} alt="Microsoft" />
        </MetaArea>
      )}
    </Container>
  );
};

export default BootScreen;
