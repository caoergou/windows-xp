import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';
import { useXPEventBus } from '../context/EventBusContext';
// Bundled no-copyright chime (synthesized tone) so the player works out of the
// box — the old '/audio/sample.mp3' path never existed and ignored the base URL (#85).
import sampleAudio from '../assets/audio/sample.wav';
import { FONTS } from '../constants';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: #000000;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: ${FONTS.UI};
  font-size: 12px;
  user-select: none;
  color: #ffffff;
`;

const TitleBar = styled.div`
  background: #0a2463;
  padding: 4px 8px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.div`
  font-weight: bold;
`;

const PlayerControls = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const ControlBtn = styled.button`
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  outline: none;
  background: #ece9d8;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    border-color: #808080 #ffffff #ffffff #808080;
    padding-top: 1px;
    padding-left: 1px;
  }
`;

const PlaybackBar = styled.div`
  background: #1a1a1a;
  padding: 8px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TimeDisplay = styled.div`
  font-family: ${FONTS.MONO};
  font-size: 11px;
`;

const ProgressBar = styled.input`
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: #333;
  outline: none;
  border-radius: 3px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #00ffff;
    cursor: pointer;
  }
`;

const Visualization = styled.div`
  flex: 1;
  background: #000000;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
  overflow: hidden;
`;

const SpectrumBar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100%;
  padding: 0 20px;
`;

const Bar = styled.div<{ $height: number; $delay: number; $isPlaying: boolean }>`
  width: 8px;
  background: linear-gradient(to top, #00ffff, #0080ff);
  height: ${p => p.$height}%;
  animation: ${p => (p.$isPlaying ? 'pulse 0.5s ease-in-out infinite' : 'none')};
  animation-delay: ${p => p.$delay}s;

  @keyframes pulse {
    0%,
    100% {
      height: ${p => p.$height}%;
    }
    50% {
      height: ${p => Math.min(p.$height + 30, 100)}%;
    }
  }
`;

const TrackInfo = styled.div`
  background: #1a1a1a;
  padding: 8px;
  display: flex;
  gap: 12px;
  align-items: center;
`;

const AlbumArt = styled.div`
  width: 64px;
  height: 64px;
  background: #333;
  border: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const TrackDetails = styled.div`
  flex: 1;
`;

const TrackTitle = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

const TrackArtist = styled.div`
  font-size: 11px;
  color: #cccccc;
`;

const DEFAULT_SRC = sampleAudio;

interface WindowsMediaPlayerProps {
  windowId?: string;
  src?: string;
}

const WindowsMediaPlayer = ({
  windowId: _windowId,
  src = DEFAULT_SRC,
}: WindowsMediaPlayerProps) => {
  const { t } = useTranslation();
  const bus = useXPEventBus();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const mediaSrc = src || DEFAULT_SRC;
  const fileName = mediaSrc.split('/').pop() || 'Sample Music';
  const trackTitle = fileName.replace(/\.[^/.]+$/, '');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      bus.emit({ type: 'media:ended', path: mediaSrc });
    };
    const handlePlay = () => {
      setIsPlaying(true);
      bus.emit({ type: 'media:play', path: mediaSrc, title: trackTitle });
    };
    const handlePause = () => {
      setIsPlaying(false);
      bus.emit({ type: 'media:pause', path: mediaSrc });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isDragging, bus, mediaSrc, trackTitle]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== mediaSrc) {
      audio.src = mediaSrc;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [mediaSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audio.play()?.catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const stopPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const value = parseFloat(e.target.value);
    const newTime = (value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    bus.emit({ type: 'media:seek', path: mediaSrc, position: newTime });
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const spectrumHeights = [40, 60, 30, 70, 50, 80, 45, 65, 35, 75];

  return (
    <Wrap>
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />

      <TitleBar>
        <Title>Windows Media Player</Title>
        <PlayerControls>
          <ControlBtn onClick={stopPlayback} title={t('mediaPlayer.stop')}>
            <XPIcon name="media_stop" size={16} />
          </ControlBtn>
          <ControlBtn
            onClick={togglePlay}
            title={isPlaying ? t('mediaPlayer.pause') : t('mediaPlayer.play')}
          >
            <XPIcon name={isPlaying ? 'media_pause' : 'media_play'} size={16} />
          </ControlBtn>
        </PlayerControls>
      </TitleBar>

      <Visualization>
        <SpectrumBar>
          {spectrumHeights.map((height, index) => (
            <Bar key={index} $height={height} $delay={index * 0.1} $isPlaying={isPlaying} />
          ))}
        </SpectrumBar>
      </Visualization>

      <PlaybackBar>
        <TimeDisplay>{formatTime(currentTime)}</TimeDisplay>
        <ProgressBar
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleSeek}
          onMouseDown={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onTouchStart={handleSeekStart}
          onTouchEnd={handleSeekEnd}
        />
        <TimeDisplay>{formatTime(duration)}</TimeDisplay>
      </PlaybackBar>

      <TrackInfo>
        <AlbumArt>
          <XPIcon name="cd_rom" size={48} />
        </AlbumArt>
        <TrackDetails>
          <TrackTitle>{trackTitle}</TrackTitle>
          <TrackArtist>
            {isPlaying ? t('mediaPlayer.playing') : t('mediaPlayer.stopped')}
          </TrackArtist>
        </TrackDetails>
      </TrackInfo>
    </Wrap>
  );
};

export default WindowsMediaPlayer;
