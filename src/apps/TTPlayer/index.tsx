import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { CultureAppShell } from '../culture/shell';
import { useTranslation } from 'react-i18next';
import XPIcon from '../../components/XPIcon';
// Same bundled, licence-clear sample clip Winamp/WindowsMediaPlayer use — the
// project's established real-playback plumbing (no `new Audio`, no new assets).
import sampleAudio from '../../assets/audio/sample.wav';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { DEFAULT_PLAYLIST_IDS, TRACK_POOL, type TTTrack } from './content';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  black: '#000000',
  green950: '#031007',
  green900: '#06200E',
  green850: '#0A2C15',
  green800: '#0E3A1D',
  grey900: '#121612',
  grey850: '#181D18',
  grey800: '#202620',
  grey750: '#283028',
  grey700: '#333D33',
  green700: '#1F7A3A',
  green600: '#2F9A4C',
  green500: '#35FF6A',
  green400: '#7BD68F',
  green300: '#A9E8B8',
  grey500: '#556055',
  grey400: '#8A968A',
  grey200: '#C7D2C7',
  grey100: '#E6EDE6',
  white: '#FFFFFF',
};
/* brand-palette:end */

/**
 * TTPlayer（千千静听）— the 2002–2007 classic Chinese music player, for the
 * `zh` culture package. Original self-drawn skin (black/green LED look) as a
 * homage; layout only references the open-source remake haixiangyan/ttplayer
 * (MIT) — no copied code or assets. See ./NOTICE.md.
 *
 * One window hosts the classic three areas as toggleable panels: main player
 * (LED screen + spectrum + transport), playlist editor and the lyrics view
 * (歌词秀). Real playback reuses the bundled sample clip like Winamp (#123);
 * track lengths come from the data layer, so the displayed time/lyrics are
 * scaled from the clip's real clock onto each track's declared duration.
 */

type PlayMode = 'loop' | 'one';

const pulse = keyframes`0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}`;

const Wrap = styled(CultureAppShell)`
  position: relative;
  background: ${PALETTE.grey850};
  color: ${PALETTE.grey200};
`;

/* ---- classic green-on-black title strip ---- */
const TitleStrip = styled.div`
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  background: linear-gradient(
    to bottom,
    ${PALETTE.grey750} 0%,
    ${PALETTE.grey900} 55%,
    ${PALETTE.black} 100%
  );
  border-bottom: 1px solid ${PALETTE.black};
`;

const TitleText = styled.div`
  flex: 1;
  min-width: 0;
  color: ${PALETTE.green500};
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 0 0 6px rgba(53, 255, 106, 0.55);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  .ver {
    color: ${PALETTE.grey400};
    font-weight: normal;
    font-size: 10px;
    letter-spacing: 1px;
  }
`;

const TitleBtn = styled.button<{ $active?: boolean }>`
  height: 18px;
  padding: 0 8px;
  font-size: 10px;
  font-family: inherit;
  cursor: pointer;
  color: ${p => (p.$active ? PALETTE.black : PALETTE.green400)};
  background: ${p =>
    p.$active
      ? `linear-gradient(to bottom, ${PALETTE.green400} 0%, ${PALETTE.green600} 100%)`
      : `linear-gradient(to bottom, ${PALETTE.grey750} 0%, ${PALETTE.grey900} 100%)`};
  border: 1px solid ${p => (p.$active ? PALETTE.green500 : PALETTE.grey700)};
  border-radius: 2px;
  &:hover {
    color: ${p => (p.$active ? PALETTE.black : PALETTE.green500)};
    border-color: ${PALETTE.green600};
  }
`;

/* ---- main player panel ---- */
const PlayerPanel = styled.div`
  flex-shrink: 0;
  padding: 8px;
  background: linear-gradient(to bottom, ${PALETTE.grey800} 0%, ${PALETTE.grey900} 100%);
  border-bottom: 1px solid ${PALETTE.black};
`;

const Led = styled.div`
  background: ${PALETTE.green950};
  border: 1px solid ${PALETTE.black};
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.9);
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${PALETTE.green500};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.MONO};
`;

const LedTime = styled.div`
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 1px;
  min-width: 62px;
  text-shadow: 0 0 6px rgba(53, 255, 106, 0.7);
`;

const LedMeta = styled.div`
  flex: 1;
  min-width: 0;
  line-height: 1.5;
  .kbps {
    font-size: 9px;
    opacity: 0.8;
  }
`;

const Marquee = styled.div<{ $playing?: boolean }>`
  overflow: hidden;
  white-space: nowrap;
  font-size: 11px;
  text-shadow: 0 0 5px rgba(53, 255, 106, 0.6);
  span {
    display: inline-block;
    padding-left: ${p => (p.$playing ? '100%' : '0')};
    animation: ${p =>
      p.$playing
        ? css`
            ${keyframes`from{transform:translateX(0)}to{transform:translateX(-200%)}`} 9s linear
              infinite
          `
        : 'none'};
  }
`;

const Bars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 26px;
  margin-top: 6px;
  padding: 0 2px;
`;

const Bar = styled.div<{ $active?: boolean; $delay: number }>`
  flex: 1;
  height: 100%;
  transform-origin: bottom;
  background: linear-gradient(to top, ${PALETTE.green700} 0%, ${PALETTE.green500} 100%);
  opacity: ${p => (p.$active ? 1 : 0.25)};
  animation: ${p =>
    p.$active
      ? css`
          ${pulse} 0.7s ease-in-out infinite
        `
      : 'none'};
  animation-delay: ${p => p.$delay}s;
`;

const Slider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: ${PALETTE.grey900};
  border: 1px solid ${PALETTE.black};
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(to bottom, ${PALETTE.green400}, ${PALETTE.green700});
    border: 1px solid ${PALETTE.black};
  }
`;

const Seek = styled(Slider)`
  width: 100%;
  margin: 8px 0 2px;
`;

const Transport = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
`;

const Btn = styled.button`
  width: 28px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${PALETTE.black};
  border-radius: 2px;
  cursor: pointer;
  color: ${PALETTE.grey100};
  background: linear-gradient(to bottom, ${PALETTE.grey700} 0%, ${PALETTE.grey800} 100%);
  &:hover {
    background: linear-gradient(to bottom, ${PALETTE.grey750} 0%, ${PALETTE.grey700} 100%);
  }
  &:active {
    background: ${PALETTE.grey900};
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
  }
`;

const ModeBtn = styled(Btn)`
  width: auto;
  padding: 0 6px;
  font-size: 9px;
  font-family: inherit;
  color: ${PALETTE.green400};
`;

const VolRow = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  min-width: 0;
`;

/* ---- shared panel headers (playlist / lyrics) ---- */
const PanelHead = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(to bottom, ${PALETTE.green800} 0%, ${PALETTE.green900} 100%);
  color: ${PALETTE.green300};
  border-top: 1px solid ${PALETTE.black};
  border-bottom: 1px solid ${PALETTE.black};
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 3px 8px;
  .spacer {
    flex: 1;
  }
`;

const HeadBtn = styled.button`
  height: 16px;
  padding: 0 6px;
  font-size: 10px;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  color: ${PALETTE.green300};
  background: ${PALETTE.green950};
  border: 1px solid ${PALETTE.green800};
  border-radius: 2px;
  &:hover {
    color: ${PALETTE.green500};
    border-color: ${PALETTE.green600};
  }
  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;

/* ---- playlist ---- */
const Playlist = styled.div`
  height: 132px;
  flex-shrink: 0;
  overflow-y: auto;
  background: ${PALETTE.green950};
`;

const Row = styled.div<{ $current?: boolean; $selected?: boolean }>`
  display: flex;
  padding: 3px 8px;
  cursor: pointer;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.MONO};
  font-size: 11px;
  color: ${p => (p.$current ? PALETTE.green500 : PALETTE.grey200)};
  background: ${p =>
    p.$selected ? PALETTE.green850 : p.$current ? PALETTE.green900 : 'transparent'};
  &:hover {
    background: ${p => (p.$selected ? PALETTE.green850 : PALETTE.grey800)};
  }
  .num {
    width: 22px;
    color: ${PALETTE.grey500};
  }
  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dur {
    color: ${p => (p.$current ? PALETTE.green400 : PALETTE.grey400)};
  }
`;

/* ---- lyrics view (歌词秀) ---- */
const LyricsBox = styled.div`
  flex: 1;
  min-height: 64px;
  overflow-y: auto;
  background: ${PALETTE.black};
  padding: 8px 0;
  text-align: center;
`;

const LrcLine = styled.div<{ $active?: boolean }>`
  padding: 2px 12px;
  font-size: ${p => (p.$active ? '13px' : '11px')};
  font-weight: ${p => (p.$active ? 'bold' : 'normal')};
  color: ${p => (p.$active ? PALETTE.green500 : PALETTE.grey500)};
  text-shadow: ${p => (p.$active ? '0 0 6px rgba(53, 255, 106, 0.6)' : 'none')};
  transition: color 0.2s linear;
`;

/* ---- about overlay ---- */
const AboutOverlay = styled.div`
  position: absolute;
  left: 12px;
  right: 12px;
  top: 34px;
  z-index: 1;
  background: ${PALETTE.green950};
  border: 1px solid ${PALETTE.green700};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  padding: 10px 12px;
  font-size: 11px;
  line-height: 1.7;
  color: ${PALETTE.grey200};
  .heading {
    color: ${PALETTE.green500};
    font-weight: bold;
    margin-bottom: 4px;
  }
  a {
    color: ${PALETTE.green400};
  }
`;

const AboutClose = styled(HeadBtn)`
  margin-top: 8px;
`;

/* ---- status bar ---- */
const StatusBar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 8px;
  background: linear-gradient(to bottom, ${PALETTE.grey800} 0%, ${PALETTE.grey900} 100%);
  border-top: 1px solid ${PALETTE.black};
  font-size: 10px;
  color: ${PALETTE.grey400};
`;

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

interface TTPlayerProps {
  windowId?: string;
}

const TTPlayer: React.FC<TTPlayerProps> = () => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const [tracks, setTracks] = useState<TTTrack[]>(() =>
    DEFAULT_PLAYLIST_IDS.map(id => TRACK_POOL.find(track => track.id === id) as TTTrack)
  );
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [mode, setMode] = useState<PlayMode>('loop');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showLyrics, setShowLyrics] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  const track = tracks[index] ?? tracks[0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setClipDuration(audio.duration || 0);
    const onEnd = () => {
      if (mode === 'one') {
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
      } else {
        setIndex(i => (i + 1) % tracks.length);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [mode, tracks.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume / 100;
  }, [volume]);

  // Restart the clip whenever the track changes while playing (Winamp pattern).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setTime(0);
    if (playing) void audio.play().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, track?.id]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setTime(0);
  }, []);

  const playAt = useCallback(
    (i: number) => {
      setSelectedId(tracks[i].id);
      setIndex(i);
      setPlaying(true);
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
      }
    },
    [tracks]
  );

  const skip = useCallback(
    (delta: number) => {
      const next = (index + delta + tracks.length) % tracks.length;
      playAt(next);
    },
    [index, tracks.length, playAt]
  );

  // The bundled clip is short; map its real clock onto the track's declared
  // duration so the LED readout and the lyrics move at the displayed pace.
  const scaledTime = clipDuration ? (time / clipDuration) * track.duration : 0;

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = (pct / 100) * audio.duration;
    setTime(audio.currentTime);
  }, []);

  const lyricIndex = useMemo(() => {
    if (!track) return -1;
    let current = -1;
    track.lrc.forEach((line, i) => {
      if (scaledTime >= line.time) current = i;
    });
    return current;
  }, [track, scaledTime]);

  // Keep the active lyric centred (instant jump — XP has no smooth scrolling).
  useEffect(() => {
    const box = lyricsRef.current;
    if (!box || lyricIndex < 0) return;
    const active = box.children[lyricIndex] as HTMLElement | undefined;
    if (active) box.scrollTop = active.offsetTop - box.clientHeight / 2;
  }, [lyricIndex]);

  const canAdd = tracks.length < TRACK_POOL.length;
  const addTrack = useCallback(() => {
    const next = TRACK_POOL.find(poolTrack => !tracks.some(t2 => t2.id === poolTrack.id));
    if (next) setTracks(prev => [...prev, next]);
  }, [tracks]);

  const removeSelected = useCallback(() => {
    if (!selectedId || tracks.length <= 1) return;
    const removeIndex = tracks.findIndex(t2 => t2.id === selectedId);
    if (removeIndex < 0) return;
    const next = tracks.filter(t2 => t2.id !== selectedId);
    setTracks(next);
    setSelectedId(null);
    if (removeIndex === index) {
      setIndex(0);
      stop();
    } else if (removeIndex < index) {
      setIndex(i => i - 1);
    }
  }, [selectedId, tracks, index, stop]);

  const bars = useMemo(() => Array.from({ length: 24 }, (_, i) => (i % 8) * 0.09), []);

  if (!track) return null;

  return (
    <Wrap data-testid="ttplayer">
      <audio ref={audioRef} src={sampleAudio} preload="metadata" />

      <TitleStrip>
        <TitleText>
          {t('ttplayer.title')} <span className="ver">{t('ttplayer.version')}</span>
        </TitleText>
        <TitleBtn
          $active={showPlaylist}
          onClick={() => setShowPlaylist(v => !v)}
          title={t('ttplayer.playlist')}
        >
          {t('ttplayer.playlist')}
        </TitleBtn>
        <TitleBtn
          $active={showLyrics}
          onClick={() => setShowLyrics(v => !v)}
          title={t('ttplayer.lyrics')}
        >
          {t('ttplayer.lyrics')}
        </TitleBtn>
        <TitleBtn onClick={() => setShowAbout(v => !v)} title={t('ttplayer.about')}>
          {t('ttplayer.about')}
        </TitleBtn>
      </TitleStrip>

      {showAbout && (
        <AboutOverlay data-testid="ttplayer-about">
          <div className="heading">
            {t('ttplayer.title')} · {t('ttplayer.about')}
          </div>
          <div>{t('ttplayer.aboutRef')}</div>
          <div>{t('ttplayer.aboutCredit')}</div>
          <AboutClose onClick={() => setShowAbout(false)}>{t('ttplayer.close')}</AboutClose>
        </AboutOverlay>
      )}

      <PlayerPanel>
        <Led>
          <LedTime data-testid="ttplayer-time">{fmt(scaledTime)}</LedTime>
          <LedMeta>
            <Marquee $playing={playing}>
              <span>
                {index + 1}. {track.artist} — {track.title}
              </span>
            </Marquee>
            <div className="kbps">128 kbps &nbsp; 44 kHz &nbsp; {fmt(track.duration)}</div>
          </LedMeta>
        </Led>
        <Bars>
          {bars.map((d, i) => (
            <Bar key={i} $active={playing} $delay={d} />
          ))}
        </Bars>
        <Seek
          type="range"
          min={0}
          max={100}
          value={Math.round(track.duration ? (scaledTime / track.duration) * 100 : 0)}
          onChange={e => seek(Number(e.target.value))}
          aria-label="seek"
        />
        <Transport>
          <Btn onClick={() => skip(-1)} title={t('ttplayer.previous')}>
            <XPIcon name="media_previous" size={12} />
          </Btn>
          <Btn data-testid="ttplayer-play" onClick={toggle} title={t('ttplayer.playPause')}>
            <XPIcon name={playing ? 'media_pause' : 'media_play'} size={12} />
          </Btn>
          <Btn onClick={stop} title={t('ttplayer.stop')}>
            <XPIcon name="media_stop" size={12} />
          </Btn>
          <Btn onClick={() => skip(1)} title={t('ttplayer.next')}>
            <XPIcon name="media_next" size={12} />
          </Btn>
          <ModeBtn
            onClick={() => setMode(m => (m === 'loop' ? 'one' : 'loop'))}
            title={mode === 'loop' ? t('ttplayer.modeLoop') : t('ttplayer.modeOne')}
          >
            {mode === 'loop' ? t('ttplayer.modeLoop') : t('ttplayer.modeOne')}
          </ModeBtn>
          <VolRow title={t('ttplayer.volume')}>
            <XPIcon name="volume_status" size={12} style={{ flexShrink: 0 }} />
            <Slider
              style={{ flex: 1 }}
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              aria-label="volume"
            />
          </VolRow>
        </Transport>
      </PlayerPanel>

      {showPlaylist && (
        <>
          <PanelHead>
            <span>{t('ttplayer.playlist')}</span>
            <span className="spacer" />
            <HeadBtn onClick={addTrack} disabled={!canAdd} title={t('ttplayer.add')}>
              <XPIcon name="add" size={10} />
              {t('ttplayer.add')}
            </HeadBtn>
            <HeadBtn
              onClick={removeSelected}
              disabled={!selectedId || tracks.length <= 1}
              title={t('ttplayer.remove')}
            >
              <XPIcon name="remove" size={10} />
              {t('ttplayer.remove')}
            </HeadBtn>
          </PanelHead>
          <Playlist>
            {tracks.map((item, i) => (
              <Row
                key={item.id}
                $current={i === index}
                $selected={selectedId === item.id}
                onClick={() => setSelectedId(item.id)}
                onDoubleClick={() => playAt(i)}
              >
                <span className="num">{i + 1}.</span>
                <span className="name">
                  {item.artist} — {item.title}
                </span>
                <span className="dur">{fmt(item.duration)}</span>
              </Row>
            ))}
          </Playlist>
        </>
      )}

      {showLyrics && (
        <>
          <PanelHead>
            <span>{t('ttplayer.lyrics')}</span>
          </PanelHead>
          <LyricsBox ref={lyricsRef} data-testid="ttplayer-lyrics">
            {track.lrc.map((line, i) => (
              <LrcLine key={i} $active={i === lyricIndex}>
                {line.text}
              </LrcLine>
            ))}
          </LyricsBox>
        </>
      )}

      <StatusBar>
        <span>{t('ttplayer.statusCount', { count: tracks.length })}</span>
        <span>{playing ? t('ttplayer.statusPlaying') : t('ttplayer.statusReady')}</span>
      </StatusBar>
    </Wrap>
  );
};

export default TTPlayer;
