import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';
import { useXPEventBus } from '../context/EventBusContext';
// Bundled no-copyright chime (synthesized tone) so the player works out of the
// box — the old '/audio/sample.mp3' path never existed and ignored the base URL (#85).
import sampleAudio from '../assets/audio/sample.wav';
import { resolveOSTheme } from '../themes/useOSTheme';
import type { ContentRef } from '../content/types';
import { isAssetRef, isUrlRef } from '../content/types';
import { useContentPacks } from '../context/ContentPackContext';
import { useOptionalFileSystem } from '../context/FileSystemContext';
import { isFileContentNode } from '../types';
import { useStorage } from '../context/StorageContext';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  blue500: '#0080FF',
  cyan500: '#00FFFF',
  blue800: '#0A2463',
  grey900: '#1A1A1A',
  grey700: '#444444',
};
/* brand-palette:end */

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 12px;
  user-select: none;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

const TitleBar = styled.div`
  background: ${PALETTE.blue800};
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
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
    ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
    ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
    ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  outline: none;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    border-color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
      ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
      ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
      ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
    padding-top: 1px;
    padding-left: 1px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
`;

const PlaybackBar = styled.div`
  background: ${PALETTE.grey900};
  padding: 8px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TimeDisplay = styled.div`
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.MONO};
  font-size: 11px;
`;

const ProgressBar = styled.input`
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_33};
  outline: none;
  border-radius: 3px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${PALETTE.cyan500};
    cursor: pointer;
  }
`;

const Visualization = styled.div`
  flex: 1;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
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
  background: linear-gradient(to top, ${PALETTE.cyan500}, ${PALETTE.blue500});
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
  background: ${PALETTE.grey900};
  padding: 8px;
  display: flex;
  gap: 12px;
  align-items: center;
`;

const AlbumArt = styled.div`
  width: 64px;
  height: 64px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_33};
  border: 1px solid ${PALETTE.grey700};
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
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_CC};
`;

const PlaylistPanel = styled.div`
  max-height: 92px;
  overflow: auto;
  margin-top: 6px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
`;

const TrackRow = styled.button<{ $active: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: 30px 1fr 120px;
  border: 0;
  padding: 3px 6px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  background: ${({ $active, theme }) =>
    $active ? resolveOSTheme(theme).tokens.MENU_HIGHLIGHT : resolveOSTheme(theme).tokens.GREY_33};
  font: inherit;
  text-align: left;
`;

const DEFAULT_SRC = sampleAudio;

export interface MediaControlsPolicy {
  seek?: boolean;
  skip?: boolean;
}

export interface MediaTrack {
  id: string;
  title: string;
  artist?: string;
  src: ContentRef | { path: string[] };
  durationHint?: number;
  provenance?: string;
  controls?: MediaControlsPolicy;
}

export interface MediaPlaylist {
  id: string;
  title?: string;
  tracks: MediaTrack[];
  startIndex?: number;
  autoAdvance?: boolean;
  repeat?: 'none' | 'one' | 'all';
  controls?: MediaControlsPolicy;
}

export interface WindowsMediaPlayerProps {
  windowId?: string;
  src?: string;
  playlist?: MediaPlaylist;
  playlistId?: string;
}

const WindowsMediaPlayer = ({
  windowId: _windowId,
  src = DEFAULT_SRC,
  playlist: playlistProp,
  playlistId,
}: WindowsMediaPlayerProps) => {
  const { t } = useTranslation();
  const bus = useXPEventBus();
  const audioRef = useRef<HTMLAudioElement>(null);
  const content = useContentPacks();
  const playlist = playlistProp ?? content.playlists.find(item => item.id === playlistId);
  const fs = useOptionalFileSystem();
  const storage = useStorage();
  const saved = useMemo(() => {
    if (!playlist) return undefined;
    try {
      const value = storage.local.getItem(storage.key('wmp_sessions'));
      const sessions = value
        ? (JSON.parse(value) as Record<string, { index: number; position: number }>)
        : {};
      return sessions[playlist.id];
    } catch {
      return undefined;
    }
  }, [playlist, storage]);
  const [trackIndex, setTrackIndex] = useState(saved?.index ?? playlist?.startIndex ?? 0);
  const [resolvedSrc, setResolvedSrc] = useState(src || DEFAULT_SRC);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const track = playlist?.tracks[trackIndex];
  const mediaSrc = playlist ? resolvedSrc : src || DEFAULT_SRC;
  const fileName = mediaSrc.split('/').pop() || 'Sample Music';
  const trackTitle = track?.title ?? fileName.replace(/\.[^/.]+$/, '');
  const controls = { ...playlist?.controls, ...track?.controls };
  const canSeek = controls.seek !== false;
  const canSkip = controls.skip !== false;

  useEffect(() => {
    let cancelled = false;
    const resolveTrack = async () => {
      if (!track) return;
      const ref = track.src;
      let next: string | undefined;
      if (typeof ref === 'object' && 'path' in ref) {
        const node = fs?.getFile(ref.path);
        if (node && isFileContentNode(node)) {
          if (node.contentRef && isUrlRef(node.contentRef)) next = node.contentRef.url;
          else next = node.content;
        }
      } else if (typeof ref === 'string') next = ref;
      else if (isUrlRef(ref)) next = ref.url;
      else if (isAssetRef(ref)) {
        const asset = content.assets[ref.asset];
        if (typeof asset === 'string') next = asset;
        else if (asset && isUrlRef(asset)) next = asset.url;
      }
      if (!cancelled) setResolvedSrc(next ?? '');
    };
    void resolveTrack();
    return () => {
      cancelled = true;
    };
  }, [content.assets, fs, track]);

  const changeTrack = useCallback(
    (nextIndex: number) => {
      if (!playlist || playlist.tracks.length === 0) return;
      let index = nextIndex;
      if (index >= playlist.tracks.length)
        index = playlist.repeat === 'all' ? 0 : playlist.tracks.length - 1;
      if (index < 0) index = playlist.repeat === 'all' ? playlist.tracks.length - 1 : 0;
      setTrackIndex(index);
      setCurrentTime(0);
      setIsPlaying(false);
      const next = playlist.tracks[index];
      bus.emit({ type: 'media:track-change', playlistId: playlist.id, trackId: next.id, index });
    },
    [bus, playlist]
  );

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
      bus.emit({
        type: 'media:ended',
        path: mediaSrc,
        trackId: track?.id,
        playlistId: playlist?.id,
      });
      if (!playlist) return;
      if (playlist.repeat === 'one') {
        audio.currentTime = 0;
        void audio.play();
      } else if ((playlist.autoAdvance ?? true) && trackIndex < playlist.tracks.length - 1) {
        changeTrack(trackIndex + 1);
      } else if (playlist.repeat === 'all') {
        changeTrack(0);
      } else {
        bus.emit({ type: 'media:playlist-ended', playlistId: playlist.id });
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      bus.emit({
        type: 'media:play',
        path: mediaSrc,
        title: trackTitle,
        trackId: track?.id,
        playlistId: playlist?.id,
      });
    };
    const handlePause = () => {
      setIsPlaying(false);
      bus.emit({
        type: 'media:pause',
        path: mediaSrc,
        trackId: track?.id,
        playlistId: playlist?.id,
      });
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
  }, [isDragging, bus, changeTrack, mediaSrc, playlist, track, trackIndex, trackTitle]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== mediaSrc) {
      audio.src = mediaSrc;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      if (saved?.position) audio.currentTime = saved.position;
    }
  }, [mediaSrc, saved?.position]);

  useEffect(() => {
    if (!playlist) return;
    try {
      const key = storage.key('wmp_sessions');
      const value = storage.local.getItem(key);
      const sessions = value
        ? (JSON.parse(value) as Record<string, { index: number; position: number }>)
        : {};
      sessions[playlist.id] = { index: trackIndex, position: currentTime };
      storage.local.setItem(key, JSON.stringify(sessions));
    } catch {
      // Playback persistence is best-effort.
    }
  }, [currentTime, playlist, storage, trackIndex]);

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
    bus.emit({
      type: 'media:seek',
      path: mediaSrc,
      position: newTime,
      trackId: track?.id,
      playlistId: playlist?.id,
    });
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
          {playlist && (
            <ControlBtn
              disabled={!canSkip || trackIndex === 0}
              onClick={() => changeTrack(trackIndex - 1)}
              title={t('mediaPlayer.previous')}
            >
              ◀
            </ControlBtn>
          )}
          <ControlBtn onClick={stopPlayback} title={t('mediaPlayer.stop')}>
            <XPIcon name="media_stop" size={16} />
          </ControlBtn>
          <ControlBtn
            onClick={togglePlay}
            title={isPlaying ? t('mediaPlayer.pause') : t('mediaPlayer.play')}
          >
            <XPIcon name={isPlaying ? 'media_pause' : 'media_play'} size={16} />
          </ControlBtn>
          {playlist && (
            <ControlBtn
              disabled={!canSkip || trackIndex === playlist.tracks.length - 1}
              onClick={() => changeTrack(trackIndex + 1)}
              title={t('mediaPlayer.next')}
            >
              ▶
            </ControlBtn>
          )}
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
          disabled={!canSeek}
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
          <TrackTitle>
            {trackTitle}
            {playlist ? ` (${trackIndex + 1}/${playlist.tracks.length})` : ''}
          </TrackTitle>
          <TrackArtist>
            {track?.artist ?? (isPlaying ? t('mediaPlayer.playing') : t('mediaPlayer.stopped'))}
          </TrackArtist>
        </TrackDetails>
      </TrackInfo>
      {playlist && (
        <PlaylistPanel>
          {playlist.tracks.map((item, index) => (
            <TrackRow
              key={item.id}
              $active={index === trackIndex}
              disabled={!canSkip && index !== trackIndex}
              onClick={() => changeTrack(index)}
            >
              <span>{index + 1}</span>
              <span>{item.title}</span>
              <span>{item.artist ?? ''}</span>
            </TrackRow>
          ))}
        </PlaylistPanel>
      )}
    </Wrap>
  );
};

export default WindowsMediaPlayer;
