import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { CultureAppShell } from './culture/shell';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const Wrap = styled(CultureAppShell)`
  background: #1a1a1a;
  color: #eeeeee;
`;

const Header = styled.div`
  background: linear-gradient(to bottom, #2a3a5a 0%, #1a2338 50%, #101520 100%);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #0a0f18;
  flex-shrink: 0;
`;

const LogoBox = styled.div`
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #ffdd55 0%, #ff8800 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
`;

const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M11 2C6 2 4 7 4 10c0 4 3 8 7 8s7-4 7-8c0-3-2-8-7-8zm0 3c2.5 0 4 2.5 4 5s-1.5 5-4 5-4-2.5-4-5 1.5-5 4-5z"
      fill="#fff"
    />
    <path d="M9 8l5 2.5-5 2.5V8z" fill="#fff" />
  </svg>
);

const HeaderText = styled.div`
  color: white;
  line-height: 1.3;

  .title {
    font-size: 15px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
  }

  .version {
    font-size: 10px;
    color: #aabbdd;
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
  background: #000000;
`;

const VideoArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #000000;
  position: relative;
`;

const Screen = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #1a2338 0%, #000000 70%);
  color: #8899bb;
  gap: 16px;
  position: relative;
`;

const SplashLogo = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ffdd55 0%, #ff8800 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
`;

const SplashText = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 136, 0, 0.6);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const OpenFileHint = styled.div`
  font-size: 12px;
  color: #667799;
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  font-size: 11px;
  color: #ffaa33;
`;

const ControlsBar = styled.div`
  height: 46px;
  background: linear-gradient(to bottom, #3a3f4a 0%, #252a33 100%);
  border-top: 1px solid #4a505c;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  flex-shrink: 0;
`;

const ControlBtn = styled.button`
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #555b66 0%, #3a4048 100%);
  border: 1px solid;
  border-color: #6a707a #2a2e35 #2a2e35 #6a707a;
  border-radius: 2px;
  color: #eeeeee;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: linear-gradient(to bottom, #636b78 0%, #4a5058 100%);
  }

  &:active {
    background: linear-gradient(to bottom, #2a2e35 0%, #3a4048 100%);
    border-color: #2a2e35 #6a707a #6a707a #2a2e35;
    padding-top: 1px;
    padding-left: 1px;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ProgressArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 80px;
  padding: 0 4px;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  background: #111111;
  border: 1px solid #000000;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
`;

const ProgressFill = styled.div<{ $value: number }>`
  width: ${p => p.$value}%;
  height: 100%;
  background: linear-gradient(to bottom, #ffcc66 0%, #ff8800 100%);
  border-radius: 4px 0 0 4px;
  transition: width 0.1s linear;
`;

const ProgressTime = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #aabbcc;
  font-family: 'Courier New', monospace;
`;

const VolumeArea = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 80px;
`;

const VolumeSlider = styled.input`
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: #111111;
  border: 1px solid #000000;
  border-radius: 3px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(to bottom, #ffcc66 0%, #ff8800 100%);
    cursor: pointer;
    border: 1px solid #aa5500;
  }
`;

const Playlist = styled.div`
  width: 170px;
  flex-shrink: 0;
  background: linear-gradient(to bottom, #2a2e35 0%, #1e2127 100%);
  border-left: 1px solid #3a3f4a;
  display: flex;
  flex-direction: column;
`;

const PlaylistTitle = styled.div`
  padding: 6px 10px;
  background: linear-gradient(to bottom, #363b45 0%, #2a2e35 100%);
  border-bottom: 1px solid #1a1d22;
  font-weight: bold;
  color: #ccddee;
  font-size: 12px;
`;

const PlaylistBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px;
`;

const PlaylistItem = styled.div<{ $active?: boolean }>`
  padding: 6px 8px;
  margin-bottom: 2px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 11px;
  color: ${p => (p.$active ? '#ffffff' : '#aabbcc')};
  background: ${p =>
    p.$active ? 'linear-gradient(to bottom, #4a505c 0%, #363b45 100%)' : 'transparent'};
  border: 1px solid ${p => (p.$active ? '#5a606c' : 'transparent')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: ${p =>
      p.$active ? 'linear-gradient(to bottom, #4a505c 0%, #363b45 100%)' : '#333842'};
  }
`;

const StatusBar = styled.div`
  height: 22px;
  background: linear-gradient(to bottom, #2a2e35 0%, #1a1d22 100%);
  border-top: 1px solid #3a3f4a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  font-size: 11px;
  color: #8899aa;
  flex-shrink: 0;
`;

interface PlaylistEntry {
  id: string;
  name: string;
  duration: number;
}

const defaultPlaylist: PlaylistEntry[] = [
  { id: '1', name: '还珠格格.rmvb', duration: 2580 },
  { id: '2', name: '武林外传.avi', duration: 1460 },
  { id: '3', name: '大话西游.mkv', duration: 5940 },
  { id: '4', name: '家有儿女.mp4', duration: 1320 },
  { id: '5', name: '天龙八部.wmv', duration: 2880 },
];

interface BaofengPlayerProps {
  windowId?: string;
}

const BaofengPlayer: React.FC<BaofengPlayerProps> = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(80);
  const timerRef = useRef<number | null>(null);

  const currentTrack = defaultPlaylist[currentIndex];
  const duration = currentTrack.duration;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, duration]);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [currentIndex]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleTrackClick = useCallback((index: number) => {
    setCurrentIndex(index);
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setCurrentTime(Math.floor(ratio * duration));
    },
    [duration]
  );

  const statusText = useMemo(() => {
    if (isPlaying) return t('baofengPlayer.status.playing', 'Playing');
    if (currentTime > 0) return t('baofengPlayer.status.paused', 'Paused');
    return t('baofengPlayer.status.ready', 'Ready');
  }, [isPlaying, currentTime, t]);

  return (
    <Wrap>
      <Header>
        <LogoBox>
          <LogoIcon />
        </LogoBox>
        <HeaderText>
          <div className="title">{t('baofengPlayer.title', 'Baofeng Player')}</div>
          <div className="version">{t('baofengPlayer.version', '3.6 Smart Edition')}</div>
        </HeaderText>
      </Header>

      <Main>
        <VideoArea>
          <Screen>
            {currentTime > 0 || isPlaying ? (
              <>
                <VideoOverlay>
                  {t('baofengPlayer.playing', 'Now playing')}: {currentTrack.name}
                </VideoOverlay>
                <SplashLogo>
                  <LogoIcon />
                </SplashLogo>
                <SplashText>{t('baofengPlayer.brand', 'Baofeng Player')}</SplashText>
              </>
            ) : (
              <>
                <SplashLogo>
                  <LogoIcon />
                </SplashLogo>
                <SplashText>{t('baofengPlayer.brand', 'Baofeng Player')}</SplashText>
                <OpenFileHint>{t('baofengPlayer.openFileHint', 'Click to open file')}</OpenFileHint>
              </>
            )}
          </Screen>

          <ControlsBar>
            <ControlBtn
              onClick={togglePlay}
              title={
                isPlaying ? t('baofengPlayer.pause', 'Pause') : t('baofengPlayer.play', 'Play')
              }
            >
              <XPIcon name={isPlaying ? 'media_pause' : 'media_play'} size={16} />
            </ControlBtn>
            <ControlBtn onClick={stop} title={t('baofengPlayer.stop', 'Stop')}>
              <XPIcon name="media_stop" size={16} />
            </ControlBtn>

            <ProgressArea>
              <ProgressTrack onClick={handleProgressClick}>
                <ProgressFill $value={progress} />
              </ProgressTrack>
              <ProgressTime>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </ProgressTime>
            </ProgressArea>

            <VolumeArea>
              <XPIcon name="volume_status" size={14} style={{ flexShrink: 0 }} />
              <VolumeSlider
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={e => setVolume(parseInt(e.target.value, 10))}
              />
            </VolumeArea>

            <ControlBtn title={t('baofengPlayer.fullscreen', 'Full Screen')}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{ color: '#aabbcc' }}
              >
                <path
                  d="M2 6V2h4M8 2h4v4M12 8v4H8M6 12H2V8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </ControlBtn>
          </ControlsBar>
        </VideoArea>

        <Playlist>
          <PlaylistTitle>{t('baofengPlayer.playlist', 'Playlist')}</PlaylistTitle>
          <PlaylistBody>
            {defaultPlaylist.map((item, index) => (
              <PlaylistItem
                key={item.id}
                $active={index === currentIndex}
                onClick={() => handleTrackClick(index)}
                title={item.name}
              >
                {item.name}
              </PlaylistItem>
            ))}
          </PlaylistBody>
        </Playlist>
      </Main>

      <StatusBar>
        <span>{statusText}</span>
        <span>
          {t('baofengPlayer.volumeLabel', 'Volume')}: {volume}%
        </span>
      </StatusBar>
    </Wrap>
  );
};

export default BaofengPlayer;
