import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';
import { useFileSystem } from '../context/FileSystemContext';
import { isContainerNode, type FileNode } from '../types';
import { sounds } from '../utils/soundManager';

/** Collect up to `limit` real file/app names from the tree — used as fake
 * "trojans" so the 360 scan feels like it found something real (#85). */
const collectFileNames = (node: FileNode, limit: number, acc: string[] = []): string[] => {
  if (acc.length >= limit) return acc;
  if (isContainerNode(node)) {
    for (const [key, child] of Object.entries(node.children)) {
      if (key === '回收站') continue;
      if (child.type === 'file' || child.type === 'app_shortcut') {
        if (!acc.includes(key)) acc.push(key);
      }
      if (acc.length >= limit) break;
      collectFileNames(child, limit, acc);
    }
  }
  return acc;
};

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const scanPulse = keyframes`
  0% { opacity: 0.3; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.3; transform: scale(0.9); }
`;

const progressStripes = keyframes`
  from { background-position: 0 0; }
  to { background-position: 20px 0; }
`;

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7fbf5;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 12px;
  user-select: none;
  position: relative;
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(to bottom, #6bb33f 0%, #4d9a28 50%, #3e8a1c 100%);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const Logo = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: #4d9a28;
  border: 3px solid #ff6600;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
`;

const HeaderText = styled.div`
  color: white;
  line-height: 1.4;

  .title {
    font-size: 18px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
  }

  .version {
    font-size: 11px;
    color: #d6f0c8;
  }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 4px;
  padding: 6px 10px;
  background: linear-gradient(to bottom, #ffffff 0%, #eef5ea 100%);
  border-bottom: 1px solid #c8d8bf;
`;

const ToolbarBtn = styled.button`
  padding: 3px 10px;
  border: 1px solid #b0c8a5;
  background: linear-gradient(to bottom, #ffffff 0%, #e2eedb 100%);
  border-radius: 3px;
  font-size: 12px;
  font-family: inherit;
  color: #335522;
  cursor: pointer;

  &:hover {
    background: linear-gradient(to bottom, #f3faf0 0%, #d5e8cc 100%);
  }

  &:active {
    background: linear-gradient(to bottom, #d0e4c5 0%, #b8d6aa 100%);
  }
`;

const Body = styled.div`
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f7fbf5;
  overflow-y: auto;
  min-height: 0;
`;

const MainPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const ShieldBox = styled.div<{ $scanning: boolean }>`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #8fd65e 0%, #4d9a28 60%, #2f6f16 100%);
  border: 4px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  position: relative;

  ${p => p.$scanning && css`
    animation: ${scanPulse} 1.5s ease-in-out infinite;
  `}

  .score {
    font-size: 36px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
  }

  .label {
    font-size: 12px;
    margin-top: 2px;
  }
`;

const ScanInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: white;
  border: 1px solid #d0e4c5;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4d9a28;
    box-shadow: 0 0 4px #4d9a28;
  }

  .text {
    flex: 1;
    color: #335522;
  }

  .value {
    color: #4d9a28;
    font-weight: bold;
  }
`;

const ProgressWrap = styled.div`
  background: white;
  border: 1px solid #d0e4c5;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #335522;
`;

const ProgressTrack = styled.div`
  height: 16px;
  background: #e8f0e3;
  border: 1px solid #b8d4aa;
  border-radius: 8px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $value: number; $animated?: boolean }>`
  width: ${p => p.$value}%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    #6bb33f,
    #6bb33f 10px,
    #5aa02f 10px,
    #5aa02f 20px
  );
  border-radius: 8px 0 0 8px;
  transition: width 0.2s linear;

  ${p => p.$animated && css`
    animation: ${progressStripes} 0.5s linear infinite;
  `}
`;

const ActionArea = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 8px;
`;

const ScanButton = styled.button<{ $scanning: boolean }>`
  width: 180px;
  height: 40px;
  border: 1px solid #cc5200;
  border-radius: 4px;
  font-size: 15px;
  font-weight: bold;
  font-family: inherit;
  color: white;
  cursor: pointer;
  background: ${p => p.$scanning
    ? 'linear-gradient(to bottom, #999 0%, #777 100%)'
    : 'linear-gradient(to bottom, #ff8833 0%, #ff6600 50%, #e65c00 100%)'};
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover:not(:disabled) {
    background: linear-gradient(to bottom, #ff9a55 0%, #ff7722 50%, #f06a11 100%);
  }

  &:active:not(:disabled) {
    background: linear-gradient(to bottom, #e65c00 0%, #cc5200 50%, #b34700 100%);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.9;
  }
`;

const Footer = styled.div`
  background: linear-gradient(to bottom, #eef5ea 0%, #dfebd8 100%);
  border-top: 1px solid #c8d8bf;
  padding: 6px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #557744;
`;

const ScanOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(247, 251, 245, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  z-index: 10;
  color: #335522;

  .spinner {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 4px solid #d0e4c5;
    border-top-color: #ff6600;
    animation: ${rotate} 0.8s linear infinite;
  }

  .message {
    font-size: 14px;
    font-weight: bold;
  }
`;

const ResultPanel = styled.div`
  background: white;
  border: 1px solid #d0e4c5;
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #335522;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .icon {
    font-size: 24px;
  }

  .text {
    font-size: 13px;
    font-weight: bold;
    color: #4d9a28;
  }
`;

const ThreatList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #b34700;
  }
`;

const CleanButton = styled.button`
  margin-left: auto;
  padding: 5px 16px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  border: 1px solid #b34700;
  border-radius: 3px;
  cursor: pointer;
  background: linear-gradient(to bottom, #ff8833 0%, #ff6600 50%, #e65c00 100%);

  &:hover {
    background: linear-gradient(to bottom, #ff9a55 0%, #ff7722 50%, #f06a11 100%);
  }
`;

interface SafeGuard360Props {
  windowId?: string;
}

const SafeGuard360: React.FC<SafeGuard360Props> = () => {
  const { t } = useTranslation();
  const { fs } = useFileSystem();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultVisible, setResultVisible] = useState(false);
  const [score, setScore] = useState(100);
  const [threats, setThreats] = useState<string[]>([]);
  const [cleaned, setCleaned] = useState(false);

  const startScan = useCallback(() => {
    setScanning(true);
    setProgress(0);
    setResultVisible(false);
    setCleaned(false);
    setThreats([]);
    setScore(0);
  }, []);

  const cleanThreats = useCallback(() => {
    sounds.notify();
    setThreats([]);
    setCleaned(true);
    setScore(100);
  }, []);

  useEffect(() => {
    if (!scanning) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [scanning]);

  useEffect(() => {
    if (progress >= 100 && scanning) {
      const timeout = setTimeout(() => {
        // "Find" a couple of real files masquerading as trojans (#85).
        const found = collectFileNames(fs.root, 2);
        setScanning(false);
        setResultVisible(true);
        setThreats(found);
        setScore(found.length ? 70 : 100);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, scanning, fs]);

  return (
    <Wrap>
      {scanning && (
        <ScanOverlay>
          <div className="spinner" />
          <div className="message">{t('safeGuard360.scan.scanning')}</div>
          <ProgressTrack style={{ width: 220 }}>
            <ProgressFill $value={progress} $animated />
          </ProgressTrack>
        </ScanOverlay>
      )}

      <Header>
        <Logo>360</Logo>
        <HeaderText>
          <div className="title">{t('safeGuard360.title')}</div>
          <div className="version">{t('safeGuard360.version')}</div>
        </HeaderText>
      </Header>

      <Toolbar>
        <ToolbarBtn>{t('safeGuard360.toolbar.computerCheckup')}</ToolbarBtn>
        <ToolbarBtn>{t('safeGuard360.toolbar.trojanScan')}</ToolbarBtn>
        <ToolbarBtn>{t('safeGuard360.toolbar.pluginCleanup')}</ToolbarBtn>
        <ToolbarBtn>{t('safeGuard360.toolbar.vulnerabilityFix')}</ToolbarBtn>
      </Toolbar>

      <Body>
        <MainPanel>
          <ShieldBox $scanning={scanning}>
            <div className="score">{score}</div>
            <div className="label">{t('safeGuard360.healthScore')}</div>
          </ShieldBox>

          <ScanInfo>
            <StatusRow>
              <div className="dot" />
              <div className="text">{t('safeGuard360.status.firewall')}</div>
              <div className="value">{t('safeGuard360.status.on')}</div>
            </StatusRow>
            <StatusRow>
              <div className="dot" />
              <div className="text">{t('safeGuard360.status.vulnerabilities')}</div>
              <div className="value">0</div>
            </StatusRow>
            <StatusRow>
              <div className="dot" />
              <div className="text">{t('safeGuard360.status.viruses')}</div>
              <div className="value">0</div>
            </StatusRow>
          </ScanInfo>
        </MainPanel>

        <ProgressWrap>
          <ProgressLabel>
            <span>{t('safeGuard360.progress.realtimeProtection')}</span>
            <span>100%</span>
          </ProgressLabel>
          <ProgressTrack>
            <ProgressFill $value={100} />
          </ProgressTrack>
        </ProgressWrap>

        {resultVisible && threats.length > 0 && (
          <ResultPanel>
            <div className="icon"><XPIcon name="alert_warning" size={48} /></div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#b34700' }}>
              {t('safeGuard360.scan.threatsFound', { count: threats.length })}
            </div>
            <ThreatList>
              {threats.map(name => (
                <li key={name}>
                  <XPIcon name="stop_xp" size={16} />
                  <span>{t('safeGuard360.scan.threatPrefix')}.{name}.exe</span>
                </li>
              ))}
            </ThreatList>
            <CleanButton data-testid="safe-guard-clean-button" onClick={cleanThreats}>
              {t('safeGuard360.scan.cleanButton')}
            </CleanButton>
          </ResultPanel>
        )}

        {resultVisible && threats.length === 0 && (
          <ResultPanel>
            <div className="icon"><XPIcon name="checklist" size={48} /></div>
            <div className="text">
              {cleaned ? t('safeGuard360.scan.cleaned') : t('safeGuard360.scan.resultSafe')}
            </div>
          </ResultPanel>
        )}

        <ActionArea>
          <ScanButton data-testid="safe-guard-scan-button" $scanning={scanning} onClick={startScan} disabled={scanning}>
            {scanning ? t('safeGuard360.scan.scanning') : t('safeGuard360.scan.quickScan')}
          </ScanButton>
        </ActionArea>
      </Body>

      <Footer>
        <span>{t('safeGuard360.footer.lastScan')}: {t('safeGuard360.footer.never')}</span>
        <span>{t('safeGuard360.footer.updateTime')}: 2008-08-08</span>
      </Footer>
    </Wrap>
  );
};

export default SafeGuard360;
