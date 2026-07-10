import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WindowsMediaPlayer from '../src/apps/WindowsMediaPlayer';

describe('WindowsMediaPlayer', () => {
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
});
