import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../components/XPIcon';
import { resolveOSTheme } from '../themes/useOSTheme';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  grey800: '#2A2A2A',
  green800: '#2F6A10',
  green700: '#3F8018',
  grey700: '#444455',
  grey600: '#555566',
  green600: '#5AA32A',
  green400: '#8BD44A',
  green4002: '#9BB27F',
  green4003: '#9FD66A',
  green300: '#B6C3A6',
  green200: '#CDD6C4',
  green100: '#DFE6D7',
  green1002: '#E2E8DA',
  green1003: '#E4ECDA',
  green1004: '#E6FFD6',
  green1005: '#E9EFE4',
  green1006: '#EEF1EA',
  green1007: '#EEF1EC',
  green1008: '#EEF4E6',
  orange500: '#F2A11B',
  green1009: '#F5F7F2',
  yellow400: '#FFD24A',
  white: '#FFFFFF',
};
/* brand-palette:end */

/**
 * uTorrent — a 2000s-style download manager shell for the `en` culture package
 * (#123). Original parody artwork/green theme; no ripped brand assets. Fake
 * torrents tick toward completion (like the zh Thunder shell).
 */
const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${PALETTE.green1007};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.CLASSIC};
  font-size: 12px;
  color: ${PALETTE.grey800};
  user-select: none;
  overflow: hidden;
`;
const Header = styled.div`
  background: linear-gradient(
    to bottom,
    ${PALETTE.green400} 0%,
    ${PALETTE.green600} 55%,
    ${PALETTE.green700} 100%
  );
  border-bottom: 1px solid ${PALETTE.green800};
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  .t {
    font-size: 15px;
    font-weight: bold;
    color: ${PALETTE.white};
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  }
  .v {
    font-size: 11px;
    color: ${PALETTE.green1004};
  }
`;
const Toolbar = styled.div`
  display: flex;
  gap: 6px;
  padding: 5px 10px;
  background: linear-gradient(to bottom, ${PALETTE.white}, ${PALETTE.green1005});
  border-bottom: 1px solid ${PALETTE.green200};
  flex-shrink: 0;
`;
const TBtn = styled.button`
  height: 24px;
  padding: 0 10px;
  border: 1px solid ${PALETTE.green4002};
  border-radius: 2px;
  cursor: pointer;
  background: linear-gradient(to bottom, ${PALETTE.white}, ${PALETTE.green1003});
  &:hover {
    background: linear-gradient(to bottom, ${PALETTE.white}, ${PALETTE.green1008});
  }
`;
const HeadRow = styled.div`
  display: flex;
  padding: 4px 10px;
  background: linear-gradient(to bottom, ${PALETTE.green1009}, ${PALETTE.green1002});
  border-bottom: 1px solid ${PALETTE.green200};
  font-weight: bold;
  color: ${PALETTE.grey700};
  flex-shrink: 0;
`;
const List = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${PALETTE.white};
`;
const Row = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid ${PALETTE.green1006};
`;
const Cell = styled.div<{ $flex?: number; $w?: number; $align?: string }>`
  flex: ${p => p.$flex ?? 1};
  width: ${p => (p.$w ? `${p.$w}px` : 'auto')};
  text-align: ${p => p.$align ?? 'left'};
  padding: 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const Prog = styled.div`
  height: 12px;
  background: ${PALETTE.green100};
  border: 1px solid ${PALETTE.green300};
  border-radius: 2px;
  overflow: hidden;
`;
const Fill = styled.div<{ $v: number; $done?: boolean }>`
  height: 100%;
  width: ${p => p.$v}%;
  background: ${p =>
    p.$done
      ? `linear-gradient(to bottom, ${PALETTE.green4003}, ${PALETTE.green600})`
      : `linear-gradient(to bottom, ${PALETTE.yellow400}, ${PALETTE.orange500})`};
  transition: width 0.3s linear;
`;
const Status = styled.div`
  border-top: 1px solid ${PALETTE.green200};
  background: ${PALETTE.green1005};
  padding: 4px 10px;
  font-size: 11px;
  color: ${PALETTE.grey600};
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
`;

interface Torrent {
  name: string;
  size: string;
  progress: number;
  down: number; // KB/s while active
}

const INITIAL: Torrent[] = [
  { name: 'ubuntu-5.10-install-i386.iso', size: '621 MB', progress: 100, down: 0 },
  { name: 'The_Matrix_LAN_Wallpapers.zip', size: '18 MB', progress: 63, down: 214 },
  { name: 'Winamp_Skins_MegaPack.rar', size: '42 MB', progress: 27, down: 96 },
  { name: 'CounterStrike_1.6_maps.zip', size: '133 MB', progress: 8, down: 41 },
];

const UTorrent: React.FC<{ windowId?: string }> = () => {
  const [torrents, setTorrents] = useState<Torrent[]>(INITIAL);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => {
      setTorrents(prev =>
        prev.map(t =>
          t.progress >= 100
            ? { ...t, down: 0 }
            : { ...t, progress: Math.min(100, t.progress + Math.random() * 3) }
        )
      );
    }, 900);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  const active = torrents.filter(t => t.progress < 100);
  const totalDown = active.reduce((s, t) => s + t.down, 0);

  return (
    <Wrap data-testid="utorrent">
      <Header>
        <XPIcon name="utorrent" size={32} />
        <div>
          <div className="t">µTorrent 1.6</div>
          <div className="v">a (very) tiny bittorrent client</div>
        </div>
      </Header>
      <Toolbar>
        <TBtn>＋ Add Torrent</TBtn>
        <TBtn>▶ Resume</TBtn>
        <TBtn>⏸ Pause</TBtn>
        <TBtn>✕ Remove</TBtn>
      </Toolbar>
      <HeadRow>
        <Cell $flex={3}>Name</Cell>
        <Cell $w={70} $align="right">
          Size
        </Cell>
        <Cell $flex={2}>Done</Cell>
        <Cell $w={80} $align="right">
          Down Speed
        </Cell>
      </HeadRow>
      <List>
        {torrents.map((t, i) => {
          const done = t.progress >= 100;
          return (
            <Row key={i}>
              <Cell $flex={3} title={t.name}>
                {t.name}
              </Cell>
              <Cell $w={70} $align="right">
                {t.size}
              </Cell>
              <Cell $flex={2}>
                <Prog data-testid="utorrent-progress">
                  <Fill $v={t.progress} $done={done} />
                </Prog>
              </Cell>
              <Cell $w={80} $align="right">
                {done ? 'Seeding' : `${Math.round(t.down)} KB/s`}
              </Cell>
            </Row>
          );
        })}
      </List>
      <Status>
        <span>
          {active.length} downloading · {torrents.length - active.length} complete
        </span>
        <span>▼ {totalDown} KB/s · ▲ 32 KB/s</span>
      </Status>
    </Wrap>
  );
};

export default UTorrent;
