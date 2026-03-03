import React, { useState } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: #000000;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', Tahoma, sans-serif;
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
  background: #d4d0c8;
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
  font-family: 'Courier New', monospace;
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

const Bar = styled.div<{ $height: number; $delay: number }>`
  width: 8px;
  background: linear-gradient(to top, #00ffff, #0080ff);
  height: ${p => p.$height}%;
  animation: pulse 0.5s ease-in-out infinite;
  animation-delay: ${p => p.$delay}s;

  @keyframes pulse {
    0%, 100% { height: ${p => p.$height}%; }
    50% { height: ${p => Math.min(p.$height + 30, 100)}%; }
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

interface Track {
  title: string;
  artist: string;
  duration: number;
}

interface WindowsMediaPlayerProps {
  windowId?: string;
}

const WindowsMediaPlayer = ({ windowId }: WindowsMediaPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(300);
  const [volume, setVolume] = useState<number>(80);

  const tracks: Track[] = [
    { title: 'Windows XP Startup', artist: 'Microsoft', duration: 300 },
    { title: 'Bliss', artist: 'Microsoft', duration: 240 },
    { title: 'Connected', artist: 'Microsoft', duration: 180 }
  ];
  const [currentTrack, setCurrentTrack] = useState<number>(0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
    setCurrentTime(0);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100;

  const spectrumHeights = [40, 60, 30, 70, 50, 80, 45, 65, 35, 75];

  return (
    <Wrap>
      <TitleBar>
        <Title>Windows Media Player</Title>
        <PlayerControls>
          <ControlBtn onClick={prevTrack} title="上一首">⏮️</ControlBtn>
          <ControlBtn onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
            {isPlaying ? '⏸️' : '▶️'}
          </ControlBtn>
          <ControlBtn onClick={nextTrack} title="下一首">⏭️</ControlBtn>
        </PlayerControls>
      </TitleBar>

      <Visualization>
        <SpectrumBar>
          {spectrumHeights.map((height, index) => (
            <Bar key={index} $height={height} $delay={index * 0.1} />
          ))}
        </SpectrumBar>
      </Visualization>

      <PlaybackBar>
        <TimeDisplay>{formatTime(currentTime)}</TimeDisplay>
        <ProgressBar
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setCurrentTime((parseFloat(e.target.value) / 100) * duration)}
        />
        <TimeDisplay>{formatTime(duration)}</TimeDisplay>
      </PlaybackBar>

      <TrackInfo>
        <AlbumArt>💿</AlbumArt>
        <TrackDetails>
          <TrackTitle>{tracks[currentTrack].title}</TrackTitle>
          <TrackArtist>{tracks[currentTrack].artist}</TrackArtist>
        </TrackDetails>
      </TrackInfo>
    </Wrap>
  );
};

export default WindowsMediaPlayer;
