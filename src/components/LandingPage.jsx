import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

const LANDING_STORAGE_KEY = 'shanyue_has_visited';
const GAME_STARTED_KEY = 'xp_first_boot_done';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const flicker = keyframes`
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.3; }
  94% { opacity: 1; }
  96% { opacity: 0.5; }
  97% { opacity: 1; }
`;

const cursorBlink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const scanline = keyframes`
  0% { top: -100%; }
  100% { top: 100%; }
`;

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(170deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  overflow: hidden;
  animation: ${fadeIn} 1s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.15) 2px,
      rgba(0, 0, 0, 0.15) 4px
    );
    pointer-events: none;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 200%;
    top: -100%;
    left: 0;
    background: linear-gradient(
      transparent 0%,
      rgba(255, 255, 255, 0.02) 50%,
      transparent 100%
    );
    animation: ${scanline} 8s linear infinite;
    pointer-events: none;
    z-index: 1;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  padding: 0 30px;
  text-align: center;
`;

const Title = styled.h1`
  font-family: 'SimSun', 'STSong', serif;
  font-size: 48px;
  font-weight: 400;
  color: #f0f0f0;
  letter-spacing: 16px;
  margin: 0 0 12px 0;
  animation: ${fadeInUp} 1.2s ease-out 0.3s both;

  @media (max-width: 768px) {
    font-size: 36px;
    letter-spacing: 10px;
  }
`;

const Subtitle = styled.div`
  font-family: 'Tahoma', 'Microsoft YaHei', sans-serif;
  font-size: 13px;
  color: #8899aa;
  letter-spacing: 4px;
  margin-bottom: 50px;
  animation: ${fadeInUp} 1.2s ease-out 0.6s both;
`;

const Divider = styled.div`
  width: 40px;
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
  margin-bottom: 40px;
  animation: ${fadeInUp} 1.2s ease-out 0.8s both;
`;

const Narrative = styled.div`
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  color: #b0bec5;
  line-height: 2;
  margin-bottom: 50px;
  animation: ${fadeInUp} 1.2s ease-out 1s both;
  max-width: 420px;

  p {
    margin: 0 0 8px 0;
  }
`;

const MobileWarning = styled.div`
  font-family: 'Tahoma', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  color: #e0a050;
  background: rgba(224, 160, 80, 0.1);
  border: 1px solid rgba(224, 160, 80, 0.25);
  padding: 10px 20px;
  margin-bottom: 30px;
  animation: ${fadeInUp} 1.2s ease-out 1.1s both;
  display: none;

  @media (max-width: 768px), (pointer: coarse) {
    display: block;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: ${fadeInUp} 1.2s ease-out 1.2s both;
`;

const StartButton = styled.button`
  font-family: 'Tahoma', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  color: #dde;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 48px;
  cursor: pointer;
  letter-spacing: 4px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover::after {
    left: 100%;
  }
`;

const ContinueHint = styled.div`
  font-family: 'Tahoma', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  color: #7a8a9a;
  animation: ${flicker} 4s ease-in-out infinite;
`;

const BottomInfo = styled.div`
  position: absolute;
  bottom: 30px;
  font-family: 'Tahoma', sans-serif;
  font-size: 11px;
  color: #6a7a8a;
  letter-spacing: 1px;
  z-index: 2;
  animation: ${fadeIn} 1s ease-out 2s both;
`;

const TypewriterText = ({ text, delay = 0, speed = 60, onComplete }) => {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) {
      setDone(true);
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [started, displayed, text, speed, onComplete]);

  if (!started) return null;

  return (
    <span>
      {displayed}
      {!done && <Cursor>|</Cursor>}
    </span>
  );
};

const Cursor = styled.span`
  animation: ${cursorBlink} 0.8s step-end infinite;
  color: #8899aa;
`;

const LandingPage = ({ onEnter }) => {
  const hasVisited = localStorage.getItem(LANDING_STORAGE_KEY) === 'true';
  const hasGameProgress = localStorage.getItem(GAME_STARTED_KEY) === 'true';
  const isReturning = hasVisited && hasGameProgress;

  const handleEnter = () => {
    localStorage.setItem(LANDING_STORAGE_KEY, 'true');
    onEnter();
  };

  return (
    <Container>
      <Content>
        <Title>山月无声</Title>
        <Subtitle>SILENT MOUNTAIN MOON</Subtitle>
        <Divider />
        <Narrative>
          <p>2026年。父亲去世后，你在旧物中发现了一台尘封的电脑。</p>
          <p>十年前的文件、聊天记录、被加密的日志......</p>
          <p>那些被刻意遗忘的，正在等你打开。</p>
        </Narrative>
        <MobileWarning>
          本游戏模拟桌面操作系统，建议使用电脑浏览器访问以获得完整体验
        </MobileWarning>
        <ButtonGroup>
          <StartButton onClick={handleEnter}>
            {isReturning ? '继续调查' : '开启电脑'}
          </StartButton>
          {isReturning && (
            <ContinueHint>检测到未完成的调查记录</ContinueHint>
          )}
        </ButtonGroup>
      </Content>
      <BottomInfo>
        <TypewriterText
          text="一款社会派悬疑解谜游戏 / 预计游戏时长 3-4 小时"
          delay={2500}
          speed={50}
        />
      </BottomInfo>
    </Container>
  );
};

export default LandingPage;
