import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
// Reuse the engine's bundled sample clip (an existing, licence-clear asset) —
// the classic "reuse the WMP audio plumbing" from #123.
import sampleAudio from '../assets/audio/sample.wav';
import { resolveOSTheme } from '../themes/useOSTheme';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  black: '#000000',
  green900: '#05170B',
  black2: '#0B0B0B',
  blue900: '#0C2540',
  black3: '#111111',
  grey900: '#161616',
  green9002: '#16240F',
  blue800: '#163A5C',
  grey9002: '#1C1C1C',
  green9003: '#1C2E13',
  green700: '#1F7A3A',
  grey9003: '#202020',
  grey9004: '#232323',
  grey800: '#2A2A2A',
  blue700: '#2B5A86',
  green600: '#2F9A4C',
  grey8002: '#333333',
  green400: '#35FF6A',
  grey8003: '#3B3B3B',
  grey700: '#4A4A4A',
  grey7002: '#565656',
  grey600: '#6A6A6A',
  green500: '#6A9A76',
  green300: '#7BD68F',
  grey400: '#9A9A9A',
  blue200: '#BCD6EF',
  grey200: '#C7C7C7',
  grey2002: '#D6D6D6',
  grey100: '#E0E0E0',
};
/* brand-palette:end */

/**
 * Winamp — a 2000s-style MP3 player for the `en` culture package (#123).
 *
 * Original parody artwork/skin (charcoal body, LCD-green readout, spectrum
 * bars); no ripped Winamp assets. Real playback via the bundled sample clip.
 * "It really whips the llama's ass." 🦙
 */

interface Track {
  title: string;
  artist: string;
  /** Displayed duration (mm:ss); playback uses the bundled sample regardless. */
  duration: string;
}

const PLAYLIST: Track[] = [
  { title: 'Intro (Sample)', artist: 'Llama Sound System', duration: '0:12' },
  { title: 'Dial-Up Dreams', artist: 'The 56k Modems', duration: '3:41' },
  { title: 'LAN Party Anthem', artist: 'Counter-Strike OST', duration: '4:12' },
  { title: 'Napster Nights', artist: 'MP3 Collective', duration: '3:58' },
  { title: 'CRT Glow', artist: 'Cathode', duration: '5:03' },
];

const pulse = keyframes`0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}`;

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${PALETTE.grey9004};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.CLASSIC};
  font-size: 11px;
  color: ${PALETTE.grey2002};
  user-select: none;
  overflow: hidden;
`;

const Player = styled.div`
  background: linear-gradient(to bottom, ${PALETTE.grey8003} 0%, ${PALETTE.grey9003} 100%);
  border-bottom: 1px solid ${PALETTE.black};
  padding: 8px;
  flex-shrink: 0;
`;

const TitleBar = styled.div`
  height: 14px;
  background: linear-gradient(to bottom, ${PALETTE.blue700} 0%, ${PALETTE.blue800} 100%);
  border: 1px solid ${PALETTE.blue900};
  color: ${PALETTE.blue200};
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  padding: 0 5px;
  text-transform: uppercase;
`;

const Lcd = styled.div`
  margin-top: 6px;
  background: ${PALETTE.green900};
  border: 1px solid ${PALETTE.black};
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.8);
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${PALETTE.green400};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.MONO};
`;

const Time = styled.div`
  font-size: 22px;
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(53, 255, 106, 0.7);
  min-width: 66px;
`;

const Meta = styled.div`
  flex: 1;
  min-width: 0;
  line-height: 1.5;
  .kbps {
    font-size: 9px;
    opacity: 0.85;
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
            ${keyframes`from{transform:translateX(0)}to{transform:translateX(-200%)}`} 9s linear infinite
          `
        : 'none'};
  }
`;

const Bars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 28px;
  margin-top: 6px;
  padding: 0 2px;
`;

const Bar = styled.div<{ $active?: boolean; $delay: number }>`
  flex: 1;
  height: 100%;
  transform-origin: bottom;
  background: linear-gradient(to top, ${PALETTE.green700} 0%, ${PALETTE.green400} 100%);
  opacity: ${p => (p.$active ? 1 : 0.25)};
  animation: ${p =>
    p.$active
      ? css`
          ${pulse} 0.7s ease-in-out infinite
        `
      : 'none'};
  animation-delay: ${p => p.$delay}s;
`;

const Transport = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
`;

const Btn = styled.button`
  width: 26px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${PALETTE.black};
  border-radius: 2px;
  cursor: pointer;
  color: ${PALETTE.grey100};
  background: linear-gradient(to bottom, ${PALETTE.grey700} 0%, ${PALETTE.grey800} 100%);
  &:hover {
    background: linear-gradient(to bottom, ${PALETTE.grey7002} 0%, ${PALETTE.grey8002} 100%);
  }
  &:active {
    background: ${PALETTE.grey9002};
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
  }
`;

const Slider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: ${PALETTE.black3};
  border: 1px solid ${PALETTE.black};
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(to bottom, ${PALETTE.green300}, ${PALETTE.green600});
    border: 1px solid ${PALETTE.black};
  }
`;

const Seek = styled(Slider)`
  flex: 1;
  margin: 10px 0 2px;
`;

const KnobRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 9px;
  color: ${PALETTE.grey400};
`;

const PlaylistHead = styled.div`
  background: linear-gradient(to bottom, ${PALETTE.blue700} 0%, ${PALETTE.blue800} 100%);
  color: ${PALETTE.blue200};
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-top: 1px solid ${PALETTE.black};
  flex-shrink: 0;
`;

const Playlist = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${PALETTE.black2};
`;

const Row = styled.div<{ $current?: boolean }>`
  display: flex;
  padding: 3px 8px;
  cursor: pointer;
  color: ${p => (p.$current ? PALETTE.green400 : PALETTE.grey200)};
  background: ${p => (p.$current ? PALETTE.green9002 : 'transparent')};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.MONO};
  font-size: 11px;
  &:hover {
    background: ${p => (p.$current ? PALETTE.green9003 : PALETTE.grey900)};
  }
  .num {
    width: 20px;
    color: ${PALETTE.grey600};
  }
  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dur {
    color: ${PALETTE.green500};
  }
`;

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

interface WinampProps {
  windowId?: string;
}

const Winamp: React.FC<WinampProps> = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(78);

  const track = PLAYLIST[index];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setIndex(i => (i + 1) % PLAYLIST.length);
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
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume / 100;
  }, [volume]);

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

  const skip = useCallback((delta: number) => {
    setIndex(i => (i + delta + PLAYLIST.length) % PLAYLIST.length);
    setTime(0);
  }, []);

  // Restart the sample whenever the track changes while playing.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    if (playing) void audio.play().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const seek = useCallback((v: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = (v / 100) * audio.duration;
    setTime(audio.currentTime);
  }, []);

  const seekPct = duration ? (time / duration) * 100 : 0;
  const bars = useMemo(() => Array.from({ length: 18 }, (_, i) => (i % 6) * 0.12), []);

  return (
    <Wrap data-testid="winamp">
      <audio ref={audioRef} src={sampleAudio} preload="metadata" />
      <Player>
        <TitleBar>WINAMP &nbsp;·&nbsp; it really whips the llama&apos;s ass</TitleBar>
        <Lcd>
          <Time data-testid="winamp-time">{fmt(time)}</Time>
          <Meta>
            <Marquee $playing={playing}>
              <span>
                {index + 1}. {track.artist} — {track.title}
              </span>
            </Marquee>
            <div className="kbps">128 kbps &nbsp; 44 kHz &nbsp; stereo</div>
          </Meta>
        </Lcd>
        <Bars>
          {bars.map((d, i) => (
            <Bar key={i} $active={playing} $delay={d} />
          ))}
        </Bars>
        <Seek
          type="range"
          min={0}
          max={100}
          value={Math.round(seekPct)}
          onChange={e => seek(Number(e.target.value))}
          aria-label="seek"
        />
        <Transport>
          <Btn onClick={() => skip(-1)} title="Previous">
            ⏮
          </Btn>
          <Btn data-testid="winamp-play" onClick={toggle} title="Play/Pause">
            {playing ? '⏸' : '▶'}
          </Btn>
          <Btn onClick={stop} title="Stop">
            ⏹
          </Btn>
          <Btn onClick={() => skip(1)} title="Next">
            ⏭
          </Btn>
          <KnobRow style={{ flex: 1, marginTop: 0, marginLeft: 6 }}>
            <span>VOL</span>
            <Slider
              style={{ flex: 1 }}
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              aria-label="volume"
            />
          </KnobRow>
        </Transport>
      </Player>

      <PlaylistHead>Playlist Editor</PlaylistHead>
      <Playlist>
        {PLAYLIST.map((t, i) => (
          <Row
            key={i}
            $current={i === index}
            onDoubleClick={() => {
              setIndex(i);
              setTime(0);
              setPlaying(true);
              const audio = audioRef.current;
              if (audio) {
                audio.currentTime = 0;
                void audio.play().catch(() => undefined);
              }
            }}
          >
            <span className="num">{i + 1}.</span>
            <span className="name">
              {t.artist} — {t.title}
            </span>
            <span className="dur">{t.duration}</span>
          </Row>
        ))}
      </Playlist>
    </Wrap>
  );
};

export default Winamp;
