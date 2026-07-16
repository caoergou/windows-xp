import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { CultureAppShell } from './culture/shell';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  grey900: '#1A1A1A',
  green800: '#1B5E20',
  grey800: '#2D2D2D',
  green700: '#2E7D32',
  grey8002: '#333333',
  green600: '#388E3C',
  green6002: '#43A047',
  grey700: '#444444',
  green500: '#4CAF50',
  grey7002: '#555555',
  grey600: '#666666',
  green400: '#66BB6A',
  green4002: '#81C784',
  grey400: '#999999',
  green300: '#A5D6A7',
  grey300: '#BBBBBB',
  green200: '#C8E6C9',
  grey200: '#D0D0D0',
  green100: '#DCEDC8',
  grey100: '#E0E0E0',
  grey1002: '#E3E3E3',
  green1002: '#E8F5E9',
  grey1003: '#EBEBEB',
  white: '#F0F0F0',
  white2: '#F5F5F5',
  white3: '#F7F7F7',
  white4: '#F9F9F9',
  white5: '#FFFFFF',
};
/* brand-palette:end */

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
}

const defaultSongs: Song[] = [
  { id: '1', title: '稻香', artist: '周杰伦', duration: 223 },
  { id: '2', title: '童话', artist: '光良', duration: 259 },
  { id: '3', title: '海阔天空', artist: 'Beyond', duration: 326 },
  { id: '4', title: '老鼠爱大米', artist: '杨臣刚', duration: 252 },
];

const pulse = keyframes`
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
`;

const Wrap = styled(CultureAppShell)`
  background: ${PALETTE.white2};
  color: ${PALETTE.grey8002};
`;

const Header = styled.div`
  background: linear-gradient(
    to bottom,
    ${PALETTE.green400} 0%,
    ${PALETTE.green6002} 50%,
    ${PALETTE.green700} 100%
  );
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid ${PALETTE.green800};
  flex-shrink: 0;
`;

const LogoBox = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, ${PALETTE.green4002} 0%, ${PALETTE.green500} 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
`;

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M14 2C8.48 2 4 6.48 4 12s4.48 10 10 10 10-4.48 10-10S19.52 2 14 2z"
      fill={PALETTE.white5}
      fillOpacity="0.9"
    />
    <path d="M10 19c0-3 1.5-5.5 4-7 2.5 1.5 4 4 4 7H10z" fill={PALETTE.green700} />
    <circle cx="14" cy="10" r="2.5" fill={PALETTE.green700} />
    <path
      d="M8 9l3 3M20 9l-3 3"
      stroke={PALETTE.green700}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const HeaderText = styled.div`
  color: white;
  line-height: 1.3;

  .title {
    font-size: 18px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
  }

  .version {
    font-size: 11px;
    color: ${PALETTE.green100};
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(to bottom, ${PALETTE.white5} 0%, ${PALETTE.white} 100%);
  border-bottom: 1px solid ${PALETTE.grey200};
  flex-shrink: 0;
`;

const ToolbarBtn = styled.button<{ $active?: boolean }>`
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid ${PALETTE.grey400};
  border-radius: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${p =>
    p.$active
      ? `linear-gradient(to bottom, ${PALETTE.green300} 0%, ${PALETTE.green400} 50%, ${PALETTE.green6002} 100%)`
      : `linear-gradient(to bottom, ${PALETTE.white5} 0%, ${PALETTE.white} 50%, ${PALETTE.grey100} 100%)`};
  color: ${p => (p.$active ? PALETTE.white5 : PALETTE.grey8002)};
  text-shadow: ${p => (p.$active ? '1px 1px 1px rgba(0,0,0,0.3)' : 'none')};

  &:hover {
    background: ${p =>
      p.$active
        ? `linear-gradient(to bottom, ${PALETTE.green4002} 0%, ${PALETTE.green500} 50%, ${PALETTE.green600} 100%)`
        : `linear-gradient(to bottom, ${PALETTE.white5} 0%, ${PALETTE.white3} 50%, ${PALETTE.grey1003} 100%)`};
  }

  &:active {
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${PALETTE.white5};
  overflow: hidden;
`;

const VisualizerPanel = styled.div`
  height: 90px;
  background: linear-gradient(to bottom, ${PALETTE.grey900} 0%, ${PALETTE.grey800} 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  border-bottom: 1px solid ${PALETTE.grey700};
`;

const CurrentSong = styled.div`
  color: ${PALETTE.green300};
  font-size: 13px;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(76, 175, 80, 0.6);
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Bars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 40px;
`;

const Bar = styled.div<{ $active?: boolean; $delay: number }>`
  width: 6px;
  height: 100%;
  background: ${p => (p.$active ? PALETTE.green400 : PALETTE.grey7002)};
  border-radius: 1px;
  transform-origin: bottom;
  animation: ${p =>
    p.$active
      ? css`
          ${pulse} 0.8s ease-in-out infinite
        `
      : 'none'};
  animation-delay: ${p => p.$delay}s;
`;

const ListHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  background: linear-gradient(to bottom, ${PALETTE.white3} 0%, ${PALETTE.grey1002} 100%);
  border-bottom: 1px solid ${PALETTE.grey200};
  color: ${PALETTE.grey700};
  font-weight: bold;
  flex-shrink: 0;
`;

const ListBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${PALETTE.white5};
`;

const ListRow = styled.div<{ $selected?: boolean; $playing?: boolean }>`
  display: flex;
  align-items: center;
  padding: 7px 10px;
  border-bottom: 1px solid ${PALETTE.white};
  cursor: pointer;
  background: ${p => (p.$selected ? PALETTE.green1002 : 'transparent')};
  color: ${p => (p.$playing ? PALETTE.green700 : 'inherit')};
  font-weight: ${p => (p.$playing ? 'bold' : 'normal')};

  &:hover {
    background: ${p => (p.$selected ? PALETTE.green200 : PALETTE.white4)};
  }
`;

const Cell = styled.div<{ $flex?: number; $width?: number; $align?: 'left' | 'center' | 'right' }>`
  flex: ${p => p.$flex ?? 1};
  width: ${p => (p.$width ? `${p.$width}px` : 'auto')};
  text-align: ${p => p.$align ?? 'left'};
  padding: 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: linear-gradient(to bottom, ${PALETTE.white} 0%, ${PALETTE.grey100} 100%);
  border-top: 1px solid ${PALETTE.grey200};
  flex-shrink: 0;
`;

const PlayButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ControlBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid ${PALETTE.grey400};
  border-radius: 2px;
  background: linear-gradient(
    to bottom,
    ${PALETTE.white5} 0%,
    ${PALETTE.white} 50%,
    ${PALETTE.grey100} 100%
  );

  &:hover {
    background: linear-gradient(
      to bottom,
      ${PALETTE.white5} 0%,
      ${PALETTE.white3} 50%,
      ${PALETTE.grey1003} 100%
    );
  }

  &:active {
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }
`;

const PlayBtn = styled(ControlBtn)`
  width: 36px;
  background: linear-gradient(
    to bottom,
    ${PALETTE.green300} 0%,
    ${PALETTE.green400} 50%,
    ${PALETTE.green6002} 100%
  );
  color: white;
  border-color: ${PALETTE.green700};

  &:hover {
    background: linear-gradient(
      to bottom,
      ${PALETTE.green4002} 0%,
      ${PALETTE.green500} 50%,
      ${PALETTE.green600} 100%
    );
  }
`;

const ProgressArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const ProgressTime = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: ${PALETTE.grey600};
`;

const ProgressWrap = styled.div`
  width: 100%;
  height: 10px;
  background: ${PALETTE.grey200};
  border: 1px solid ${PALETTE.grey300};
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
`;

const ProgressFill = styled.div<{ $value: number }>`
  width: ${p => p.$value}%;
  height: 100%;
  background: linear-gradient(to bottom, ${PALETTE.green4002} 0%, ${PALETTE.green500} 100%);
  transition: width 0.1s linear;
`;

const VolumeArea = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 90px;
  flex-shrink: 0;
`;

const VolumeSlider = styled.input`
  flex: 1;
  cursor: pointer;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: linear-gradient(to bottom, ${PALETTE.white3} 0%, ${PALETTE.grey1002} 100%);
  border-top: 1px solid ${PALETTE.grey200};
  font-size: 11px;
  color: ${PALETTE.grey600};
  flex-shrink: 0;
`;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface KugouMusicProps {
  windowId?: string;
}

const KugouMusic: React.FC<KugouMusicProps> = () => {
  const { t } = useTranslation();
  const [songs] = useState<Song[]>(defaultSongs);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(70);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const progressRef = useRef<number | null>(null);

  const currentSong = songs[currentIndex];

  const clearProgressInterval = useCallback(() => {
    if (progressRef.current) {
      window.clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    clearProgressInterval();
    progressRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= currentSong.duration) {
          return currentSong.duration;
        }
        return prev + 1;
      });
    }, 1000);
  }, [clearProgressInterval, currentSong]);

  useEffect(() => {
    if (isPlaying) {
      startProgress();
    } else {
      clearProgressInterval();
    }
    return clearProgressInterval;
  }, [isPlaying, startProgress, clearProgressInterval]);

  useEffect(() => {
    if (progress >= currentSong.duration) {
      setProgress(0);
      setCurrentIndex(prev => (prev + 1) % songs.length);
    }
  }, [progress, currentSong, songs.length]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handlePrevious = useCallback(() => {
    setProgress(0);
    setCurrentIndex(prev => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  }, [songs.length]);

  const handleNext = useCallback(() => {
    setProgress(0);
    setCurrentIndex(prev => (prev + 1) % songs.length);
    setIsPlaying(true);
  }, [songs.length]);

  const handleSongClick = useCallback(
    (index: number) => {
      setSelectedId(songs[index].id);
      setCurrentIndex(index);
      setProgress(0);
      setIsPlaying(true);
    },
    [songs]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setProgress(Math.round(ratio * currentSong.duration));
    },
    [currentSong]
  );

  const progressPercent = useMemo(
    () => (currentSong.duration ? (progress / currentSong.duration) * 100 : 0),
    [progress, currentSong]
  );

  const barDelays = useMemo(() => Array.from({ length: 16 }, (_, i) => i * 0.1), []);

  return (
    <Wrap>
      <Header>
        <LogoBox>
          <LogoIcon />
        </LogoBox>
        <HeaderText>
          <div className="title">{t('kugouMusic.title')}</div>
          <div className="version">{t('kugouMusic.version')}</div>
        </HeaderText>
      </Header>

      <Toolbar>
        <ToolbarBtn>{t('kugouMusic.playlist')}</ToolbarBtn>
        <ToolbarBtn>{t('kugouMusic.search')}</ToolbarBtn>
        <ToolbarBtn $active>{t('kugouMusic.onlineMusic')}</ToolbarBtn>
      </Toolbar>

      <Main>
        <VisualizerPanel>
          <CurrentSong>
            {isPlaying
              ? t('kugouMusic.nowPlaying', { title: currentSong.title, artist: currentSong.artist })
              : t('kugouMusic.stopped')}
          </CurrentSong>
          <Bars>
            {barDelays.map((delay, i) => (
              <Bar key={i} $active={isPlaying} $delay={delay} />
            ))}
          </Bars>
        </VisualizerPanel>

        <ListHeader>
          <Cell $width={24} $align="center">
            #
          </Cell>
          <Cell $flex={3}>{t('kugouMusic.columnTitle')}</Cell>
          <Cell $flex={2}>{t('kugouMusic.columnArtist')}</Cell>
          <Cell $flex={1} $align="right">
            {t('kugouMusic.columnDuration')}
          </Cell>
        </ListHeader>

        <ListBody>
          {songs.map((song, index) => (
            <ListRow
              key={song.id}
              $selected={selectedId === song.id || currentIndex === index}
              $playing={currentIndex === index && isPlaying}
              onClick={() => setSelectedId(song.id)}
              onDoubleClick={() => handleSongClick(index)}
            >
              <Cell $width={24} $align="center">
                {currentIndex === index && isPlaying ? (
                  <XPIcon name="media_play" size={12} />
                ) : (
                  index + 1
                )}
              </Cell>
              <Cell $flex={3}>{song.title}</Cell>
              <Cell $flex={2}>{song.artist}</Cell>
              <Cell $flex={1} $align="right">
                {formatTime(song.duration)}
              </Cell>
            </ListRow>
          ))}
        </ListBody>
      </Main>

      <Controls>
        <PlayButtons>
          <ControlBtn onClick={handlePrevious} title={t('kugouMusic.previous')}>
            <XPIcon name="media_previous" size={14} />
          </ControlBtn>
          <PlayBtn onClick={handlePlayPause} title={t('kugouMusic.playPause')}>
            <XPIcon name={isPlaying ? 'media_pause' : 'media_play'} size={18} />
          </PlayBtn>
          <ControlBtn onClick={handleNext} title={t('kugouMusic.next')}>
            <XPIcon name="media_next" size={14} />
          </ControlBtn>
        </PlayButtons>

        <ProgressArea>
          <ProgressTime>
            <span>{formatTime(progress)}</span>
            <span>{formatTime(currentSong.duration)}</span>
          </ProgressTime>
          <ProgressWrap onClick={handleProgressClick}>
            <ProgressFill $value={progressPercent} />
          </ProgressWrap>
        </ProgressArea>

        <VolumeArea title={t('kugouMusic.volume')}>
          <XPIcon name="volume_status" size={14} style={{ flexShrink: 0 }} />
          <VolumeSlider
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
          />
        </VolumeArea>
      </Controls>

      <StatusBar>
        <span>{t('kugouMusic.statusCount', { count: songs.length })}</span>
        <span>{isPlaying ? t('kugouMusic.statusPlaying') : t('kugouMusic.statusReady')}</span>
      </StatusBar>
    </Wrap>
  );
};

export default KugouMusic;
