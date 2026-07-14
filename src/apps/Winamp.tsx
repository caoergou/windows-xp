import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
// Reuse the engine's bundled sample clip (an existing, licence-clear asset) —
// the classic "reuse the WMP audio plumbing" from #123.
import sampleAudio from '../assets/audio/sample.wav';

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
  background: #232323;
  font-family: 'Tahoma', 'MS Sans Serif', sans-serif;
  font-size: 11px;
  color: #d6d6d6;
  user-select: none;
  overflow: hidden;
`;

const Player = styled.div`
  background: linear-gradient(to bottom, #3b3b3b 0%, #202020 100%);
  border-bottom: 1px solid #000;
  padding: 8px;
  flex-shrink: 0;
`;

const TitleBar = styled.div`
  height: 14px;
  background: linear-gradient(to bottom, #2b5a86 0%, #163a5c 100%);
  border: 1px solid #0c2540;
  color: #bcd6ef;
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
  background: #05170b;
  border: 1px solid #000;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.8);
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #35ff6a;
  font-family: 'Courier New', monospace;
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
  background: linear-gradient(to top, #1f7a3a 0%, #35ff6a 100%);
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
  border: 1px solid #000;
  border-radius: 2px;
  cursor: pointer;
  color: #e0e0e0;
  background: linear-gradient(to bottom, #4a4a4a 0%, #2a2a2a 100%);
  &:hover {
    background: linear-gradient(to bottom, #565656 0%, #333 100%);
  }
  &:active {
    background: #1c1c1c;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
  }
`;

const Slider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #111;
  border: 1px solid #000;
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(to bottom, #7bd68f, #2f9a4c);
    border: 1px solid #000;
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
  color: #9a9a9a;
`;

const PlaylistHead = styled.div`
  background: linear-gradient(to bottom, #2b5a86 0%, #163a5c 100%);
  color: #bcd6ef;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 3px 8px;
  border-top: 1px solid #000;
  flex-shrink: 0;
`;

const Playlist = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #0b0b0b;
`;

const Row = styled.div<{ $current?: boolean }>`
  display: flex;
  padding: 3px 8px;
  cursor: pointer;
  color: ${p => (p.$current ? '#35ff6a' : '#c7c7c7')};
  background: ${p => (p.$current ? '#16240f' : 'transparent')};
  font-family: 'Courier New', monospace;
  font-size: 11px;
  &:hover {
    background: ${p => (p.$current ? '#1c2e13' : '#161616')};
  }
  .num {
    width: 20px;
    color: #6a6a6a;
  }
  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dur {
    color: #6a9a76;
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
