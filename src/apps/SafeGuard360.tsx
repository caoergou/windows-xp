import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { CultureAppShell } from './culture/shell';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';
import { useFileSystem } from '../context/FileSystemContext';
import { isContainerNode, type FileNode } from '../types';
import { sounds } from '../utils/soundManager';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  green700: '#2F6F16',
  green800: '#335522',
  green7002: '#3E8A1C',
  green600: '#4D9A28',
  green6002: '#557744',
  green6003: '#5AA02F',
  green500: '#6BB33F',
  grey500: '#777777',
  green400: '#8FD65E',
  grey400: '#999999',
  green300: '#B0C8A5',
  orange600: '#B34700',
  green3002: '#B8D4AA',
  green200: '#B8D6AA',
  green2002: '#C8D8BF',
  orange6002: '#CC5200',
  green2003: '#D0E4C5',
  green100: '#D5E8CC',
  green1002: '#D6F0C8',
  green1003: '#DFEBD8',
  green1004: '#E2EEDB',
  orange500: '#E65C00',
  green1005: '#E8F0E3',
  green1006: '#EEF5EA',
  orange5002: '#F06A11',
  green1007: '#F3FAF0',
  green1008: '#F7FBF5',
  orange5003: '#FF6600',
  orange400: '#FF7722',
  orange4002: '#FF8833',
  orange300: '#FF9A55',
  white: '#FFFFFF',
};
/* brand-palette:end */

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

const Wrap = styled(CultureAppShell)`
  background: ${PALETTE.green1008};
  position: relative;
`;

const Header = styled.div`
  background: linear-gradient(
    to bottom,
    ${PALETTE.green500} 0%,
    ${PALETTE.green600} 50%,
    ${PALETTE.green7002} 100%
  );
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
  color: ${PALETTE.green600};
  border: 3px solid ${PALETTE.orange5003};
  box-shadow:
    inset 0 0 8px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.2);
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
    color: ${PALETTE.green1002};
  }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 4px;
  padding: 6px 10px;
  background: linear-gradient(to bottom, ${PALETTE.white} 0%, ${PALETTE.green1006} 100%);
  border-bottom: 1px solid ${PALETTE.green2002};
`;

const ToolbarBtn = styled.button`
  padding: 3px 10px;
  border: 1px solid ${PALETTE.green300};
  background: linear-gradient(to bottom, ${PALETTE.white} 0%, ${PALETTE.green1004} 100%);
  border-radius: 3px;
  font-size: 12px;
  font-family: inherit;
  color: ${PALETTE.green800};
  cursor: pointer;

  &:hover {
    background: linear-gradient(to bottom, ${PALETTE.green1007} 0%, ${PALETTE.green100} 100%);
  }

  &:active {
    background: linear-gradient(to bottom, ${PALETTE.green2003} 0%, ${PALETTE.green200} 100%);
  }
`;

const Body = styled.div`
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${PALETTE.green1008};
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
  background: radial-gradient(
    circle at 35% 35%,
    ${PALETTE.green400} 0%,
    ${PALETTE.green600} 60%,
    ${PALETTE.green700} 100%
  );
  border: 4px solid white;
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.2),
    inset 0 0 20px rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  position: relative;

  ${p =>
    p.$scanning &&
    css`
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
  border: 1px solid ${PALETTE.green2003};
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${PALETTE.green600};
    box-shadow: 0 0 4px ${PALETTE.green600};
  }

  .text {
    flex: 1;
    color: ${PALETTE.green800};
  }

  .value {
    color: ${PALETTE.green600};
    font-weight: bold;
  }
`;

const ProgressWrap = styled.div`
  background: white;
  border: 1px solid ${PALETTE.green2003};
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: ${PALETTE.green800};
`;

const ProgressTrack = styled.div`
  height: 16px;
  background: ${PALETTE.green1005};
  border: 1px solid ${PALETTE.green3002};
  border-radius: 8px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $value: number; $animated?: boolean }>`
  width: ${p => p.$value}%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    ${PALETTE.green500},
    ${PALETTE.green500} 10px,
    ${PALETTE.green6003} 10px,
    ${PALETTE.green6003} 20px
  );
  border-radius: 8px 0 0 8px;
  transition: width 0.2s linear;

  ${p =>
    p.$animated &&
    css`
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
  border: 1px solid ${PALETTE.orange6002};
  border-radius: 4px;
  font-size: 15px;
  font-weight: bold;
  font-family: inherit;
  color: white;
  cursor: pointer;
  background: ${p =>
    p.$scanning
      ? `linear-gradient(to bottom, ${PALETTE.grey400} 0%, ${PALETTE.grey500} 100%)`
      : `linear-gradient(to bottom, ${PALETTE.orange4002} 0%, ${PALETTE.orange5003} 50%, ${PALETTE.orange500} 100%)`};
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover:not(:disabled) {
    background: linear-gradient(
      to bottom,
      ${PALETTE.orange300} 0%,
      ${PALETTE.orange400} 50%,
      ${PALETTE.orange5002} 100%
    );
  }

  &:active:not(:disabled) {
    background: linear-gradient(
      to bottom,
      ${PALETTE.orange500} 0%,
      ${PALETTE.orange6002} 50%,
      ${PALETTE.orange600} 100%
    );
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.9;
  }
`;

const Footer = styled.div`
  background: linear-gradient(to bottom, ${PALETTE.green1006} 0%, ${PALETTE.green1003} 100%);
  border-top: 1px solid ${PALETTE.green2002};
  padding: 6px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: ${PALETTE.green6002};
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
  color: ${PALETTE.green800};

  .spinner {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 4px solid ${PALETTE.green2003};
    border-top-color: ${PALETTE.orange5003};
    animation: ${rotate} 0.8s linear infinite;
  }

  .message {
    font-size: 14px;
    font-weight: bold;
  }
`;

const ResultPanel = styled.div`
  background: white;
  border: 1px solid ${PALETTE.green2003};
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: ${PALETTE.green800};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .icon {
    font-size: 24px;
  }

  .text {
    font-size: 13px;
    font-weight: bold;
    color: ${PALETTE.green600};
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
    color: ${PALETTE.orange600};
  }
`;

const CleanButton = styled.button`
  margin-left: auto;
  padding: 5px 16px;
  font-size: 12px;
  font-weight: bold;
  color: ${PALETTE.white};
  border: 1px solid ${PALETTE.orange600};
  border-radius: 3px;
  cursor: pointer;
  background: linear-gradient(
    to bottom,
    ${PALETTE.orange4002} 0%,
    ${PALETTE.orange5003} 50%,
    ${PALETTE.orange500} 100%
  );

  &:hover {
    background: linear-gradient(
      to bottom,
      ${PALETTE.orange300} 0%,
      ${PALETTE.orange400} 50%,
      ${PALETTE.orange5002} 100%
    );
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
            <div className="icon">
              <XPIcon name="alert_warning" size={48} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: PALETTE.orange600 }}>
              {t('safeGuard360.scan.threatsFound', { count: threats.length })}
            </div>
            <ThreatList>
              {threats.map(name => (
                <li key={name}>
                  <XPIcon name="stop_xp" size={16} />
                  <span>
                    {t('safeGuard360.scan.threatPrefix')}.{name}.exe
                  </span>
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
            <div className="icon">
              <XPIcon name="checklist" size={48} />
            </div>
            <div className="text">
              {cleaned ? t('safeGuard360.scan.cleaned') : t('safeGuard360.scan.resultSafe')}
            </div>
          </ResultPanel>
        )}

        <ActionArea>
          <ScanButton
            data-testid="safe-guard-scan-button"
            $scanning={scanning}
            onClick={startScan}
            disabled={scanning}
          >
            {scanning ? t('safeGuard360.scan.scanning') : t('safeGuard360.scan.quickScan')}
          </ScanButton>
        </ActionArea>
      </Body>

      <Footer>
        <span>
          {t('safeGuard360.footer.lastScan')}: {t('safeGuard360.footer.never')}
        </span>
        <span>{t('safeGuard360.footer.updateTime')}: 2008-08-08</span>
      </Footer>
    </Wrap>
  );
};

export default SafeGuard360;
