import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

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

  &::before, &::after, span::before, span::after {
    content: '';
    position: absolute;
    width: 38px;
    height: 38px;
    border-radius: 2px;
  }

  &::before {
    top: 0;
    left: 0;
    background-color: #f35325; /* Red */
  }
  &::after {
    top: 0;
    right: 0;
    background-color: #81bc06; /* Green */
  }
  span::before {
    bottom: 0;
    left: 0;
    background-color: #05a6f0; /* Blue */
  }
  span::after {
    bottom: 0;
    right: 0;
    background-color: #ffba08; /* Yellow */
  }

  /* Make it wavy/flag like simple transform */
  transform: skew(-10deg) rotate(-5deg);
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
  border-radius: 3px;
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
    border-radius: 1px;
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

const BootScreen = ({ onComplete }) => {
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
        {/* Simple CSS representation of Windows Flag */}
        <WindowsLogo><span></span></WindowsLogo>
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
