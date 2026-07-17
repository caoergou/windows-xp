import React, { useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../components/XPIcon';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  blue700: '#14528F',
  blue800: '#1C3B5C',
  grey900: '#222222',
  blue500: '#356FC0',
  blue5002: '#3B7DD8',
  blue600: '#4A6785',
  grey600: '#555566',
  blue300: '#8EA6BF',
  grey400: '#9AA1AB',
  blue200: '#B3CFE9',
  blue2002: '#C2D9EF',
  blue2003: '#C3C9D2',
  blue2004: '#C9CED6',
  blue100: '#CFE6F5',
  blue1002: '#D5DAE1',
  blue1003: '#D9DDE3',
  blue1004: '#DCEFFF',
  blue1005: '#DFE3E9',
  blue1006: '#E0E5EC',
  blue1007: '#E9F6FF',
  blue1008: '#EAF3FF',
  blue1009: '#EEF1F5',
  blue10010: '#F2F4F7',
  blue10011: '#F3F6FB',
  blue10012: '#F5F7FA',
  white: '#FFFFFF',
};
/* brand-palette:end */

/**
 * iTunes — a 2000s-style media library shell for the `en` culture package
 * (#123). Original parody artwork/aqua theme; no ripped brand assets. A brushed
 * -metal library with a source list and a fake now-playing readout.
 */
const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${PALETTE.blue1003};
  font-family: 'Tahoma', 'Lucida Grande', sans-serif;
  font-size: 12px;
  color: ${PALETTE.grey900};
  user-select: none;
  overflow: hidden;
`;
const NowBar = styled.div`
  height: 54px;
  background: linear-gradient(to bottom, ${PALETTE.blue10010} 0%, ${PALETTE.blue2004} 100%);
  border-bottom: 1px solid ${PALETTE.grey400};
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  flex-shrink: 0;
`;
const Transport = styled.div`
  display: flex;
  gap: 4px;
  button {
    width: 26px;
    height: 22px;
    border: 1px solid ${PALETTE.grey400};
    border-radius: 3px;
    background: linear-gradient(to bottom, ${PALETTE.white}, ${PALETTE.blue1005});
    cursor: pointer;
    &:hover {
      background: linear-gradient(to bottom, ${PALETTE.white}, ${PALETTE.blue1009});
    }
    &:active {
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.25);
    }
  }
`;
const Lcd = styled.div`
  flex: 1;
  height: 34px;
  border: 1px solid ${PALETTE.grey400};
  border-radius: 4px;
  background: linear-gradient(to bottom, ${PALETTE.blue1007}, ${PALETTE.blue100});
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.3;
  .a {
    font-weight: bold;
  }
  .b {
    font-size: 10px;
    color: ${PALETTE.blue600};
  }
`;
const Main = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
`;
const Sidebar = styled.div`
  width: 150px;
  background: linear-gradient(to right, ${PALETTE.blue2002}, ${PALETTE.blue200});
  border-right: 1px solid ${PALETTE.blue300};
  padding: 6px 0;
  flex-shrink: 0;
`;
const Group = styled.div`
  font-size: 10px;
  font-weight: bold;
  color: ${PALETTE.blue600};
  padding: 6px 10px 2px;
  text-transform: uppercase;
`;
const Item = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 18px;
  cursor: pointer;
  background: ${p => (p.$active ? PALETTE.blue5002 : 'transparent')};
  color: ${p => (p.$active ? PALETTE.white : PALETTE.blue800)};
  &:hover {
    background: ${p => (p.$active ? PALETTE.blue500 : 'rgba(255,255,255,0.4)')};
  }
`;
const ListWrap = styled.div`
  flex: 1;
  background: ${PALETTE.white};
  overflow-y: auto;
  min-width: 0;
`;
const Head = styled.div`
  display: flex;
  position: sticky;
  top: 0;
  background: linear-gradient(to bottom, ${PALETTE.blue10012}, ${PALETTE.blue1006});
  border-bottom: 1px solid ${PALETTE.blue2003};
  font-weight: bold;
  color: ${PALETTE.grey600};
`;
const Row = styled.div<{ $alt?: boolean; $playing?: boolean }>`
  display: flex;
  padding: 4px 0;
  background: ${p => (p.$playing ? PALETTE.blue1004 : p.$alt ? PALETTE.blue10011 : PALETTE.white)};
  color: ${p => (p.$playing ? PALETTE.blue700 : 'inherit')};
  font-weight: ${p => (p.$playing ? 'bold' : 'normal')};
  cursor: default;
  &:hover {
    background: ${PALETTE.blue1008};
  }
`;
const C = styled.div<{ $flex?: number; $w?: number; $align?: string }>`
  flex: ${p => p.$flex ?? 1};
  width: ${p => (p.$w ? `${p.$w}px` : 'auto')};
  text-align: ${p => p.$align ?? 'left'};
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const Status = styled.div`
  border-top: 1px solid ${PALETTE.grey400};
  background: linear-gradient(to bottom, ${PALETTE.blue1009}, ${PALETTE.blue1002});
  padding: 4px 12px;
  font-size: 11px;
  color: ${PALETTE.grey600};
  text-align: center;
  flex-shrink: 0;
`;

const SONGS = [
  { name: 'Ride of the Modems', artist: 'The 56k', album: 'Handshake', time: '3:41' },
  { name: 'Aqua Interface', artist: 'Brushed Metal', album: 'OS X', time: '4:02' },
  { name: 'Podcast Intro', artist: 'Early Adopters', album: 'RSS', time: '1:12' },
  { name: 'iPod Shuffle', artist: 'Click Wheel', album: 'Gen 1', time: '2:55' },
  { name: 'Burn a Mix CD', artist: 'CD-R', album: '700 MB', time: '5:20' },
  { name: 'Napster Blues', artist: 'P2P', album: 'Shared', time: '3:33' },
];

const SOURCES = ['Library', 'Party Shuffle', 'Radio', 'Music Store', '90s Mix', 'Recently Added'];

const ITunes: React.FC<{ windowId?: string }> = () => {
  const [source, setSource] = useState('Library');
  const [playing, setPlaying] = useState<number | null>(null);

  return (
    <Wrap data-testid="itunes">
      <NowBar>
        <Transport>
          <button title="Previous">⏮</button>
          <button title="Play/Pause" onClick={() => setPlaying(p => (p === null ? 0 : null))}>
            {playing === null ? '▶' : '⏸'}
          </button>
          <button title="Next">⏭</button>
        </Transport>
        <Lcd>
          {playing === null ? (
            <div className="b">iTunes</div>
          ) : (
            <>
              <div className="a">{SONGS[playing].name}</div>
              <div className="b">
                {SONGS[playing].artist} — {SONGS[playing].album}
              </div>
            </>
          )}
        </Lcd>
      </NowBar>
      <Main>
        <Sidebar>
          <Group>Source</Group>
          {SOURCES.map(s => (
            <Item key={s} $active={source === s} onClick={() => setSource(s)}>
              <XPIcon name="itunes" size={14} />
              {s}
            </Item>
          ))}
        </Sidebar>
        <ListWrap>
          <Head>
            <C $flex={3}>Name</C>
            <C $w={60} $align="right">
              Time
            </C>
            <C $flex={2}>Artist</C>
            <C $flex={2}>Album</C>
          </Head>
          {SONGS.map((s, i) => (
            <Row
              key={i}
              $alt={i % 2 === 1}
              $playing={playing === i}
              onDoubleClick={() => setPlaying(i)}
            >
              <C $flex={3}>
                {playing === i ? '🔊 ' : ''}
                {s.name}
              </C>
              <C $w={60} $align="right">
                {s.time}
              </C>
              <C $flex={2}>{s.artist}</C>
              <C $flex={2}>{s.album}</C>
            </Row>
          ))}
        </ListWrap>
      </Main>
      <Status>{SONGS.length} songs, 21.4 minutes, 29.7 MB</Status>
    </Wrap>
  );
};

export default ITunes;
