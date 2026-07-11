import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import XPIcon from '../components/XPIcon';

/**
 * Norton AntiVirus — a 2000s-style security shell for the `en` culture package
 * (#123). Original parody artwork/gold theme; no ripped brand assets. A quick
 * scripted "system scan" that reassuringly finds nothing (the western sibling
 * of the zh 360 gag, minus the fake-threat punchline).
 */
const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f6f3e8;
  font-family: 'Tahoma', 'MS Sans Serif', sans-serif;
  font-size: 12px;
  color: #333;
  user-select: none;
  overflow: hidden;
`;
const Header = styled.div`
  background: linear-gradient(to bottom, #ffd24a 0%, #f2a11b 55%, #d98a00 100%);
  border-bottom: 1px solid #a85f00;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  .t {
    font-size: 16px;
    font-weight: bold;
    color: #4a2c00;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  .v {
    font-size: 11px;
    color: #6b4300;
  }
`;
const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 16px;
  text-align: center;
`;
const StatusCard = styled.div<{ $safe?: boolean }>`
  width: 100%;
  max-width: 360px;
  border: 1px solid ${p => (p.$safe ? '#3aa757' : '#d98a00')};
  border-radius: 4px;
  background: ${p => (p.$safe ? '#eafaef' : '#fff8e6')};
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  .msg {
    text-align: left;
    line-height: 1.5;
    .big {
      font-size: 14px;
      font-weight: bold;
      color: ${p => (p.$safe ? '#1c6a34' : '#8a5a00')};
    }
  }
`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const Spinner = styled.div`
  width: 26px;
  height: 26px;
  border: 3px solid #f2d38a;
  border-top-color: #d98a00;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  flex-shrink: 0;
`;
const Bar = styled.div`
  width: 100%;
  max-width: 360px;
  height: 16px;
  border: 1px solid #c9a24a;
  border-radius: 2px;
  background: #fff;
  overflow: hidden;
`;
const Fill = styled.div<{ $v: number }>`
  height: 100%;
  width: ${p => p.$v}%;
  background: linear-gradient(to bottom, #ffd24a, #f2a11b);
  transition: width 0.15s linear;
`;
const ScanLine = styled.div`
  font-size: 11px;
  color: #6b4300;
  height: 14px;
  overflow: hidden;
  white-space: nowrap;
  max-width: 360px;
`;
const Btn = styled.button`
  height: 28px;
  padding: 0 18px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid #a85f00;
  border-radius: 3px;
  color: #4a2c00;
  font-weight: bold;
  background: linear-gradient(to bottom, #ffe38a 0%, #f2a11b 100%);
  &:hover {
    background: linear-gradient(to bottom, #fff0b0 0%, #f7ad33 100%);
  }
  &:active {
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;
const Footer = styled.div`
  border-top: 1px solid #d8cba0;
  background: #efe8d2;
  padding: 4px 10px;
  font-size: 11px;
  color: #6b4300;
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
`;

const SCAN_TARGETS = [
  'C:\\WINDOWS\\system32\\kernel32.dll',
  'C:\\Program Files\\Internet Explorer\\iexplore.exe',
  'C:\\WINDOWS\\system32\\drivers\\etc\\hosts',
  'C:\\Documents and Settings\\Owner\\My Documents',
  'C:\\Program Files\\Winamp\\winamp.exe',
  'C:\\WINDOWS\\Temp\\~DF3A2.tmp',
];

type Phase = 'idle' | 'scanning' | 'done';

const NortonAntiVirus: React.FC<{ windowId?: string }> = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [line, setLine] = useState('');
  const timer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const startScan = useCallback(() => {
    setPhase('scanning');
    setProgress(0);
    clear();
    timer.current = window.setInterval(() => {
      setProgress(prev => {
        const next = prev + 4;
        setLine(`Scanning ${SCAN_TARGETS[Math.floor((next / 100) * SCAN_TARGETS.length) % SCAN_TARGETS.length]}`);
        if (next >= 100) {
          clear();
          setPhase('done');
          setLine('');
          return 100;
        }
        return next;
      });
    }, 120);
  }, [clear]);

  return (
    <Wrap data-testid="norton">
      <Header>
        <XPIcon name="nav" size={36} />
        <div>
          <div className="t">Norton AntiVirus 2005</div>
          <div className="v">Definitions: 2006-11-14 · Auto-Protect ON</div>
        </div>
      </Header>

      <Body>
        {phase === 'idle' && (
          <>
            <StatusCard $safe>
              <XPIcon name="nav" size={40} />
              <div className="msg">
                <div className="big">Your computer is protected</div>
                <div>No full system scan has been run today.</div>
              </div>
            </StatusCard>
            <Btn data-testid="norton-scan" onClick={startScan}>
              Scan Now
            </Btn>
          </>
        )}

        {phase === 'scanning' && (
          <>
            <StatusCard>
              <Spinner />
              <div className="msg">
                <div className="big">Scanning your system…</div>
                <div>Please wait while Norton checks your files.</div>
              </div>
            </StatusCard>
            <Bar>
              <Fill $v={progress} />
            </Bar>
            <ScanLine>{line}</ScanLine>
          </>
        )}

        {phase === 'done' && (
          <>
            <StatusCard $safe data-testid="norton-result">
              <XPIcon name="nav" size={40} />
              <div className="msg">
                <div className="big">No threats found</div>
                <div>
                  {SCAN_TARGETS.length * 214} files scanned · 0 infected · 0 quarantined
                </div>
              </div>
            </StatusCard>
            <Btn onClick={() => setPhase('idle')}>Done</Btn>
          </>
        )}
      </Body>

      <Footer>
        <span>Symantec Corporation</span>
        <span>{phase === 'scanning' ? `${progress}%` : 'Ready'}</span>
      </Footer>
    </Wrap>
  );
};

export default NortonAntiVirus;
