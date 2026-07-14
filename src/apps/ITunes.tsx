import React, { useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../components/XPIcon';

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
  background: #d9dde3;
  font-family: 'Tahoma', 'Lucida Grande', sans-serif;
  font-size: 12px;
  color: #222;
  user-select: none;
  overflow: hidden;
`;
const NowBar = styled.div`
  height: 54px;
  background: linear-gradient(to bottom, #f2f4f7 0%, #c9ced6 100%);
  border-bottom: 1px solid #9aa1ab;
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
    border: 1px solid #9aa1ab;
    border-radius: 3px;
    background: linear-gradient(to bottom, #ffffff, #dfe3e9);
    cursor: pointer;
    &:hover {
      background: linear-gradient(to bottom, #ffffff, #eef1f5);
    }
    &:active {
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.25);
    }
  }
`;
const Lcd = styled.div`
  flex: 1;
  height: 34px;
  border: 1px solid #9aa1ab;
  border-radius: 4px;
  background: linear-gradient(to bottom, #e9f6ff, #cfe6f5);
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
    color: #4a6785;
  }
`;
const Main = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
`;
const Sidebar = styled.div`
  width: 150px;
  background: linear-gradient(to right, #c2d9ef, #b3cfe9);
  border-right: 1px solid #8ea6bf;
  padding: 6px 0;
  flex-shrink: 0;
`;
const Group = styled.div`
  font-size: 10px;
  font-weight: bold;
  color: #4a6785;
  padding: 6px 10px 2px;
  text-transform: uppercase;
`;
const Item = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 18px;
  cursor: pointer;
  background: ${p => (p.$active ? '#3b7dd8' : 'transparent')};
  color: ${p => (p.$active ? '#fff' : '#1c3b5c')};
  &:hover {
    background: ${p => (p.$active ? '#356fc0' : 'rgba(255,255,255,0.4)')};
  }
`;
const ListWrap = styled.div`
  flex: 1;
  background: #fff;
  overflow-y: auto;
  min-width: 0;
`;
const Head = styled.div`
  display: flex;
  position: sticky;
  top: 0;
  background: linear-gradient(to bottom, #f5f7fa, #e0e5ec);
  border-bottom: 1px solid #c3c9d2;
  font-weight: bold;
  color: #556;
`;
const Row = styled.div<{ $alt?: boolean; $playing?: boolean }>`
  display: flex;
  padding: 4px 0;
  background: ${p => (p.$playing ? '#dcefff' : p.$alt ? '#f3f6fb' : '#fff')};
  color: ${p => (p.$playing ? '#14528f' : 'inherit')};
  font-weight: ${p => (p.$playing ? 'bold' : 'normal')};
  cursor: default;
  &:hover {
    background: #eaf3ff;
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
  border-top: 1px solid #9aa1ab;
  background: linear-gradient(to bottom, #eef1f5, #d5dae1);
  padding: 4px 12px;
  font-size: 11px;
  color: #556;
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
