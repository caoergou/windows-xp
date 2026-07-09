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
    const playBtn = screen.getByTitle('播放');

    fireEvent.click(playBtn);
    await waitFor(() => {
      expect(screen.getByTitle('暂停')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('暂停'));
    await waitFor(() => {
      expect(screen.getByTitle('播放')).toBeInTheDocument();
    });
  });

  it('stops playback', async () => {
    render(<WindowsMediaPlayer src="/audio/sample.mp3" />);
    fireEvent.click(screen.getByTitle('播放'));
    await waitFor(() => screen.getByTitle('暂停'));

    fireEvent.click(screen.getByTitle('停止'));
    await waitFor(() => {
      expect(screen.getByTitle('播放')).toBeInTheDocument();
    });
  });
});
