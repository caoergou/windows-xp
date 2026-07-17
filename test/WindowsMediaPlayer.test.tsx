import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect } from 'vitest';
import WindowsMediaPlayer, { type MediaPlaylist } from '../src/apps/WindowsMediaPlayer';
import { XPEventBus, type XPEvent } from '../src/events';
import { EventBusProvider } from '../src/context/EventBusContext';

describe('WindowsMediaPlayer', () => {
  beforeEach(() => localStorage.clear());
  it('renders track title derived from src', () => {
    render(<WindowsMediaPlayer src="/audio/sample.mp3" />);
    expect(screen.getByText('sample')).toBeInTheDocument();
  });

  it('toggles play and pause', async () => {
    render(<WindowsMediaPlayer src="/audio/sample.mp3" />);
    const playBtn = screen.getByTitle('Play');

    fireEvent.click(playBtn);
    await waitFor(() => {
      expect(screen.getByTitle('Pause')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Pause'));
    await waitFor(() => {
      expect(screen.getByTitle('Play')).toBeInTheDocument();
    });
  });

  it('stops playback', async () => {
    render(<WindowsMediaPlayer src="/audio/sample.mp3" />);
    fireEvent.click(screen.getByTitle('Play'));
    await waitFor(() => screen.getByTitle('Pause'));

    fireEvent.click(screen.getByTitle('Stop'));
    await waitFor(() => {
      expect(screen.getByTitle('Play')).toBeInTheDocument();
    });
  });

  it('advances playlists and emits stable track identifiers', async () => {
    const playlist: MediaPlaylist = {
      id: 'three-clips',
      tracks: [
        { id: 'one', title: 'First', src: '/audio/one.wav' },
        {
          id: 'two',
          title: 'Second',
          src: '/audio/two.wav',
          controls: { seek: false, skip: false },
        },
        { id: 'three', title: 'Third', src: '/audio/three.wav' },
      ],
    };
    const bus = new XPEventBus();
    const events: XPEvent[] = [];
    bus.subscribe(event => events.push(event));
    const { container } = render(
      <EventBusProvider bus={bus}>
        <WindowsMediaPlayer playlist={playlist} />
      </EventBusProvider>
    );
    fireEvent.ended(container.querySelector('audio') as HTMLAudioElement);
    await waitFor(() => expect(screen.getByText(/Second \(2\/3\)/)).toBeInTheDocument());
    expect(events).toContainEqual({
      type: 'media:track-change',
      playlistId: 'three-clips',
      trackId: 'two',
      index: 1,
    });
    expect(screen.getByTitle('Next')).toBeDisabled();
    expect(container.querySelector('input[type="range"]')).toBeDisabled();
  });

  it('keeps the legacy single-src path', () => {
    render(<WindowsMediaPlayer src="/audio/legacy.mp3" />);
    expect(screen.getByText('legacy')).toBeInTheDocument();
    expect(screen.queryByTitle('Next')).not.toBeInTheDocument();
  });
});
