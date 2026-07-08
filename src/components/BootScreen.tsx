import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

interface BootScreenProps {
  onComplete: () => void;
}

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: black;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
  cursor: none;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 50px;
`;

const WindowsLogo = styled.div`
  width: 80px;
  height: 80px;
  margin-right: 15px;
  position: relative;

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

const LogoText = styled.div`
  color: white;
  display: flex;
  flex-direction: column;
`;

const Microsoft = styled.span`
  font-size: 18px;
  font-weight: bold;
`;

const WindowsXP = styled.span`
  font-size: 42px;
  font-weight: 900;
  line-height: 1;

  span {
    color: #f35325;
    font-size: 24px;
    vertical-align: top;
    margin-left: 5px;
  }
`;

const ProgressBarContainer = styled.div`
  width: 200px;
  height: 15px;
  border: 2px solid #555;
  border-radius: 0;
  padding: 2px;
  position: relative;
  background: transparent;
  overflow: hidden;
`;

const move = keyframes`
  0% { left: -30%; }
  100% { left: 100%; }
`;

const ProgressBlocks = styled.div`
  position: absolute;
  top: 2px;
  left: 0;
  height: 11px;
  width: 50px; /* Width of the group of 3 blocks */
  display: flex;
  gap: 2px;
  animation: ${move} 2s linear infinite;

  div {
    width: 15px;
    height: 100%;
    background: linear-gradient(to bottom, #2d58cc 0%, #76a0f0 30%, #2d58cc 100%);
    border-radius: 0;
    box-shadow: 0 0 2px #2d58cc;
  }
`;

const Copyright = styled.div`
    position: absolute;
    bottom: 20px;
    left: 20px;
    color: white;
    font-size: 12px;
    font-family: Arial, sans-serif;
`;

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Simulate boot time
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Container>
      <LogoContainer>
        {/* Windows XP wavy flag logo */}
        <WindowsLogo>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M5,10 C25,5 45,5 65,12 L65,45 C45,40 25,40 5,45 Z" fill="#f35325" />
            <path d="M70,13 C80,16 90,18 95,22 L95,48 C90,45 80,43 70,42 Z" fill="#81bc06" />
            <path d="M5,50 C25,45 45,45 65,50 L65,88 C45,82 25,82 5,88 Z" fill="#05a6f0" />
            <path d="M70,51 C80,50 90,48 95,46 L95,84 C90,87 80,89 70,90 Z" fill="#ffba08" />
          </svg>
        </WindowsLogo>
        <LogoText>
          <Microsoft>Microsoft</Microsoft>
          <WindowsXP>Windows<span>XP</span></WindowsXP>
        </LogoText>
      </LogoContainer>

      <ProgressBarContainer>
        <ProgressBlocks>
          <div></div>
          <div></div>
          <div></div>
        </ProgressBlocks>
      </ProgressBarContainer>

      <Copyright>
          Copyright © Microsoft Corporation
      </Copyright>
    </Container>
  );
};

export default BootScreen;
